---
title: Malefic 构建
description: 本页说明主 implant 包 malefic 的生成与构建流程，覆盖 beacon、bind 两种运行模式，以及二进制和库两种输出形态。相关实现主要位于
  malefic/Cargo.toml、malefic/src/main.rs、malefic-mutant/src/generate/、malefic-mut...
edition: community
generated: false
source: imp:build/malefic.md
---

# Malefic 构建

本页说明主 implant 包 `malefic` 的生成与构建流程，覆盖 beacon、bind 两种运行模式，以及二进制和库两种输出形态。相关实现主要位于 `malefic/Cargo.toml`、`malefic/src/main.rs`、`malefic-mutant/src/generate/*`、`malefic-mutant/src/build/payload/mod.rs` 和 `malefic-mutant/config_lint.json`。

## 关联组件

| 组件 | 作用 |
|------|------|
| [Malefic 组件](/malefic/getting-started/components/malefic/) | 主 implant 的运行时、stub、session loop 和模块调度 |
| [Mutant 组件](/malefic/getting-started/components/mutant/) | 负责读取 `implant.yaml`、生成配置 blob、更新 Cargo features 并调用构建 |
| [模块系统](/malefic/develop/modules/) | `implants.modules` 对应的内置模块能力 |
| [Prelude 构建](/malefic/build/prelude/) | 可被嵌入 beacon 的 autorun spite 生成流程 |

## 使用方式

`malefic` 适合需要完整 C2 implant 的场景：

- **Beacon** ：主动回连 C2，是默认上线方式。
- **Bind** ：监听本地端口等待连接，适合受控网络或反向连接不可用的环境。
- **库输出** ：通过 `--lib` 构建为动态库/静态库，由其他 loader 或宿主进程加载。

## 输出产物

`malefic` 同时提供 binary entry 和 library target：

| 构建方式 | 输出 |
|----------|------|
| 默认二进制 | Windows: `target/<target>/release/malefic.exe`；Unix-like: `target/<target>/release/malefic` |
| `--lib` | `malefic_lib`，Windows 共享库为 `malefic_lib.dll` |

`malefic/src/main.rs` 会在启用 `malefic-autorun` 时先执行 autorun，然后进入 `bootstrap::run(...)` 的会话循环。Unix release 构建会在启动异步 runtime 前 daemonize。

## 生成 Beacon

```bash
malefic-mutant generate beacon -c implant.yaml -E community
malefic-mutant build malefic -c implant.yaml -t x86_64-pc-windows-gnu
```

`generate beacon` 的核心流程：

1. `common_config()`：更新 edition、source/prebuild、runtime 等 workspace feature 配置。
2. `spites::update_malefic_spites()`：当 `implants.prelude` 或 `implants.pack` 存在时，解析 autorun YAML 并写入 `resources/spite.bin`。
3. `update_config("beacon", ...)`：
   - 校验并使用 `basic.obf_seed`。
   - 加密 runtime config，写入 `malefic-crates/config/src/generated/blob_obf.rs`。
   - 根据 `build.metadata` 写入 `resources/malefic.rc`，必要时写入 `resources/app.manifest`。
   - 根据 `config_lint.json` 解析 feature，并写入 `malefic/Cargo.toml`、`malefic-crates/proto/Cargo.toml`。
   - 根据 `implants.modules` 更新 `malefic-modules/Cargo.toml`。

## 生成 Bind

```bash
malefic-mutant generate bind -c implant.yaml
malefic-mutant build malefic -c implant.yaml -t x86_64-pc-windows-gnu
```

Bind 与 Beacon 使用同一套生成流水线，但会把 `implants.mod` 设置为 `bind`。`codegen.rs::update_core_config()` 会校验 bind target 只能使用 `tcp` 或 `udp`，配置 `http` 或 `rem` 会导致生成失败。

## 构建为库

```bash
malefic-mutant generate beacon -c implant.yaml
malefic-mutant build --lib malefic -c implant.yaml -t x86_64-pc-windows-gnu
```

当 implant 需要被其他进程加载，而不是作为独立进程运行时，使用 `--lib`。`build_payload` 会把该选项转换为 Cargo `--lib` 构建。

## `implant.yaml` 字段

