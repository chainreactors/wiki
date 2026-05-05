---
title: Overview
description: Internet of Malice(恶联网) 力图实现一套开源 Offensive 基础设施, 兼容CS,MSF,Sliver生态, 提供更高的拓展性与隐蔽性,
  并提供完整的工程化解决方案。 IoM将作为进攻性基础设施实现， 而不仅仅是一个C2工具， 你能在这里找到先进的设计理念、工程化实现、插件生态以及能用于...
edition: community
generated: false
source: wiki:index.md
---

## Overview 

Internet of Malice(恶联网) 力图实现一套开源 Offensive 基础设施, 兼容CS,MSF,Sliver生态, 提供更高的拓展性与隐蔽性, 并提供完整的工程化解决方案。 IoM将作为进攻性基础设施实现， 而不仅仅是一个C2工具， 你能在这里找到先进的设计理念、工程化实现、插件生态以及能用于Real World的解决方案。

 Offensive 基础设施是比其他领域更具挑战性, 不管在设计上还是实现上都更为复杂。

IoM 的版本演进大致分为三个阶段：

- v0.0.x 验证了基础架构：Server、Client、Listener、Implant 的协作模型逐步成型，并引入 GitHub Actions 构建、多段加载和 Rust 生态兼容能力。
- v0.1.x 开始面向日常使用：补齐 GUI、代理、OPSEC、MAL 插件和社区生态集成，同时显著降低部署、登录、构建和首次上手成本。
- v0.3.0 进入架构重构阶段：Implant 侧以 malefic 为核心拆分为 Malefic、Pulse、Prelude、Reactor、ProxyDLL、Mutant 等独立组件，构建系统、模块运行时、SDK、MAL 与 AI 集成也随之重新组织。

今天的 IoM 不再只是单一 C2 工具，而是一套围绕团队协作、模块化 implant、可扩展插件、自动化集成和工程化构建组织起来的 Offensive Infrastructure。

受限于开发进度, 我们决定先接受来自社区的意见, 闭门造车造不出最先进的工具.

!!! example "Features."

    - rust编写的implant, 实现全平台兼容
    - 分布式独立部署的listener
    - 支持正向与反向链接的implant
    - 专注于OPSEC
    - everything is fileless
    - 插件兼容, 兼容cobaltstrike的BOF与sliver的armory社区生态等等
    - 插件生态, 通过lua与yaegi实现了一个能动态加载的mal插件生态
    - 自由组装, implant的所有模块都可以在编译时自由组装
    - 热插拔, implant的所有模块都可以动态载入, 不需要重新编译, 不需要重启进程
    - 插件化, client,server,implant都将保留大量插件接口, 致力于实现cobaltstrike同样的自由度

## Introduce

[IoM架构与设计](/IoM/getting-started/design/)

[IoM基本概念](/IoM/getting-started/concepts)

## 快速入门

[快速开始，开箱即用](/IoM/getting-started/)

## 架构/architecture

- **WIP** 🛠️ 表示将会实现;
- **Private** 🔒 表示已实现但不完善还需要调整因暂未公开, 但在发布计划中
- **Professional** 👤 表示需要额外审核的用户可访问

!!! warning "文档中能见到的没有添加 🛠️, 🔒 ,  👤 标记的内容为已经开源的"
    实际上server, client, listener, implant均已完全开源, 只有implant的一部分组件因为对抗的原因不能完全开源, 以lib的方式提供. 不影响编译, 使用, 二开.

