---
title: Prelude 构建
description: Prelude 对应 malefic-prelude 包，用于执行加密的 autorun spites。它可以作为独立阶段运行，也可以在
  beacon 中以 stageless autorun 的形式嵌入。
edition: community
generated: false
source: imp:build/prelude.md
---

# Prelude 构建

Prelude 对应 `malefic-prelude` 包，用于执行加密的 autorun spites。它可以作为独立阶段运行，也可以在 beacon 中以 stageless autorun 的形式嵌入。

## 关联组件

| 组件 | 作用 |
|------|------|
| [Prelude 组件](/malefic/getting-started/components/prelude/) | 说明多段上线中间阶段和 YAML 编排模型 |
| [Mutant 组件](/malefic/getting-started/components/mutant/) | 负责解析 prelude YAML、生成 `spite.bin`、更新模块 features |
| [模块系统](/malefic/develop/modules/) | Prelude 复用的内置模块能力 |
| [Malefic 构建](/malefic/build/malefic/) | 可将 prelude autorun 嵌入 beacon |

## 使用方式

Prelude 适合把多个动作编排成前置任务，例如环境检查、上传资源、执行 BOF、启动后续 payload。它的价值在于：不改代码，只通过 YAML 改变上线前后的动作序列。

## 生成 Prelude

```bash
malefic-mutant generate prelude prelude.yaml \
  -c implant.yaml \
  --resources resources \
  --key maliceofinternal \
  --spite spite.bin
```

生成流程：

1. `common_config()` 更新 edition、source/prebuild、runtime。
2. `prelude::parse_yaml()` 解析 autorun YAML。
3. 根据 `third` 和 `depend_on` 将依赖分为内置模块和第三方模块。
4. 调用 `update_module_toml()` / `update_3rd_toml()` 更新模块 features。
5. `update_prelude_spites()` 编码、压缩、加密并写入 `resources/spite.bin`。
6. 根据 `build.metadata` 写入资源文件。
7. 通过 schema 解析剩余 features。

## Prelude YAML

```yaml
-
  name: bof
  body: !ExecuteBinary
    name: addservice
    bin: !File "addservice.o"
-
  name: pty
  third: true
  depend_on: pty
  body: !PtyRequest
    command: "cmd.exe"
-
  name: upload
  body: !UploadRequest
    target: "C:\\Users\\Public\\tool.exe"
    data: !Base64 "SGVsbG8gV29ybGQ="
```

字段说明：

| 字段 | 说明 |
|------|------|
| `name` | spite 名称；未配置 `depend_on` 时也作为 feature 名 |
| `body` | spite body，支持 implantpb 中的 body 类型 YAML tag |
| `third` | 是否依赖第三方模块，默认 `false` |
| `depend_on` | 覆盖依赖 feature，可为字符串或数组 |
| `task_id` | task id，默认 0 |
| `async` | 是否异步，默认 `false` |
| `timeout` | 超时毫秒数，默认 0 |

自定义 tag：

| Tag | 作用 |
|-----|------|
| `!File "path"` | 从 `resources/` 读取文件并转为 bytes |
| `!Base64 "string"` | base64 解码为 bytes |
| `!Hex "deadbeef"` | hex 解码为 bytes |

## 构建 Prelude

```bash
malefic-mutant build prelude -c implant.yaml -t x86_64-pc-windows-gnu
```

输出：

```text
target/<target>/release/malefic-prelude.exe
```

`malefic-prelude/src/main.rs` 会调用 `malefic_autorun::run()` 执行生成的 spites。

## 嵌入 Beacon 的 Stageless Autorun

Beacon 生成时，如果配置了 `implants.prelude` 或 `implants.pack`，Mutant 也会生成并嵌入 `spite.bin`：

```yaml
implants:
  prelude: "prelude.yaml"
  pack:
    - src: "tool.exe"
      dst: "C:\\Users\\Public\\tool.exe"
```

`implants.pack` 会为每个资源生成 upload + exec spites，并自动添加 `upload`、`exec` 模块 feature。最终 spites 被加密后嵌入 beacon，启动时自动执行。

## CLI 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `yaml_path` | `prelude.yaml` | autorun YAML 路径 |
| `--resources` | `resources` | 资源目录 |
| `--key` | `maliceofinternal` | 加密 key |
| `--spite` | `spite.bin` | 输出 spite 文件名 |

## 相关文档

- [构建概览](/malefic/build/)
- [Prelude 组件](/malefic/getting-started/components/prelude/)
- [模块构建](/malefic/build/modules/)
- [Malefic 构建](/malefic/build/malefic/)
