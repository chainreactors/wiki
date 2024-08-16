---
title: Internal of Malice · index
---

## overview 

**本文档为预览文档.** 

Internal of Malice(恶联网) 力图实现一套post-exploit基础设施, 在兼容CS,MSF,Sliver生态的同时, 提供更高的拓展性与隐蔽性, 并提供一套工程化的解决方案.

C2是比其他领域更具挑战性, 不管在设计上还是实现上都更为复杂. 

而我们想尝试设计的更是下一代C2, 一个能在交互体验, 拓展性, 端口对抗, 流量对抗等等能力上都更先进的C2框架. 

目前v0.0.1离设计目标的完全体形态还有非常大的距离. 但受限于开发进度, 我们决定先接受来自社区的意见, 闭门造车造不出最先进的工具.

所以我们计划在实现第一阶段功能后, 就发布IoM -community v0.0.1 作为预览版本. 

!!! example "Features."

    - rust编写的implant, 实现全平台兼容
    - 专注于opsec (community不支持)
    - everything is fileless
    - 插件兼容, 兼容cobaltstrike的BOF与sliver的armory社区生态
    - 自由组装, implant的所有模块都可以在编译时自由组装
    - 热插拔, implant的所有模块都可以动态载入, 不需要重新编译, 不需要重启进程
    - 插件化, client,server,implant都将保留大量插件接口, 致力于实现cobaltstrike同样的自由度


### 架构/architecture

IoM将由一系列仓库组成

**WIP** 🛠️ 表示将会实现; 
 
**Private** 🔒 表示已实现但暂未公开

**Professional** 👤 表示需要额外审核的用户可访问

**主体框架**

* server+client: https://github.com/chainreactors/malice-network
* implant: https://github.com/chainreactors/malefic
* 通讯协议(protobuf): https://github.com/chainreactors/proto
* 流量与代理: https://github.com/chainreactors/malefic-rem (🔒)
* 插件仓库 : mals (🛠️)
* loader generator: malign 用于免杀与EDR对抗 (🛠️)

**kits**
是一些专注于opsec与edr对抗的插件包或各类小组件, 作为IoM的附加能力

* malefic-win-kit , windows端工具包, 包含headlessPE, sleepmask, 进程注入, 进程镂空等等关于opsec的模块, 可以被implant热加载 (👤)
* malefic-linux-kit (🛠️)
* malefic-*os-kit (🛠️)
* malefic-android-kit (🛠️)
* malefic-srdi (🔒),  pe to shellcode 
* mice (🔒), 持久性后门