可以在 [project-IoM](https://github.com/chainreactors/project-IoM) 查看所有 IoM 相关项目的索引。

## 项目索引

- [malice-network](https://github.com/chainreactors/malice-network) - C2 Server、Listener 与 Client，负责团队服务端、交互客户端、构建调度和任务编排。
- Implant
    - [malefic](https://github.com/chainreactors/malefic) - 默认 implant，v0.3.0 后拆分为可组合的 Malefic、Pulse、Prelude、Reactor、ProxyDLL、Mutant 等组件。
    - [malefic-srdi](https://github.com/chainreactors/malefic-srdi) - SRDI 实现，用于降低 DLL 转 shellcode 后的 PE 特征。
    - [malefic-3rd-template](https://github.com/chainreactors/malefic-3rd-template) - 第三方模块模板，支持 Rust、Go、C、Zig、Nim 等模块开发。
    - [cross-rust](https://github.com/chainreactors/cross-rust) - 交叉编译 Docker 镜像，用于稳定构建 Windows、Linux、macOS 等 target。
- Third
    - [rem](https://github.com/chainreactors/rem) - 全场景代理与自定义传输协议，可作为 IoM 的高级链路与隧道能力。
- [proto](https://github.com/chainreactors/proto) - IoM 协议定义，覆盖 Client RPC、Listener RPC、Implant 消息和共享 protobuf 类型。
- MAL
    - [mals](https://github.com/chainreactors/mals) - MAL 插件框架。
    - [mal-community](https://github.com/chainreactors/mal-community) - 社区 MAL 插件集合。
    - [mal-intl](https://github.com/chainreactors/mal-intl) - Community 版本内置插件集合。
- SDK
    - [IoM-go](https://github.com/chainreactors/IoM-go) - Go SDK 与 gRPC client。
    - [IoM-python](https://github.com/chainreactors/IoM-python) - Python SDK。
    - [IoM-typescript](https://github.com/chainreactors/IoM-typescript) - TypeScript SDK。
- Kits
    - malefic-win-kit - Windows 端工具包 (👤)
    - malefic-linux-kit - Linux 端工具包 (🛠️)
    - malefic-*os-kit - 其他 OS 工具包 (🛠️)
    - malefic-android-kit - Android 端工具包 (🛠️)
    - mice - 持久性后门 (🔒)

## 文档入口

- IoM 使用文档
    - [快速开始](/IoM/getting-started/) - 安装、初始化、登录和首次构建。
    - [核心概念](/IoM/getting-started/concepts/) - Server、Client、Listener、Pipeline、Profile、MAL 与 SDK 的关系。
    - [部署指南](/IoM/user-guide/deployment/) - Server、Listener、Client 的部署与凭证文件。
    - [命令行系统](/IoM/user-guide/console/) - Client 命令行、上下文、命令路由与日常操作。
    - [Listener 与 Pipeline](/IoM/user-guide/listener/) - 监听器、Pipeline、证书和网络入口。
    - [构建与 Profile](/IoM/user-guide/build/) - 集中编译、Profile、artifact 与构建源。
- Malefic 文档
    - [Malefic 首页](/malefic/) - implant 组件、crate 分层和文档导航。
    - [架构设计](/malefic/getting-started/architecture/) - Starship、Pulse、Malefic、Prelude、Reactor 的分层关系。
    - [编译与配置手册](/malefic/getting-started/) - 环境安装、mutant 基础用法和 `implant.yaml` 入口。
    - [Build 文档](/malefic/build/) - Malefic、Pulse、ProxyDLL、Prelude、Reactor、Modules 的构建说明。
    - [Mutant 工具](/malefic/mutant/) - transform、patch、loader、pe-modify、sigforge 以及 Pro 工具索引。
    - [Develop 文档](/malefic/develop/) - FFI、模块系统、第三方模块与多语言模块开发。
- 开发与集成
    - [开发总览](/IoM/development/) - Client、Server、MAL、SDK、AI 集成的入口。
    - [Server 开发](/IoM/development/server/) - Server 内部机制、Pipeline 和扩展开发。
    - [Client 开发](/IoM/development/client/) - Client 命令、上下文和交互扩展。
    - [MAL 插件](/IoM/development/mals/) - MAL 插件体系和快速开始。
    - [SDK](/IoM/development/sdk/) - Go、Python、TypeScript SDK。
    - [AI 集成](/IoM/development/ai/) - MCP、Agent 与 Skill 集成。

## 更新日志

- [v0.0.1 next generation C2 project](/blog/2024/08/16/IoM_introduce/)
- [v0.0.2 the Real Beginning](/blog/2024/09/23/IoM_v0.0.2/)
- [v0.0.3 RedTeam Infra&C2 framework](/blog/2024/11/20/IoM_v0.0.3/)
- [v0.0.4 Bootstrapping](/blog/2025/01/02/IoM_v0.0.4/)
- [v0.1.0 代替CobaltStrike的最后四块碎片](/blog/2025/04/14/IoM_v0.1.0/)
- [v0.1.1 Out of the Box 开箱即用](/blog/2025/07/09/IoM_v0.1.1/)
- [v0.1.2 Integrate  Everything](/blog/2025/11/10/IoM_v0.1.2/)
- [v0.3.0 AI Native Offensive Infrastructure](/blog/2026/04/20/IoM_v0.3.0/)

**Advanced Posts:**

- [PELoader&RDI的TLS之殇](/blog/2025/01/07/IoM_advanced_TLS/)

## 社区

### github

malefic的[issues](https://github.com/chainreactors/malefic/issues)和[disscussion](https://github.com/chainreactors/malefic/discussions) 关于implant的bug, 疑惑, 需求, 建议都欢迎在该项目的issue/disscussion中讨论

malice-network的[issues](https://github.com/chainreactors/malice-network/issues)和[disscussion](https://github.com/chainreactors/malice-network/discussions) 关于client/server的bug, 疑惑, 需求, 建议都欢迎在该项目的issue/disscussion中讨论

!!! tip "公开的讨论更能帮助IoM改进自身"
    当然也有一些不便公开的讨论, 欢迎通过微信群添私聊我

### 微信群

如果有深入讨论关于IoM的问题, 更建议在github的issues/disscussion中进行, 微信群一般只用来广播更新进度. 

微信群已超过200人, 可以通过 m09ician@gmail.com 发送邮件, 会定期拉人入群
## 用户协议

**1. 授权使用范围**

> 本工具旨在促进网络安全技术研究，用户应在符合以下条件的场景中使用：
> 
> - 获得目标系统所有者的 **书面授权** ；
>     
> - 学术机构或企业在 **可控环境** 中的防御能力验证；
>     
> - 法律法规许可的其他正当目的。  
>     ※ 我们恳请用户恪守法律底线， **切勿用于未授权访问、数据窃取或系统破坏** 。
>     

**2. 责任与风险提示**

> - 用户应理解网络安全工具的敏感性， **自行评估操作风险** 并采取数据备份等防护措施；
>     
> - 因用户违反法律法规造成的后果，开发者 **依法不承担连带责任** （参见《刑法》第285条及司法解释）；
>     
> - 开发者将持续优化工具安全性，但无法保证使用过程中的绝对稳定性。
>     

**3. 技术合规承诺**

> 为维护技术伦理，我们承诺：
> 
> - 项目代码 **开源可审计** ，不含任何隐蔽恶意功能；
>     
> - Community版本 **永久保持无对抗性设计** （不规避安全防护），所有行为特征公开于 `malefic.yara`；
>     
> - 涉及高风险操作的功能已添加 **双重确认机制** 。
>     

**4. 社区协作原则**

> - 如发现工具被用于非法场景，欢迎通过 [m09ician@gmail.com](https://mailto:m09ician@gmail.com/) 告知，我们将协助采取合理措施；
>     
> - 收到司法机关正式协查函件时，将 **依法配合提供必要信息** ；
>


**5. 数据收集与隐私声明**

> 为了合规性要求，工具在运行过程中将遵循最小必要原则收集以下数据：
