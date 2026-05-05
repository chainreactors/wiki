---
title: Runtime
description: malefic-runtime 定义了 malefic 的跨版本模块加载协议。它是 malefic-reactor 和 implant 热加载能力的基础。
edition: community
generated: false
source: imp:getting-started/components/runtime.md
---

# malefic-runtime

`malefic-runtime` 定义了 malefic 的跨版本模块加载协议。它是 `malefic-reactor` 和 implant 热加载能力的基础。

## 设计动机

Rust 没有稳定的 ABI。不同 Rust 版本编译的 `Box<dyn Trait>` 内存布局可能不同，跨版本加载 DLL 会导致 UB 或崩溃。这意味着：

- 模块 DLL 必须与 implant 使用完全相同的 Rust 版本编译
- 每次 implant 升级，所有模块都需要重新编译
- 社区贡献的模块无法保证版本匹配

解决方案： **纯 C ABI 协议** 。C ABI 是所有语言和编译器都遵守的最小公约数。

## 架构

runtime 分为两个层面：

### 模块侧（RtModule API）

定义在 `malefic-module` 的 `rtmodule` 中，模块 DLL 实现这些接口：

```rust
pub trait RtModule: Send + 'static {
    fn name() -> &'static str;
    fn new() -> Self;
    fn run(&mut self, task_id: u32, channel: &RtChannel) -> RtResult;
}
```

`RtChannel` 提供同步的双向通信：

- `send(Body)` — 推送数据到宿主
- `recv()` — 阻塞接收宿主数据
- `try_recv()` — 非阻塞轮询

通过 `register_rt_modules!` 宏，一行代码生成全部 7 个 C ABI 导出：

```rust
register_rt_modules!(Module1, Module2, Module3);
// 生成: rt_abi_version, rt_module_count, rt_module_name,
//       rt_module_create, rt_module_destroy, rt_module_run, rt_free
```

### 宿主侧（Host Bridge）

定义在 `malefic-runtime/src/host.rs`，宿主（implant 或 reactor）使用这些组件加载模块 DLL：

| 组件 | 职责 |
|------|------|
| `RtVTable` | 从 DLL 解析 7 个 C 函数指针 |
| `RtBundle` | 枚举 DLL 中的所有模块 |
| `RtModuleProxy` | 将 C ABI 模块包装为 `Module` trait 对象 |
| `RtBridge` | 将任意 `Module` 强制到阻塞线程池执行 |
| `PluginLoader` | 管理 DLL 的内存加载/卸载生命周期 |

## C ABI 协议

模块 DLL 导出 7 个 `extern "C"` 函数：

```c
// 版本协商
uint32_t rt_abi_version(void);              // 当前: RT_ABI_VERSION = 2

// 模块枚举
uint32_t rt_module_count(void);
RtBuffer  rt_module_name(uint32_t index);

// 模块生命周期
RtModuleHandle* rt_module_create(const uint8_t* name, uint32_t len);
void            rt_module_destroy(RtModuleHandle* handle);

// 模块执行
RtStatus rt_module_run(
    RtModuleHandle* handle,
    uint32_t        task_id,
    void*           ctx,           // 宿主上下文（不透明）
    RtSendFn        send_fn,       // 回调: 模块 → 宿主
    RtRecvFn        recv_fn,       // 回调: 宿主 → 模块（阻塞）
    RtTryRecvFn     try_recv_fn,   // 回调: 宿主 → 模块（非阻塞）
    RtHostFreeFn    host_free_fn,  // 回调: 释放宿主分配的内存
    RtBuffer*       final_out      // 输出
);

// 内存释放
void rt_free(RtBuffer buf);
```

### 内存安全

关键不变量： **模块和宿主各自使用自己的分配器** 。

- 模块分配的 `RtBuffer` → 由模块的 `rt_free()` 释放
- 宿主分配的内存 → 由 `host_free_fn` 回调释放
- 宿主收到模块输出后，先 `memcpy` 到自己的内存，再调用模块的 `rt_free`

这保证了即使两端使用不同 Rust 版本（不同的 allocator 实现）也不会出现 UB。

## RtBridge：同步到异步桥接

内置模块使用 `async fn run()` 编写，但 C ABI 是同步的。`RtBridge` 解决这个问题：

```
#[module_impl] 宏生成 rt_run():
    创建 noop_waker
    loop {
        match future.poll(&mut cx) {
            Poll::Ready(r) => return r,
            Poll::Pending => thread::sleep(1ms),
        }
    }

RtBridge::run():
    spawn_blocking(move || module.rt_run(id, recv, send))
```

所有模块（内置 async 和热加载 DLL）统一在阻塞线程池执行，行为一致。

## 数据类型

### C ABI 类型（跨编译器安全）

```c
typedef struct { uint8_t* ptr; uint32_t len; } RtBuffer;
typedef enum { Error = 1, Done = 2 } RtStatus;
typedef struct { uint8_t _opaque[0]; } RtModuleHandle;  // 不透明句柄
```

### 回调函数签名

```c
typedef int32_t (*RtSendFn)(void* ctx, const uint8_t* data, uint32_t len);
typedef int32_t (*RtRecvFn)(void* ctx, uint8_t** out_data, uint32_t* out_len);
typedef int32_t (*RtTryRecvFn)(void* ctx, uint8_t** out_data, uint32_t* out_len);
typedef void    (*RtHostFreeFn)(uint8_t* ptr, uint32_t len);
```

## Feature Flags

| Feature | 说明 |
|---------|------|
| `host` | 启用宿主侧桥接（RtVTable, RtBundle, RtModuleProxy, RtBridge） |
| `loader` | 启用 PluginLoader（内存 PE 加载/卸载） |
| `tokio` / `async-std` / `smol` | 异步运行时（`host` 模式需要） |

## 测试覆盖

runtime 包含 44 个测试：

| 类别 | 数量 | 说明 |
|------|------|------|
| 单元测试 | 12 | codec、buffer 生命周期、mock C ABI |
| E2E 测试 | 9 | 加载真实 DLL，测试 pwd/cat 模块 |
| 集成测试 | 12 | manager + plugin 完整工作流 |
| 跨版本测试 | 6 | 不同 Rust 版本编译的 DLL 互操作 |
| 并发测试 | 5 | 多线程并发加载/执行 |

## 相关文档

- [Reactor 文档](/malefic/getting-started/components/reactor/) — 基于 runtime 的独立模块引擎
- [模块文档](/malefic/develop/modules/) — Module trait 定义与开发指南
- [3rd Template](/malefic/develop/module-development/) — 多语言模块开发模板
