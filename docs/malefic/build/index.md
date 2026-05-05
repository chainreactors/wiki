---
title: 概览
description: 构建文档说明 malefic-mutant generate 与 malefic-mutant build 如何生成配置、改写 feature、编译不同入口
  crate，并输出可部署产物。
edition: community
generated: false
source: imp:build/index.md
---

# 概览

构建文档说明 `malefic-mutant generate` 与 `malefic-mutant build` 如何生成配置、改写 feature、编译不同入口 crate，并输出可部署产物。

## 构建入口

| 文档 | 说明 |
|------|------|
| [Malefic Beacon / Bind](/malefic/build/malefic/) | 主 implant 的 beacon、bind 配置生成与编译 |
| [Pulse Stager](/malefic/build/pulse/) | Pulse stager 生成、编译与 shellcode 输出 |
| [ProxyDLL](/malefic/build/proxydll/) | ProxyDLL loader 配置、代理 DLL 生成与编译 |
| [模块构建](/malefic/build/modules/) | 内置模块、第三方模块的 DLL 构建与 beacon 集成 |
| [Prelude 构建](/malefic/build/prelude/) | Prelude autorun 生成、spite 编码与 beacon 嵌入 |
| [Reactor 构建](/malefic/build/reactor/) | Reactor runtime DLL 与模块执行宿主构建 |

## 阅读建议

先阅读 [编译与配置手册](/malefic/getting-started/) 了解工具链和环境要求，再根据目标产物进入对应构建页。若需要理解命令总览和 `implant.yaml` 字段归属，参考 [Mutant 组件文档](/malefic/getting-started/components/mutant/)。
