---
title: IoM 开发者贡献指南
---

# IoM 开发者贡献指南

欢迎贡献 Internet of Malice (IoM) 项目！IoM 致力于成为开放的红队基础设施，我们欢迎来自社区的贡献。

!!! important "合规提醒"
    在开始贡献之前，请仔细阅读并理解我们的[用户协议](/IoM/index/#用户协议)。所有贡献都必须遵循法律法规，仅用于授权的安全测试和研究。

## 可拓展的组件

IoM采用高度模块化的设计，支持多种拓展方式：

- **Command**: 客户端命令拓展 (推荐)
- **RPC**: 服务端接口拓展  
- **Module**: 植入物功能拓展
- **Mal插件**: Lua脚本拓展

## 开发导航

根据你的贡献方向选择对应指南：

=== "客户端开发"

    **Client开发** - 用户界面和命令
    
    - 新命令开发 (基于Cobra)
    - 参数解析和自动补全
    - 界面交互优化
    
    👉 [Client开发指南](client.md)

=== "Server开发"

    **Server开发** - 核心逻辑和数据处理
    
    - RPC接口开发
    - Parser扩展 
    - Pipeline拓展
    
    👉 [Server开发指南](server.md)

=== "Implant开发"

    **Implant开发** - 植入物和模块
    
    - Module开发 (Rust)
    
    👉 [Implant开发指南](implant.md)

## 贡献规范

### Pull Request要求

提交PR时请遵循以下规范：

-  **功能描述**
	- 清晰描述添加的功能和解决的问题
	- 说明实现方案和技术选型
	- 列出相关的依赖变更
- **测试要求**
	- 提供功能验证步骤
- **代码质量**
	- 遵循项目代码规范
	- 通过代码格式检查
	- 无明显的性能问题

### 提交模板

```markdown
## 功能描述
简要描述这个PR的目的和功能

## 实现方案
描述具体的实现方案和技术细节

## 测试验证
手动功能验证完成

## 相关Issue
Fixes #[issue编号]
```

## 相关资源

### 文档链接
- [IoM设计文档](/IoM/design/) - 架构设计理念
- [架构概念](/IoM/concept/) - 核心概念说明
- [用户手册](/IoM/manual/) - 完整使用指南
- [API文档](https://github.com/chainreactors/proto) - 协议定义

## 联系方式

- **Issues**: 各仓库Issues页面反馈技术问题
- **Discussions**: GitHub讨论区交流设计想法
- **邮箱**: m09ician@gmail.com
- **微信群**: 联系邮箱获取入群邀请

---

感谢您对IoM项目的贡献！
