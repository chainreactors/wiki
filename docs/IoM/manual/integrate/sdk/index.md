# IoM SDK

IoM 提供多种语言的 SDK，将 gRPC 能力封装为对应语言的原生 API。

## 支持的语言

### Python SDK

现代异步 Python 客户端库，提供完整的类型提示和 IDE 支持。

**特性：**
- 基于 async/await 的异步 API
- 完整的类型提示
- 自动转发所有 133 个 gRPC 方法
- 与 IoM 架构概念一一对应

**状态：** ✅ 稳定

[查看 Python SDK 文档 →](python.md)

### TypeScript SDK

**状态：** 🛠️ 规划中

TypeScript SDK 将提供与 Python SDK 相同的功能和 API 设计。

**预期特性：**
- 完整的 TypeScript 类型定义
- Promise/async-await 支持
- 自动 gRPC 方法转发
- 会话管理和任务执行

### Go SDK

**状态：** 🛠️ 规划中

Go SDK 将提供高性能的原生 Go API。

**预期特性：**
- 原生 Go 接口
- 并发安全
- 完整的错误处理
- 类型安全

## 核心概念

所有 SDK 的设计都完全对应 IoM 的架构概念：

- **Client** - 与 Server 的 gRPC 连接
- **Session** - Implant 会话管理
- **Task** - 异步任务执行
- **Spite** - 通讯消息封装

详细说明请参考 [IoM 核心概念](/IoM/concept/)。

## 使用场景

- **自动化脚本**: 编写自动化渗透测试脚本
- **工具开发**: 开发红队工具和辅助工具
- **CI/CD 集成**: 集成到持续集成流程
- **自定义客户端**: 开发定制化的 C2 客户端
- **AI 集成**: 将 IoM 能力封装为 AI Tool

## 相关资源

- [Python SDK 源码](https://github.com/chainreactors/malice-network/tree/master/sdk/python)
- [Proto 协议定义](https://github.com/chainreactors/proto)
- [IoM 核心概念](/IoM/concept/)
- [AI 集成文档](../ai.md)