生成 beacon/bind 需要 `basic`、`implants` 和 `build` 三个顶层 section。字段约束由 `config_lint.json` 定义。

### `basic`

```yaml
basic:
  name: malefic
  proxy:
    use_env_proxy: false
    url: ""
  cron: "*/5 * * * * * *"
  jitter: 0.2
  keepalive: false
  retry: 10
  max_cycles: -1
  max_packet_length: 0
  encryption: aes
  key: maliceofinternal
  obf_seed: 15229217100126305078
  secure:
    enable: false
    private_key: ""
    public_key: ""
  dga:
    enable: false
    key: malefic_dga_2024
    interval_hours: 8
  guardrail:
    enable: false
    require_all: true
    ip_addresses: []
    usernames: []
    server_names: []
    domains: []
  targets:
    - address: 127.0.0.1:5001
      http:
        method: POST
        path: /
        version: "1.1"
        headers:
          User-Agent: Mozilla/5.0
      tls:
        enable: false
        version: "1.2"
        sni: ""
        skip_verification: true
      session:
        read_chunk_size: 8192
        deadline_ms: 10000
        connect_timeout_ms: 5000
        keepalive: false
```

### `implants`

```yaml
implants:
  runtime: tokio
  mod: beacon
  register_info: true
  hot_load: true
  addon: true
  modules:
    - full
  enable_3rd: false
  3rd_modules:
    - full
  prelude: ""
  pack: []
  flags:
    start: 65
    end: 66
    magic: beautiful
    artifact_id: 1
```

### `build`

```yaml
build:
  obfstr: true
  zigbuild: false
  toolchain: nightly-2024-02-03
  ollvm:
    enable: false
    mode: docker
    plugin: ""
    indbr: false
    icall: false
    indgv: false
    cff: false
  metadata:
    icon: ""
    compile_time: "24 Jun 2015 18:03:01"
    file_version: ""
    product_version: ""
    company_name: ""
    product_name: ""
    original_filename: normal.exe
    file_description: normal
    internal_name: ""
    require_admin: false
    require_uac: false
```

## Feature 解析

Feature 解析由 `config_lint.json` 和 `malefic-mutant/src/generate/features.rs` 驱动。解析器会遍历 `implant.yaml` 的 JSON 表示，并根据 schema 注解添加 features：

| 注解 | 作用 |
|------|------|
| `bool_flag` | 布尔值为 `true` 时添加 feature |
| `enum_map` | 根据字符串枚举值映射 feature，`*` 是 fallback |
| `non_empty` | 字符串非空时添加 feature |
| `presence_fields` / `default_when_absent` | 根据对象字段是否存在选择 feature |

常见映射：

| 配置 | Feature |
|------|---------|
| `basic.targets[].http` | `transport_http` |
| `basic.targets[].rem` | `transport_rem` |
| 未配置 `http` / `rem` | `transport_tcp` |
| `tls.enable: true` | `tls` |
| `basic.encryption: aes` | `crypto_aes` |
| `basic.encryption: chacha20` | `crypto_chacha20` |
| `implants.mod: beacon` | `beacon` |
| `implants.mod: bind` | `bind` |
| `implants.hot_load: true` | `hot_load` |
| `implants.enable_3rd: true` | `malefic-3rd` |
| `implants.prelude` 非空或 `pack` 非空 | `malefic-autorun` |

解析完成后，`features.rs` 会扫描 workspace，校验解析出的 feature 是否存在于对应 `Cargo.toml`。

## 构建参数

```bash
malefic-mutant build malefic \
  -c implant.yaml \
  -t x86_64-pc-windows-gnu \
  --lib \
  --debug
```

| 参数 | 说明 |
|------|------|
| `-c/--config` | 配置文件路径，默认 `implant.yaml` |
| `-t/--target` | Rust target triple，默认 `x86_64-pc-windows-gnu` |
| `--lib` | 构建 library target |
| `--debug` | 参数存在，但当前 `_dev_build` 未实际使用 |

## 相关文档

- [构建概览](/malefic/build/)
- [Mutant 组件](/malefic/getting-started/components/mutant/)
- [模块构建](/malefic/build/modules/)
- [Prelude 构建](/malefic/build/prelude/)
