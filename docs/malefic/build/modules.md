---
title: 模块构建
description: 本页说明 malefic-modules 和 malefic-3rd 的构建方式。两者都可以通过 feature 选择静态链接进 beacon
  或 reactor，也可以编译为独立 DLL。内置模块若要作为运行时可热加载 DLL 使用，需要显式启用 asmoduledll，否则只会产出普通 library，不导出...
edition: community
generated: false
source: imp:build/modules.md
---

# 模块构建

本页说明 `malefic-modules` 和 `malefic-3rd` 的构建方式。两者都可以通过 feature 选择静态链接进 beacon 或 reactor，也可以编译为独立 DLL。内置模块若要作为运行时可热加载 DLL 使用，需要显式启用 `as_module_dll`，否则只会产出普通 library，不导出 `rt_*` 模块 ABI。

## 关联组件

| 组件 | 作用 |
|------|------|
| [模块系统](/malefic/develop/modules/) | Module trait、内置模块列表、执行模型 |
| [第三方模块](/malefic/develop/3rd-party/) | `malefic-3rd` 官方第三方模块集合 |
| [自定义模块开发](/malefic/develop/module-development/) | `malefic-3rd-template` 多语言模块开发 |
| [Reactor 构建](/malefic/build/reactor/) | 可静态链接模块，也可动态加载模块 DLL |
| [Mutant 组件](/malefic/getting-started/components/mutant/) | 提供 `build modules` 与 `build 3rd` 命令 |

## 使用方式

模块有三种常见使用方式：

- **静态链接进 beacon** ：通过 `implants.modules` / `implants.3rd_modules` 选择能力，随主 implant 一起编译。
- **编译为模块 DLL** ：通过 `build modules` 或 `build 3rd` 生成 DLL，再用 `load_module` 热加载。
- **编译进 Reactor** ：通过 `build reactor -m base/full/...` 构建 headless runtime。

## 内置模块

`malefic-modules/Cargo.toml` 定义内置模块 feature 组，注册入口是 `malefic-modules/src/lib.rs` 中的 `register_modules()`。

### Feature 组

| Feature | 包含内容 |
|---------|----------|
| `nano` | 空模块集 |
| `base` | `ls`, `cd`, `rm`, `cp`, `mv`, `pwd`, `cat`, `upload`, `download`, `exec`, `env`, `info` |
| `extend` | base 之外的系统、执行、文件扩展能力 |
| `full` | `fs_full` + `execute_full` + `net_full` + `sys_full` |
| `fs_full` | 完整文件系统模块，包含 `mem`、`pipe`、`enum_drivers` 等 |
| `sys_full` | 完整系统操作模块，包含 `id`、`inject`、`wmi` 等 |
| `execute_full` | 完整执行引擎模块 |
| `net_full` | `upload`, `download` |

每个模块也有独立 Cargo feature，可按需组合，例如 `exec,ls,upload`。

## 构建内置模块 DLL

```bash
malefic-mutant build modules -c implant.yaml -t x86_64-pc-windows-gnu -m as_module_dll,exec,ls,upload
```

`BuildCommands::Modules` 的处理逻辑：

1. 如果传入 `-m`，按逗号拆分并覆盖本次构建的 `implants.modules`。
2. 如果未传入 `-m`，使用 `implant.yaml` 中的 `implants.modules`。
3. 调用 `update_module_toml(&modules, true)` 写入 `malefic-modules/Cargo.toml` 的 default features。
4. 将 `malefic-modules` 编译为 `cdylib`。

输出：

```text
target/<target>/release/malefic_modules.dll
```

模块 DLL 构建只支持 Windows target。用于 `load_module` 的 DLL 必须包含 `as_module_dll` feature，因为当前热加载路径解析的是 `rt_abi_version`、`rt_module_count`、`rt_module_run` 等 `rt_*` 导出。

## 静态链接进 Beacon

```yaml
implants:
  modules:
    - base
    - execute_bof
```

然后执行：

```bash
malefic-mutant generate beacon -c implant.yaml
malefic-mutant build malefic -c implant.yaml -t x86_64-pc-windows-gnu
```

生成 beacon 时，Mutant 会根据 `implants.modules` 更新 `malefic-modules/Cargo.toml`，这些模块会静态链接进主 implant。

## 第三方模块

`malefic-3rd` 用于需要外部依赖的扩展能力，例如 REM、HTTP client、PTY、OneDrive、FFmpeg、Agent 等。注册入口是 `register_3rd()`。

常见 feature：

| Feature | 说明 |
|---------|------|
| `full` | `rem` + `curl` + `pty` + `onedrive` |
| `rem` | REM 协议与 dial 能力 |
| `curl` | HTTP client |
| `onedrive` | OneDrive / SharePoint 文件操作 |
| `pty` | 伪终端 |
| `agent` | Agent provider bridge |
| `as_module_dll` | 编译为可热加载 DLL，Mutant 会自动添加 |

## 构建第三方模块 DLL

```bash
malefic-mutant build 3rd -c implant.yaml -t x86_64-pc-windows-gnu -m rem,curl
```

`BuildCommands::Modules3rd` 的处理逻辑：

1. 如果传入 `-m`，按逗号拆分并覆盖本次构建的 `implants.3rd_modules`。
2. 如果未传入 `-m`，使用 `implant.yaml` 中的 `implants.3rd_modules`。
3. 自动追加 `as_module_dll`。
4. 调用 `update_3rd_toml(&third_modules)` 写入 `malefic-3rd/Cargo.toml`。
5. 将 `malefic-3rd` 编译为共享库。

输出：

```text
target/<target>/release/malefic_3rd.dll
```

第三方模块 DLL 构建只支持 Windows target。

## 静态链接第三方模块

```yaml
implants:
  enable_3rd: true
  3rd_modules:
    - rem
    - curl
```

当 `enable_3rd: true` 时，feature 解析会向主 `malefic` crate 添加 `malefic-3rd` feature，并根据 `3rd_modules` 更新 `malefic-3rd/Cargo.toml`。

## `implant.yaml` 字段

```yaml
implants:
  modules:
    - full
  enable_3rd: false
  3rd_modules:
    - full
```

说明：

- `implants.modules` 是字符串数组，可以是预设或单个模块名。
- `implants.3rd_modules` 是字符串数组，可以是第三方 feature。
- `malefic-modules/Cargo.toml` 当前仓库默认 feature 是 `execute_shellcode`；Mutant 会在 generate/build 时按配置重写 default features，因此不要把仓库默认值当成最终 payload 能力。
- schema 不校验模块名是否合法；非法 feature 会在 workspace feature 扫描阶段报 warning 或失败。

## 相关文档

- [构建概览](/malefic/build/)
- [Mutant 组件](/malefic/getting-started/components/mutant/)
- [模块系统](/malefic/develop/modules/)
- [第三方模块](/malefic/develop/3rd-party/)
- [Reactor 构建](/malefic/build/reactor/)
