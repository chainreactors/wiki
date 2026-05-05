---
title: 多语言模块模板
description: malefic-3rd-template 是 malefic 的多语言第三方模块开发框架，支持 Rust、Go、C、Zig、Nim 五种语言开发自定义模块，编译为独立
  DLL 动态加载到运行中的 implant。
edition: community
generated: false
source: imp:develop/module-development.md
---

# 多语言模块模板

malefic-3rd-template 是 malefic 的多语言第三方模块开发框架，支持 **Rust、Go、C、Zig、Nim** 五种语言开发自定义模块，编译为独立 DLL 动态加载到运行中的 implant。

项目地址: https://github.com/chainreactors/malefic-3rd-template

## 与 malefic-3rd 的区别

| 维度 | malefic-3rd | malefic-3rd-template |
|------|-------------|---------------------|
| 定位 | 官方维护的第三方模块集合 | 用户自定义模块开发模板 |
| 模块 | rem、curl、pty、onedrive 等 | 各语言示例模块 |
| 语言 | 仅 Rust | Rust、Go、C、Zig、Nim |
| 编译 | 可静态链接或 DLL | 仅 DLL |

两者使用完全相同的 `Module` + `ModuleImpl` trait，编译产物相同（cdylib DLL），通过 `load_module` 以相同方式加载。

## 快速开始

```bash
git clone https://github.com/chainreactors/malefic-3rd-template.git
cd malefic-3rd-template

# 编译全部语言模块
cargo build --target x86_64-pc-windows-gnu --features full --release

# 仅编译 Rust 模块
cargo build --target x86_64-pc-windows-gnu --no-default-features \
  --features "as_cdylib,rust_module" --release

# 加载到 implant
load_module --path target/x86_64-pc-windows-gnu/release/malefic_3rd.dll
```

---

## 模块编写

所有语言的模块统一使用 `Module` + `ModuleImpl` trait。`#[module_impl]` 宏自动生成 `name()`、`new()`、`new_instance()` 和同步桥接方法，用户只需实现 `ModuleImpl::run()`。

DLL 导出的 C ABI 适配（`impl RtModule`）也由 `#[module_impl]` 宏自动生成，对用户完全无感。

### Rust 模块

最简单的方式，与 malefic-modules 中的写法完全一致：

```rust
use malefic_3rd_ffi::*;

pub struct RustModule {}

#[async_trait]
#[module_impl("rust_module")]
impl Module for RustModule {}

#[async_trait]
impl ModuleImpl for RustModule {
    async fn run(
        &mut self,
        id: u32,
        receiver: &mut Input,
        _sender: &mut Output,
    ) -> ModuleResult {
        let request = check_request!(receiver, Body::Request)?;
        Ok(TaskResult::new_with_body(id, Body::Response(Response {
            output: "hello from rust module".to_string(),
            ..Default::default()
        })))
    }
}
```

Rust 模块可以使用 async、sender 多次发送、分块传输等全部特性。

### C / Zig / Nim 模块

这三种语言遵循统一的 FFI 协议。Rust 桥接层在 `ModuleImpl::run()` 中调用 `ffi_run_loop()` 完成数据转换：

```rust
use malefic_3rd_ffi::*;

extern "C" {
    fn CModuleHandle(
        task_id: c_uint, req_data: *const c_char, req_len: c_int,
        resp_data: *mut *mut c_char, resp_len: *mut c_int,
    ) -> c_int;
}

pub struct CModule {}

#[async_trait]
#[module_impl("example_c")]
impl Module for CModule {}

#[async_trait]
impl ModuleImpl for CModule {
    async fn run(&mut self, id: u32, receiver: &mut Input, sender: &mut Output) -> ModuleResult {
        ffi_run_loop(id, receiver, sender, CModuleHandle, "CModuleHandle").await
    }
}
```

外部语言侧实现两个 C ABI 函数：

```c
const char* XxxModuleName(void);

int XxxModuleHandle(
    uint32_t task_id,
    const char* req_data, int req_len,      // 序列化的 Request protobuf
    char** resp_data, int* resp_len          // [out] malloc 分配的响应
);
```

- 返回 0 表示成功，非 0 表示错误
- `resp_data` 必须通过 `malloc()` 分配（Rust 侧自动 `free()`）
- 使用 nanopb（轻量级 C protobuf 库）进行序列化

`ffi_run_loop()` 使同步 FFI handler 也能支持多轮请求/响应流式通信，无需修改外部语言代码。

### Go 模块

Go 使用 push-pull 模型（GoModuleSend/GoModuleRecv），桥接层手写 async `run()`：

