---
title: Third-Party Modules
description: malefic-3rd 是官方维护的第三方模块集合，提供需要外部依赖的扩展功能。与 malefic-modules 使用完全相同的 Module
  + ModuleImpl trait，区别在于可以引入任意第三方 crate。
edition: community
generated: false
source: imp:develop/3rd-party.md
---

# Third-Party Modules

malefic-3rd 是官方维护的第三方模块集合，提供需要外部依赖的扩展功能。与 malefic-modules 使用完全相同的 `Module` + `ModuleImpl` trait，区别在于可以引入任意第三方 crate。

## 可用模块

### rem — REM 协议

REM 是 IoM 的自定义通信协议，提供灵活的流量伪装能力。

- `rem_dial` — REM 拨号连接
- `memory_dial` — 内存中建立连接

启用后可在 `implant.yaml` 中配置 REM 连接：

```yaml
basic:
  targets:
    - address: "127.0.0.1:34996"
      rem:
        link: "tcp://key:@127.0.0.1:12345?wrapper=lsJy"
```

相关文档：[REM 用法](https://wiki.chainreactors.red/rem/usage/)

### curl — HTTP 客户端

基于 `ureq` 的 HTTP 客户端，支持 GET/POST/PUT/DELETE、自定义 Header、代理、TLS。

### onedrive — OneDrive 文件操作

基于 `ureq` + `serde_json` 的 OneDrive/SharePoint 文件操作模块。

### pty — 伪终端

基于 `portable-pty` 的跨平台伪终端，支持交互式 shell 会话（Windows/Linux/macOS）。

### ffmpeg — 视频处理

基于 `ez-ffmpeg` 的视频处理（静态链接）。屏幕录制、格式转换等。

**注意** ：此模块会显著增加二进制体积（+10MB）。

### hook — Detour 钩子（Windows）

基于 `malefic-os-win/detour` 的 API 钩子能力。仅 Windows。

### autofind — 自动查找（Windows）

自动查找系统中的依赖和目标。仅 Windows。

### agent — AI Agent

基于 `moltis-agents` 的 AI agent 模块，支持 provider bridge 模式。

---

## Feature 配置

```toml
[features]
default = []
full = ["rem", "curl", "pty", "onedrive"]

curl = ["dep:ureq"]
onedrive = ["dep:ureq", "ureq/tls", "dep:serde", "dep:serde_json"]
rem = ["malefic-rem/rem", "malefic-rem/rem_static", "rem_dial", "memory_dial"]
pty = ["portable-pty", "futures-timer"]
ffmpeg = ["ez-ffmpeg"]
hook = ["malefic-os-win/detour", "windows"]
auto_find = ["malefic-os-win/reg", "windows"]
agent = ["dep:moltis-agents", "dep:serde_json", "dep:tokio"]

as_module_dll = ["malefic-module/ffi"]   # 编译为独立 DLL
```

## 使用方式

### 方式 1：静态编译到 Beacon

在 `implant.yaml` 中配置：

```yaml
implants:
  enable_3rd: true
  3rd_modules:
    - full              # 预设：rem + curl + pty + onedrive
    # 或单独指定
    - rem
    - curl
```

编译：

```bash
malefic-mutant generate beacon
cargo build --release -p malefic --target x86_64-pc-windows-gnu
```

### 方式 2：编译为独立 DLL

```bash
malefic-mutant build 3rd -m rem,curl --target x86_64-pc-windows-gnu
```

编译产物：`target/<target_triple>/release/malefic_3rd.dll`

### 方式 3：动态加载

```bash
load_module --3rd rem
# 或加载本地 DLL
load_module --3rd /path/to/malefic_3rd.dll
```

## 注册机制

malefic-3rd 同时支持两种注册路径：

```rust
// 静态链接路径
pub extern "C" fn register_3rd() -> MaleficBundle {
    let mut map: MaleficBundle = HashMap::new();
    #[cfg(feature = "rem")]
    {
        register_module!(map, "rem_dial", rem::RemDial);
        register_module!(map, "memory_dial", rem::MemoryDial);
    }
    #[cfg(feature = "curl")]
    register_module!(map, "curl", curl::Curl);
    // ...
    map
}

// DLL 热加载路径
#[cfg(feature = "as_module_dll")]
malefic_module::register_rt_modules!(
    #[cfg(feature = "rem")] rem::RemDial,
    #[cfg(feature = "rem")] rem::MemoryDial,
    #[cfg(feature = "curl")] curl::Curl,
    // ...
);
```

与 malefic-modules 的机制完全一致：`register_3rd()` 用于静态链接，`register_rt_modules!` 生成 C ABI 导出用于 DLL 热加载。

## 开发自定义第三方模块

如果需要开发自己的第三方模块，有两种选择：

- **Rust 模块** ：直接在 malefic-3rd 中添加，使用标准 `Module` + `ModuleImpl` trait
- **多语言模块** ：使用 [malefic-3rd-template](/malefic/develop/module-development/)，支持 Rust/Go/C/Zig/Nim

## 相关文档

- [3rd Template](/malefic/develop/module-development/) — 多语言自定义模块开发模板
- [Modules](/malefic/develop/modules/) — 内置模块与 Module trait 定义
- [编译手册](/malefic/getting-started/) — 完整编译流程
- [REM 协议](https://wiki.chainreactors.red/rem/usage/) — REM 使用文档
