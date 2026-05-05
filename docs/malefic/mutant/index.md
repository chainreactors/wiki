---
title: 工具概览
description: Mutant 工具文档覆盖 malefic-mutant 除常规 generate/build 之外的辅助能力，包括 loader 生成、配置补丁、PE
  变形、签名处理、重链接和测试问题记录。
edition: community
generated: false
source: imp:mutant/index.md
---

# 工具概览

Mutant 工具文档覆盖 `malefic-mutant` 除常规 generate/build 之外的辅助能力，包括 loader 生成、配置补丁、PE 变形、签名处理、重链接和测试问题记录。

## 工具导航

| 文档 | 说明 |
|------|------|
| [Transform](/malefic/mutant/transform/) | encode、objcopy、SRDI 等格式转换与载荷处理 |
| [Patch](/malefic/mutant/patch/) | 运行时配置热补丁与 implant 配置替换 |
| [Loader](/malefic/mutant/loader/) | loader template、ProxyDLL loader 相关生成能力 |
| [PE Modify](/malefic/mutant/pe-modify/) | PE 元数据、icon、watermark、entropy 等修改工具 |
| Obfuscate (Pro) | 源码级混淆工具说明 |
| [SigForge](/malefic/mutant/sigforge/) | PE 签名提取、注入和伪造 |
| Relink (Pro) | PE post-link 随机化与 anti-YARA 变形 |
| Mutate (Pro) | 多态变体生成与 pipeline 变形 |
| BDF (Pro) | PE shellcode 注入 |
| LNK (Pro) | LNK weaponization 配置与生成 |
| [Retest Issues](/malefic/mutant/retest-issues/) | 复测问题、隔离项和验证记录 |

## 与 Build 的关系

常规产物构建入口在 [Build 文档](/malefic/build/)。Mutant 工具页聚焦构建前后的处理步骤：生成 loader、修改产物、打补丁、做变形和验证。
