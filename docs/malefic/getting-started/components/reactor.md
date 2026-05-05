---
title: Reactor
description: malefic-reactor 是一个独立的顶层 crate，编译为 maleficreactor.dll（Windows）/ libmaleficreactor.so（Linux），
  外部程序通过 C ABI 加载后即可动态加载 module 插件并执行——本质上是一个 headless malefic ， 不...
edition: community
generated: false
source: imp:getting-started/components/reactor.md
---

# malefic-reactor

`malefic-reactor` 是一个独立的顶层 crate，编译为 `malefic_reactor.dll`（Windows）/ `libmalefic_reactor.so`（Linux），
外部程序通过 C ABI 加载后即可动态加载 module 插件并执行——本质上是一个 **headless malefic** ，
不依赖网络、beacon、transport，仅保留模块加载与执行能力。

头文件 `malefic-reactor/include/malefic_reactor.h` 由 cbindgen 在编译时自动生成，无需手动维护。

---

## 架构

```
              Module DLL (pwd.dll, cat.dll, ...)
                  │
                  │ C ABI (rt_module_run, callbacks)
                  ▼
            ┌─────────────┐
            │   runtime   │  协议定义 + 桥接 (无状态)
            │             │  abi / codec / rtmodule / host
            └──────┬──────┘
                   │ RtVTable / RtBundle / RtModuleProxy
                   ▼
            ┌─────────────┐
            │   manager   │  模块注册表 + internal 调度 (有状态)
            │             │  dispatch_internal() / get_module()
            └──────┬──────┘
          ┌────────┴────────┐
          ▼                 ▼
  ┌──────────────┐  ┌──────────────┐
  │   stub.rs    │  │   reactor    │
  │ (beacon/bind)│  │ (headless)   │
  │              │  │              │
  │ + 网络传输   │  │ + C ABI 导出 │
  │ + scheduler  │  │ + block_on   │
  │ + switch     │  │ + cbindgen   │
  │ + sleep      │  │              │
  │ + keepalive  │  │              │
  └──────────────┘  └──────────────┘
```

**runtime** 是纯协议层，定义 Module DLL 与 Host 之间的 C ABI 通讯协议，不持有状态。
对下提供 `rtmodule`（RtModule trait + RtChannel），对上提供 `host`（RtVTable + RtModuleProxy 桥接）。

**manager** 是有状态的模块注册中心。`dispatch_internal()` 是共享的 internal module 调度入口，
beacon/bind 的 stub 和 headless 的 reactor 都调用它处理 ping/init/list_module/refresh_module/load_module/clear。
Beacon-only 模块（sleep/suicide/switch/keepalive/key_exchange）由 stub 单独处理。

**reactor** 是唯一的 headless 对外入口（cdylib），持有 `MaleficManager`，
通过 6 个 C ABI 函数将模块能力暴露给任意外部程序。

### rt_host_execute 调度流程

```
rt_host_execute(name, body)
  │
  ├─ manager.dispatch_internal()
  │   ├─ "ping"           → echo nonce
  │   ├─ "init"           → Register(sysinfo + module list)
  │   ├─ "list_module"    → Modules(names)
  │   ├─ "refresh_module" → reload + Modules
  │   ├─ "load_module"    → load DLL + Modules
  │   ├─ "clear"          → clean + Empty
  │   ├─ beacon-only      → Error("not supported in reactor")
  │   └─ 非 internal      → fall through
  │
  └─ manager.get_module(name) → block_on(module.run())
```

---

## 编译

### 通过 mutant 编译（推荐）

```bash
# 空壳 DLL（仅支持运行时动态加载模块）
malefic-mutant build reactor

# 内置 base 模块集
malefic-mutant build reactor -m base

# 内置全部模块
malefic-mutant build reactor -m full

# 内置扩展模块集
malefic-mutant build reactor -m extend

# 精确控制：组合多个 feature
malefic-mutant build reactor -m "base,execute_bof,execute_assembly"

# 指定编译目标
malefic-mutant build -t x86_64-pc-windows-gnu reactor -m base
```

mutant 会自动附加 `source` feature（从源码编译 win-kit），并以 release `--lib` 模式构建。

### 直接 cargo 编译