```rust
pub struct GolangModule {}

#[async_trait]
#[module_impl("example_go")]
impl Module for GolangModule {}

#[async_trait]
impl ModuleImpl for GolangModule {
    async fn run(&mut self, id: u32, receiver: &mut Input, sender: &mut Output) -> ModuleResult {
        // receiver.next().await 接收请求
        // encode_request() → go_send() 发给 Go
        // go_recv_blocking() → decode_response() 收 Go 响应
        // sender.unbounded_send() 发送中间结果
        // ...
    }
}
```

Go 侧支持两种接口：

**简单处理器** （无状态）：

```go
type GoModuleHandler interface {
    Name() string
    Handle(taskId uint32, req *Request) (*Response, error)
}
```

**流式模块** （有状态）：

```go
type GoModule interface {
    Name() string
    Run(taskId uint32, input <-chan *Request, output chan<- *Response)
}
```

---

## 依赖架构

Template 通过 `malefic-3rd-ffi` crate 统一导入所有需要的类型和工具：

```rust
use malefic_3rd_ffi::*;
// 提供：Module, ModuleImpl, Input, Output, ModuleResult, TaskResult,
//       Body, Response, Request, check_request!, check_field!,
//       ffi_run_loop, FfiBuffer, encode_request, decode_response,
//       c_char, c_int, c_uint, async_trait, module_impl ...
```

`malefic-3rd-ffi` 本身是纯 re-export 层，不包含实现代码，所有功能来自：

| 来源 | 提供 |
|------|------|
| `malefic-module` (prelude) | `Module`/`ModuleImpl` trait、`TaskResult`、辅助宏 |
| `malefic-module` (ffi) | `ffi_run_loop`、`FfiBuffer`、`encode_request`/`decode_response`、`HandlerFn` |
| `malefic-gateway` | `#[module_impl]` 宏、`#[obfuscate]` 宏 |
| `malefic-proto` | protobuf 消息类型（`Body`、`Request`、`Response`） |

子 crate 只依赖 `malefic-3rd-ffi`，不直接依赖 `malefic-macro` 或 `malefic-obfuscate`（通过 `malefic-gateway` 中转，避免强耦合）。

---

## Feature 系统

```toml
[features]
default = ["as_cdylib", "full"]
as_cdylib = []

full = ["rust_module", "golang_module", "c_module", "zig_module", "nim_module"]

rust_module   = ["malefic-3rd-rust"]
golang_module = ["malefic-3rd-go"]
c_module      = ["malefic-3rd-c"]
zig_module    = ["malefic-3rd-zig"]
nim_module    = ["malefic-3rd-nim"]
```

按需选择语言模块：

```bash
# 仅 Rust + Go
cargo build --target x86_64-pc-windows-gnu --no-default-features \
  --features "as_cdylib,rust_module,golang_module" --release
```

---

## 添加新模块

### 步骤 1：创建 crate

```
malefic-3rd-yourmod/
├── Cargo.toml
└── src/lib.rs
```

`Cargo.toml`：

```toml
[dependencies]
malefic-3rd-ffi = { path = "../malefic-3rd-ffi" }
```

### 步骤 2：实现模块

```rust
use malefic_3rd_ffi::*;

pub struct YourModule {}

#[async_trait]
#[module_impl("your_module")]
impl Module for YourModule {}

#[async_trait]
impl ModuleImpl for YourModule {
    async fn run(&mut self, id: u32, receiver: &mut Input, _sender: &mut Output) -> ModuleResult {
        let request = check_request!(receiver, Body::Request)?;
        Ok(TaskResult::new_with_body(id, Body::Response(Response {
            output: format!("hello from {}", request.input),
            ..Default::default()
        })))
    }
}
```

### 步骤 3：更新根配置

```toml
# Cargo.toml
[workspace]
members = [..., "malefic-3rd-yourmod"]

[features]
yourmod = ["malefic-3rd-yourmod"]
full = [..., "yourmod"]

[dependencies]
malefic-3rd-yourmod = { path = "malefic-3rd-yourmod", optional = true }
```

### 步骤 4：注册模块

在 `src/lib.rs` 的 `register_rt_modules!` 宏中添加：

```rust
#[cfg(feature = "yourmod")]
malefic_3rd_yourmod::YourModule,
```

### 步骤 5：编译测试

```bash
cargo build --target x86_64-pc-windows-gnu --no-default-features \
  --features "as_cdylib,yourmod" --release
```

---

## 编译配置

```toml
[profile.release]
panic = "abort"
opt-level = "z"        # 体积优化
strip = true
lto = "fat"
codegen-units = 1
```

为兼容 Rust 1.74，模板锁定了部分传递依赖版本（`crypto-common`、`bytes`、`hashbrown`、`getrandom`）。

---

## 相关文档

- [模块文档](/malefic/develop/modules/) — Module trait 定义与内置模块列表
- [3rd 模块](/malefic/develop/3rd-party/) — 官方第三方模块（rem、curl、pty 等）
- [编译手册](/malefic/getting-started/) — 完整编译流程
