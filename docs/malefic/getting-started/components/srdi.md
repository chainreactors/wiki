---
title: SRDI
description: malefic-srdi 是 malefic 的 nostd 反射 DLL 注入器。它将 DLL 转换为位置无关的 shellcode，转换过程中剥离
  PE 特征，使注入后的内存区域不呈现典型的 PE 结构。
edition: community
generated: false
source: imp:getting-started/components/srdi.md
---

# malefic-srdi

`malefic-srdi` 是 malefic 的 no_std 反射 DLL 注入器。它将 DLL 转换为位置无关的 shellcode，转换过程中剥离 PE 特征，使注入后的内存区域不呈现典型的 PE 结构。

## 设计

传统的 SRDI（Shellcode Reflective DLL Injection）工具在处理 Rust 编译的 DLL 时存在一个关键问题：Rust MSVC target 使用静态 TLS（Thread Local Storage），而现有的所有 SRDI 工具（donut、pe2shellcode、No-Consolation 等）都无法正确处理静态 TLS 回调，导致加载后 panic。

`malefic-srdi` 解决了这个问题，是目前唯一能正确处理 Rust 静态 TLS 的 SRDI 实现。

## 架构

```
malefic-srdi/
├── src/
│   ├── lib.rs      # 导出（空）
│   ├── main.rs     # 入口: unsafe extern "C" fn main(...)
│   ├── loader.rs   # PE 解析、重定位、IAT 修复
│   ├── types.rs    # Windows PE 结构定义
│   └── utils.rs    # 内存读写、hash 工具
└── Cargo.toml      # #![no_std], naked_functions
```

核心特性：

- `#![no_std]` — 不依赖标准库，仅使用 `core`
- `#![feature(naked_functions)]` — 汇编入口点
- 零外部依赖 — 所有 Windows 结构体手动定义
- 位置无关 — 通过 linker script 合并所有段到 `.text`

## 编译

```bash
# 编译为独立 shellcode（需要 nightly）
cargo +nightly build -p malefic-srdi \
  --features standalone \
  --target x86_64-pc-windows-msvc \
  -Z build-std=core,alloc \
  --release

# 提取 .text 段
objcopy -O binary -j .text target/.../malefic_srdi.exe srdi.bin
```

## 通过 mutant 使用

```bash
# 将 DLL/EXE 转换为 shellcode
malefic-mutant tool srdi -i beacon.exe -o beacon.bin
```

mutant 内置了预编译的 srdi shellcode 字节码（x86/x64），默认使用预编译版本。

### rebuild_srdi

如果需要从源码重建 srdi（例如修改了 loader 逻辑）：

```bash
# 在 mutant 编译时启用 rebuild_srdi feature
cargo build -p malefic-mutant --features rebuild_srdi
```

启用后，mutant 的 `build.rs` 会：

1. 调用 `cargo +nightly build -p malefic-srdi`
2. 通过 goblin 解析 PE，提取 `.text` 段
3. 将原始字节写入 `OUT_DIR` 供 `include_bytes!()` 使用

仅当 srdi 源码变更时才会重新编译（通过 `cargo:rerun-if-changed` 追踪）。

## PE 加载流程

srdi shellcode 在目标内存中执行以下步骤：

1. **解析 PE 头** — 从内嵌的 DLL 字节中读取 DOS/NT/Section headers
2. **映射 Sections** — 按 VirtualAddress 将各段映射到内存
3. **处理重定位** — 修复基址重定位表
4. **修复 IAT** — 解析导入表，通过 hash 查找加载 API
5. **处理 TLS** — 正确执行 TLS 回调（关键：解决 Rust 静态 TLS 问题）
6. **执行入口点** — 调用 DllMain 或自定义入口

## 与 donut 的对比

| 特性 | malefic-srdi | donut |
|------|-------------|-------|
| Rust 静态 TLS | 支持 | 不支持 |
| PE 特征剥离 | 完整 | 部分 |
| 体积 | ~2KB shellcode | ~10KB |
| 依赖 | 无 | 无 |
| 语言 | Rust (no_std) | C |

## 相关文档

- [Mutant 文档](/malefic/getting-started/components/mutant/) — 编译工具链
- [架构设计](/malefic/getting-started/architecture/) — 投递链设计
