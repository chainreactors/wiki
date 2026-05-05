---
title: 贡献指南
description: 本文档介绍如何为 malice-network 项目进行开发和贡献。
edition: community
generated: false
source: mn:development/contributing.md
---

# 贡献指南

本文档介绍如何为 malice-network 项目进行开发和贡献。

## 参与方式

### Issue Reporter

通过深度使用 IoM 发现问题：

- 提交 bug 报告（附带复现步骤）
- 提出功能需求和改进建议
- 反馈不合理的设计和低级 bug
- 指出文档中的错误描述、歧义等

### Contributor

协助解决具体问题：

1. 分析并定位问题
2. 编写修复代码
3. 完成测试验证
4. 提交 Pull Request

### Core Contributor

参与新功能开发和架构优化：

1. 发起需求并讨论技术方案
2. 实现完整功能模块
3. 参与 Code Review 和迭代优化

## 环境配置

??? warning "Go 开发环境"
    **版本要求** : Go >= 1.20

    ```bash
    go version
    ```

??? warning "protobuf 环境"
    === "Linux"

        ```bash
        apt install -y protobuf-compiler
        protoc --version  # 确保版本 >= 3
        ```

    === "macOS"

        ```bash
        brew install protobuf
        protoc --version
        ```

    === "Windows"

        ```bash
        winget install protobuf
        protoc --version
        ```

    **protobuf Go 插件** :
    ```bash
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
    go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.1
    ```

## PR 合并流程

1. **角色分配** ：每个复杂功能分配一个 Maintainer 和至少一个 Assignee
2. **Review 流程** ：Maintainer 完成后通知 Assignee 进行 review 和测试
3. **文档要求** ：
   - PR 中附上测试截图和用法说明
   - 新功能需添加对应的 help 信息
   - 系统性功能 PR 通过后立即编写相关文档

## Pre-commit 检查

```bash
go vet ./...                            # 静态分析
go test ./... -count=1 -timeout 300s    # 测试
CGO_ENABLED=0 go build ./...            # 编译验证
```

## 相关文档

- [测试文档](/IoM/development/) — 测试框架与规范
- [核心概念](/IoM/getting-started/concepts/) — 架构与协议边界
- [Client 架构](/IoM/development/client/) — Client 机制与设计
- [Server 架构](/IoM/development/server/) — Server 架构与配置