```bash
# 空壳 DLL（默认 source + tokio）
cargo build -p malefic-reactor

# 使用 prebuild（预编译二进制，跳过 win-kit 源码编译）
cargo build -p malefic-reactor --no-default-features --features "tokio,prebuild"

# 内置 base 模块集
cargo build -p malefic-reactor --features base

# 内置全部模块
cargo build -p malefic-reactor --features full

# Release 编译
cargo build -p malefic-reactor --release --features base
```

### 产物路径

| 模式 | Windows | Linux |
|------|---------|-------|
| Debug | `target/debug/malefic_reactor.dll` | `target/debug/libmalefic_reactor.so` |
| Release | `target/release/malefic_reactor.dll` | `target/release/libmalefic_reactor.so` |
| mutant | `target/<target>/release/malefic_reactor.dll` | — |

### Feature 参考

**构建类型：**

| Feature | 说明 |
|---------|------|
| `source` | 从源码编译 win-kit（默认） |
| `prebuild` | 使用预编译二进制 |

**异步运行时（三选一）：**

| Feature | 说明 |
|---------|------|
| `tokio` | tokio 多线程（默认） |
| `async-std` | async-std |
| `smol` | smol 轻量运行时 |

**内置模块（与 `malefic-modules` 完全一致）：**

| Feature | 包含模块 |
|---------|---------|
| `base` | pwd, ls, cd, rm, cp, mv, cat, upload, download, exec, env, info |
| `extend` | base + bypass, kill, whoami, ps, netstat, registry, service, taskschd, bof, shellcode, assembly, armory 等 |
| `full` | 所有模块 |
| `fs_full` | 全部文件系统模块 |
| `sys_full` | 全部系统模块 |
| `execute_full` | 全部执行模块 |
| `net_full` | upload, download |
| `execute_assembly` | .NET Assembly 执行 |
| `execute_powershell` | PowerShell 执行 |
| `execute_bof` | BOF 执行 |

> **注意** : `builtin` 模式下仍可通过 `rt_host_execute("load_module", ...)` 额外加载动态模块 DLL，两者共存。

---

## FFI 接口

Reactor DLL 导出 **4 个** C ABI 函数。所有模块操作（包括 list_module、load_module）
都通过 `rt_host_execute` 统一入口。完整类型定义见 cbindgen 自动生成的 `malefic_reactor.h`。

### 数据类型

```c
typedef struct RtHost RtHost;           // 不透明句柄

typedef struct {
    uint8_t *ptr;
    uint32_t len;
} CRtBuffer;                            // FFI 缓冲区

typedef enum {
    CRtStatus_Error = 1,                // out 包含 UTF-8 错误消息
    CRtStatus_Done  = 2,                // out 包含 protobuf Spite
} CRtStatus;
```

### 函数签名

```c
// 初始化
RtHost *rt_host_init(void);

// 关闭
void rt_host_shutdown(RtHost *host);

// 执行模块（同步阻塞，统一入口）
CRtStatus rt_host_execute(
    RtHost        *host,
    uint32_t       task_id,
    const uint8_t *module_name,     // UTF-8 模块名
    uint32_t       name_len,
    const uint8_t *body,            // protobuf Spite (输入，可为 NULL)
    uint32_t       body_len,
    CRtBuffer     *out              // 输出
);

// 释放 out 缓冲区
void rt_host_free(CRtBuffer buf);
```

### 通过 execute 调用 internal module

```c
// ping
rt_host_execute(host, 1, "ping", 4, spite_ping, len, &out);

// list_module — 返回 Spite<Modules>
rt_host_execute(host, 1, "list_module", 11, NULL, 0, &out);

// load_module — body 为 Spite<LoadModule>
rt_host_execute(host, 1, "load_module", 11, spite_load, len, &out);

// refresh_module / clear / init — 同理
```

---

## 通讯协议

所有跨 FFI 边界的业务数据使用 **protobuf 编码的 `Spite` 消息**。
`Spite` 定义于 `malefic-proto`，核心结构：

