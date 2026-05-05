---
title: ProxyDLL 构建
description: ProxyDLL 对应 malefic-proxydll 包。它通过 malefic-mutant generate loader proxydll
  先解析目标 DLL 导出表，生成代理 DLL 代码和 .def 文件，再构建 Windows DLL。
edition: community
generated: false
source: imp:build/proxydll.md
---

# ProxyDLL 构建

ProxyDLL 对应 `malefic-proxydll` 包。它通过 `malefic-mutant generate loader proxydll` 先解析目标 DLL 导出表，生成代理 DLL 代码和 `.def` 文件，再构建 Windows DLL。

## 关联组件

| 组件 | 作用 |
|------|------|
| [ProxyDLL 组件](/malefic/getting-started/components/proxydll/) | 说明 DLL 劫持、导出代理、资源打包和 payload 执行 |
| [Mutant 组件](/malefic/getting-started/components/mutant/) | 提供 `generate loader proxydll` 和 `build proxy-dll` 命令 |
| [Prelude 构建](/malefic/build/prelude/) | ProxyDLL 可选择携带 autorun spite |

## 使用方式

ProxyDLL 用于 DLL 劫持或代理转发场景：保留原 DLL 的导出行为，同时在选定导出或 `DllMain` 中启动 payload。常见用途：

- 生成同名代理 DLL，转发到原始 DLL。
- 劫持某个导出函数触发 payload。
- 将代理 DLL、原 DLL 和可选 `spite.bin` 打包为投递资源。

## 生成 ProxyDLL

```bash
malefic-mutant generate loader proxydll \
  -c implant.yaml \
  -r version.dll \
  -p version_orig.dll \
  -e GetFileVersionInfoW \
  --native-thread \
  --hijack-dll-main
```

生成流程由 `generator.rs::update_proxydll()` 实现：

1. 使用 `PEParser::parse_dll_exports()` 解析 `raw_dll` 导出表。
2. 校验 `-e/--hijacked-exports` 指定的导出存在。
3. 写入 `malefic-proxydll/src/lib.rs`。
4. 写入 `malefic-proxydll/proxy.def`。
5. 更新 `malefic-proxydll/Cargo.toml` 的库名和 feature。

命令行参数会覆盖 `implant.yaml` 中的 `loader.proxydll` 字段。

## 构建 ProxyDLL

```bash
malefic-mutant build proxy-dll -c implant.yaml -t x86_64-pc-windows-gnu
```

`build_payload` 会将 `proxy-dll` 映射到 `malefic-proxydll`，并强制构建为共享库。输出：

```text
target/x86_64-pc-windows-gnu/release/<proxy-dll-name>.dll
```

输出 DLL 名称来自生成阶段写入的 `proxy_dll` 参数。

## 资源打包

构建完成后，`process_proxydll_resources()` 会重新读取默认 `implant.yaml`。当 `loader.proxydll.pack_resources` 为 `true` 时，会生成：

```text
target/<target>/release/program.zip
```

压缩包包含：

- 生成的代理 DLL。
- 被代理的原始 DLL。
- 当 `include_spite: true` 时，包含 `spite_path` 指向的 `spite.bin`。

如果代理 DLL 和原 DLL 文件名相同，原 DLL 会以 `<name>.backup` 形式打包，适合系统 DLL 劫持场景。

## `implant.yaml` 的 `loader.proxydll` section

```yaml
loader:
  proxydll:
    proxyfunc: "GetFileVersionInfoW"
    raw_dll: "version.dll"
    proxied_dll: "version_orig.dll"
    proxy_dll: "version.dll"
    resource_dir: "resources/proxydll"
    block: false
    block_method: "loop"
    native_thread: false
    pack_resources: true
    include_spite: false
    spite_path: "resources/spite.bin"
    hijack_dllmain: true
```

Schema 约束：

- `proxyfunc`、`raw_dll`、`proxied_dll` 必填。
- `block_method` 只能是 `loop` 或 `waitfor`。

## 生成参数

| 参数 | 简写 | 说明 |
|------|------|------|
| `--raw-dll` | `-r` | 原始 DLL 路径，用于解析导出表 |
| `--proxied-dll` | `-p` | 运行时转发目标 DLL |
| `--proxy-dll` | `-o` | 生成代理 DLL 名称 |
| `--hijacked-exports` | `-e` | 逗号分隔的劫持导出 |
| `--native-thread` | - | 使用 `NtCreateThreadEx` |
| `--hijack-dll-main` | - | 劫持 `DllMain` |

## Feature 映射

| 参数 | Cargo feature | 效果 |
|------|---------------|------|
| `native_thread: true` | `native_thread` | 使用 `NtCreateThreadEx` |
| `block_method: loop` | `block_loop` | payload 线程循环阻塞 |
| `block_method: waitfor` | `block_waitfor` | 使用等待式阻塞 |
| `implants.prelude` 非空 | `malefic-autorun` | 生成并运行 autorun spites |

阻塞开启时，payload 会使用带 `THREAD_CREATE_FLAGS_SKIP_THREAD_ATTACH` 的 `NtCreateThreadEx`，降低 loader-lock 死锁风险。

`loader.proxydll` 中没有 `use_prelude` 字段；是否启用 `malefic-autorun` 由 `implants.prelude` 是否配置决定。`include_spite` 只影响资源包是否携带外部 `spite.bin`。

## 相关文档

- [构建概览](/malefic/build/)
- [Mutant 组件](/malefic/getting-started/components/mutant/)
- [ProxyDLL 组件](/malefic/getting-started/components/proxydll/)
- [Prelude 构建](/malefic/build/prelude/)
