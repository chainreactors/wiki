---
title: Reactor 构建
description: Reactor 对应 malefic-reactor 包，是一个独立 runtime shared library。它不包含 beacon/bind
  通信逻辑，只暴露 C ABI，用于加载和执行模块，是 headless malefic 的构建入口。
edition: community
generated: false
source: imp:build/reactor.md
---

# Reactor 构建

Reactor 对应 `malefic-reactor` 包，是一个独立 runtime shared library。它不包含 beacon/bind 通信逻辑，只暴露 C ABI，用于加载和执行模块，是 headless malefic 的构建入口。

## 关联组件

| 组件 | 作用 |
|------|------|
| [Reactor 组件](/malefic/getting-started/components/reactor/) | 说明 runtime host、C ABI、模块执行和宿主集成 |
| [Runtime 组件](/malefic/getting-started/components/runtime/) | Reactor 使用的底层 runtime ABI 与模块通信协议 |
| [模块系统](/malefic/develop/modules/) | Reactor 可静态链接或动态加载的模块能力 |
| [模块构建](/malefic/build/modules/) | 独立模块 DLL 的构建入口 |

## 使用方式

Reactor 适合不需要 C2 通信、只需要模块执行能力的宿主场景，例如 Webshell Bridge、本地工具、自动化框架或第三方 loader。宿主通过 C ABI 初始化 runtime，提交 protobuf 编码的 `Spite`，接收模块执行结果。

## 构建 Reactor

```bash
malefic-mutant build reactor -c implant.yaml -t x86_64-pc-windows-gnu -m base
```

`BuildCommands::Reactor` 的处理逻辑：

1. 解析 `-m/--modules` 为逗号分隔 feature 列表。
2. 强制以共享库方式构建 `malefic-reactor`。
3. 将模块 feature 传给 `build_payload()`。

Windows 输出：

```text
target/<target>/release/malefic_reactor.dll
```

Linux/macOS target 会分别输出 `libmalefic_reactor.so` 或 `libmalefic_reactor.dylib`。`--lib` 对 Reactor 无意义，因为 Reactor 始终构建为 `cdylib`。

## 模块 Feature 映射

`malefic-reactor/Cargo.toml` 将自身 feature 转发到 `malefic-modules`：

| Reactor feature | 映射 |
|-----------------|------|
| `builtin` | 启用静态链接 `malefic-modules` |
| `full` | `builtin` + `malefic-modules/full` |
| `base` | `builtin` + `malefic-modules/base` |
| `extend` | `builtin` + `malefic-modules/extend` |
| `nano` | `builtin` + `malefic-modules/nano` |
| `fs_full` | `builtin` + `malefic-modules/fs_full` |
| `sys_full` | `builtin` + `malefic-modules/sys_full` |
| `execute_full` | `builtin` + `malefic-modules/execute_full` |
| `net_full` | `builtin` + `malefic-modules/net_full` |
| `execute_assembly` | `builtin` + `malefic-modules/execute_assembly` |
| `execute_powershell` | `builtin` + `malefic-modules/execute_powershell` |
| `execute_bof` | `builtin` + `malefic-modules/execute_bof` |

没有 `builtin` 时，Reactor 不携带静态模块；Windows 热加载路径可通过 `rt_host_execute("load_module", ...)` 动态加载带 `rt_*` ABI 的模块 DLL。跨平台使用时，建议通过 `-m base/full/...` 静态内置需要的模块。

## Runtime C ABI

`malefic-reactor/src/lib.rs` 导出 4 个主要 C ABI 函数：

| 函数 | 作用 |
|------|------|
| `rt_host_init` | 创建 runtime host；启用 `builtin` 时注册内置模块 |
| `rt_host_execute` | 执行 internal manager 操作或模块；输入输出为 protobuf `Spite` |
| `rt_host_free` | 释放 execute 返回的输出 buffer |
| `rt_host_shutdown` | 销毁 runtime host |

错误会以 UTF-8 字符串写入输出 buffer。`build.rs` 会通过 `cbindgen` 生成 `include/malefic_reactor.h`。

## CLI 参数

| 参数 | 说明 |
|------|------|
| `-m/--modules` | 内置模块集：`base`、`extend`、`full`、`nano`，或逗号分隔的单个 feature |
| `-t/--target` | Rust target triple |

## 相关文档

- [构建概览](/malefic/build/)
- [Reactor 组件](/malefic/getting-started/components/reactor/)
- [Runtime 组件](/malefic/getting-started/components/runtime/)
- [模块构建](/malefic/build/modules/)
