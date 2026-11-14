---
title: 概览
description: Develop 文档面向需要扩展、集成或二次开发 malefic 的开发者。这里不重复基础使用流程，重点说明如何通过 FFI、Module
  trait、第三方模块和多语言模板接入现有运行时。
edition: community
generated: false
source: imp:develop/index.md
---

# 概览

Develop 文档面向需要扩展、集成或二次开发 malefic 的开发者。这里不重复基础使用流程，重点说明如何通过 FFI、Module trait、第三方模块和多语言模板接入现有运行时。

## 阅读路径

| 文档 | 适用场景 |
|------|----------|
| [FFI 接口](/malefic/develop/ffi/) | 从 C/Go/Rust/Python/C# 调用 Win-Kit 能力 |
| [FFI Library](/malefic/develop/ffi-library/) | 了解 FFI 库导出、宿主集成和调用约定 |
| [模块系统](/malefic/develop/modules/) | 开发或维护内置模块，理解 Module trait 和执行模型 |
| [第三方模块](/malefic/develop/3rd-party/) | 使用或扩展 malefic-3rd 官方模块集合 |
| [自定义模块开发](/malefic/develop/module-development/) | 基于 malefic-3rd-template 编写 Rust/Go/C/Zig/Nim 模块 |

## 结构关系

模块开发本质上是 Develop 的一个分支：`malefic-modules`、`malefic-3rd` 和 `malefic-3rd-template` 共用同一套 Module trait 与运行时协议，区别只在于依赖范围、编译方式和交付形式。

如果目标是改内置能力，从 [模块系统](/malefic/develop/modules/) 开始；如果目标是做独立扩展，优先看 [自定义模块开发](/malefic/develop/module-development/)。