```protobuf
message Spite {
    string name    = 1;   // 模块名
    uint32 task_id = 2;   // 任务 ID
    bool   async   = 3;
    uint64 timeout = 4;
    uint32 error   = 5;
    Status status  = 6;
    // 具体的 body 类型取决于模块（oneof）
    Request        request         = 24;
    Response       response        = 25;
    BinaryResponse binary_response = 27;
    UploadRequest  upload_request  = 106;
    Block          block           = 11;
    Ack            ack             = 13;
    Empty          empty           = 10;
    // ...更多类型
}
```

### 执行流程

```
外部程序                       malefic_reactor.dll              Module DLL
────────                       ───────────────────              ──────────
  │                                    │                              │
  │  rt_host_init()                    │                              │
  │───────────────────────────────────►│                              │
  │◄── host handle                     │                              │
  │                                    │                              │
  │  rt_host_load_plugin(dll_bytes)    │                              │
  │───────────────────────────────────►│  in-memory PE load           │
  │                                    │─────────────────────────────►│
  │                                    │  resolve rt_* exports        │
  │                                    │◄─────────────────────────────│
  │◄── 0 (success)                     │                              │
  │                                    │                              │
  │  rt_host_execute("pwd", spite)     │                              │
  │───────────────────────────────────►│  rt_module_create("pwd")     │
  │                                    │─────────────────────────────►│
  │                                    │◄── handle                    │
  │                                    │  rt_module_run(handle, ...)  │
  │                                    │─────────────────────────────►│
  │                                    │    ┌─ ch.recv() ◄── input    │
  │                                    │    │  处理...                │
  │                                    │    └─ return Done(body)      │
  │                                    │◄─────────────────────────────│
  │                                    │  rt_module_destroy(handle)   │
  │                                    │─────────────────────────────►│
  │◄── CRtStatus_Done + output spite   │                              │
  │                                    │                              │
  │  rt_host_shutdown()                │                              │
  │───────────────────────────────────►│                              │
```

### 输入构造

调用 `rt_host_execute` 时，`body` 参数需要传入 protobuf 编码的 `Spite`：

```rust
use malefic_proto::proto::implantpb::{Spite, spite::Body};
use malefic_proto::proto::modulepb::Request;
use prost::Message;

let spite = Spite {
    task_id: 1,
    body: Some(Body::Request(Request {
        name: "pwd".into(),
        ..Default::default()
    })),
    ..Default::default()
};
let bytes = spite.encode_to_vec();
// bytes 即为 body 参数
```

对于其他语言（C/C#/Go/Python），使用对应语言的 protobuf 库根据 `.proto` 文件生成编解码代码。

### 输出解码

`rt_host_execute` 成功时（`CRtStatus_Done`），`out` 缓冲区包含 protobuf 编码的 `Spite`。
解码后从 `body` 字段获取模块返回值：

```rust
let spite = Spite::decode(out_bytes).unwrap();
match spite.body {
    Some(Body::Response(resp))       => println!("output: {}", resp.output),
    Some(Body::BinaryResponse(resp)) => println!("data: {} bytes", resp.data.len()),
    Some(Body::Ack(ack))             => println!("ack: id={}", ack.id),
    _ => {}
}
```

失败时（`CRtStatus_Error`），`out` 缓冲区包含 UTF-8 错误消息字符串（非 protobuf）。

---

## 完整 C 示例

完整可编译的测试代码见 `malefic-reactor/tests/c/test_reactor.c`。

以下为 Windows 平台的简化示例（通过 `LoadLibrary` 动态加载）：

```c
#include <windows.h>
#include <stdio.h>
#include <stdint.h>
#include "malefic_reactor.h"

typedef RtHost*   (*fn_init)(void);
typedef void      (*fn_shutdown)(RtHost*);
typedef CRtStatus (*fn_execute)(RtHost*, uint32_t, const uint8_t*, uint32_t,
                                const uint8_t*, uint32_t, CRtBuffer*);
typedef void      (*fn_free)(CRtBuffer);

int main() {
    HMODULE dll = LoadLibraryA("malefic_reactor.dll");
    fn_init     init     = (fn_init)     GetProcAddress(dll, "rt_host_init");
    fn_shutdown shutdown = (fn_shutdown) GetProcAddress(dll, "rt_host_shutdown");
    fn_execute  execute  = (fn_execute)  GetProcAddress(dll, "rt_host_execute");
    fn_free     hfree    = (fn_free)     GetProcAddress(dll, "rt_host_free");

    RtHost *host = init();

    // 执行 ping
    uint8_t spite_ping[] = { 0x10,0x01, 0xB2,0x01,0x02, 0x08,0x2A };
    CRtBuffer out = {0};
    CRtStatus status = execute(host, 1,
                               (uint8_t*)"ping", 4,
                               spite_ping, sizeof(spite_ping), &out);
    if (status == CRtStatus_Done) {
        printf("ping ok: %u bytes\n", out.len);
    } else {
        printf("error: %.*s\n", out.len, out.ptr);
    }
    hfree(out);

    // 列出模块 (通过 execute)
    CRtBuffer list_out = {0};
    execute(host, 2, (uint8_t*)"list_module", 11, NULL, 0, &list_out);
    // list_out 包含 protobuf Spite<Modules>
    hfree(list_out);

    shutdown(host);
    FreeLibrary(dll);
    return 0;
}
```

Linux 平台使用 `dlopen` / `dlsym` 替代 `LoadLibrary` / `GetProcAddress`，
完整跨平台实现见 `malefic-reactor/tests/c/test_reactor.c`。

---

## Module 通讯模式

Module DLL 内部通过 `RtChannel` 与 host 双向通讯，支持三种模式：

### Request-Response（单次请求应答）

```rust
fn run(&mut self, _task_id: u32, ch: &RtChannel) -> RtResult {
    let body = ch.recv()?;                    // 接收输入
    let output = process(body);               // 处理
    RtResult::Done(Body::Response(output))    // 返回结果
}
```

### Streaming（模块连续输出）

```rust
fn run(&mut self, _task_id: u32, ch: &RtChannel) -> RtResult {
    let config = ch.recv()?;                  // 接收配置
    for i in 0..10 {
        ch.send(Body::Response(...))?;        // 推送中间结果
    }
    RtResult::Done(Body::Response(...))       // 最终结果
}
```

### Bidirectional（双向流式）

```rust
fn run(&mut self, _task_id: u32, ch: &RtChannel) -> RtResult {
    loop {
        match ch.recv() {
            Ok(body) => {
                let resp = transform(body);
                ch.send(resp)?;               // echo back
            }
            Err(_) => break,                  // 输入结束
        }
    }
    RtResult::Done(Body::Response(...))
}
```

> **注意** : 当前 `rt_host_execute` 仅支持 **单次输入** 的同步调用。
> 流式和双向模式需要使用 Module trait 的 async 接口（通过 `RtModuleProxy`）
> 或未来扩展的 `rt_host_execute_stream` FFI。

---

## 测试验证

### 一键测试

```bash
# 从 workspace 根目录：
bash malefic-reactor/tests/c/build_and_test.sh
```

### 手动测试

**Windows：**
```bash
# 编译
malefic-mutant build reactor
cargo build -p test-runtime-plugin

# 编译 C 测试
gcc -o test_reactor.exe malefic-reactor/tests/c/test_reactor.c -I malefic-reactor/include

# 运行
cp target/x86_64-pc-windows-gnu/release/malefic_reactor.dll .
cp target/debug/test_runtime_plugin.dll .
./test_reactor.exe test_runtime_plugin.dll
```

**Linux (WSL, builtin 模式)：**
```bash
# 编译（内置 base 模块，因 Linux 不支持动态 PE 加载）
cargo build -p malefic-reactor --features base

# 编译 C 测试
gcc -o test_reactor malefic-reactor/tests/c/test_reactor.c -I malefic-reactor/include -ldl

# 运行
cp target/debug/libmalefic_reactor.so .
./test_reactor
```

### C 测试覆盖

| 测试 | 说明 |
|------|------|
| `test_init_shutdown` | 生命周期正确 |
| `test_free_empty` | 空缓冲区释放不崩溃 |
| `test_execute_unknown` | 未知模块返回 CRtStatus_Error |
| `test_ping` | internal module: ping echo nonce |
| `test_list_module` | internal module: list_module 返回 Spite<Modules> |
| `test_beacon_only_rejected` | beacon-only module (sleep) 返回错误 |
| `test_execute_pwd_builtin` | 执行 pwd (builtin) → 验证输出包含路径 |
