---
title: Internal of Malice · index
---
## overview 

Internal of Malice(恶联网) 力图实现一套开源post-exploit基础设施, 在兼容CS,MSF,Sliver生态的同时, 提供更高的拓展性与隐蔽性, 并提供一套工程化的解决方案.

C2是比其他领域更具挑战性, 不管在设计上还是实现上都更为复杂. 

而我们想尝试设计的更是下一代C2, 一个能在交互体验, 拓展性, 端上对抗, 流量对抗等等能力上都更先进的C2框架. 


~~我们计划在实现第一阶段功能后, 发布IoM-community v0.0.1 作为预览版本.~~

~~目前已经发布v0.0.2离设计目标的完全体形态还有较大的距离.~~ 

~~v0.0.3 已经实现我们最初设计目标的大部分功能, 并且可以说是开源社区中最强大的C2了. 并且我们有了大的野心. **IoM致力于成为开放的红队基础设施**~~

~~v0.0.4 修复了上个版本留下的遗憾， 将兼容性拓展到rust生态的每个角落； 并且通过github action极大简化了编译复杂度；完善了多段加载的实现。~~ 

v0.1.0 我们补全了作为一个现代C2的所有功能，GUI、代理、OPSEC、插件。现在我们可以很自豪的说， **IoM 已经是目前所有开源C2中，支持功能最全、 可拓展能力最丰富、OPSEC最强、工程化最完善的现代化C2， 没有之一。**

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


### 架构/architecture

IoM将由一系列仓库组成

- **WIP** 🛠️ 表示将会实现; 
- **Private** 🔒 表示已实现但不完善还需要调整因暂未公开, 但在发布计划中
- **Professional** 👤 表示需要额外审核的用户可访问


!!! important "文档中能见到的没有添加 🛠️, 🔒 ,  👤 标记的内容为已经开源的"
	实际上server, client, listener, implant均已完全开源, 只有implant的一部分组件因为对抗的原因不能完全开源, 以lib的方式提供. 不影响编译, 使用, 二开.

**主体框架**

* server+client+listener: https://github.com/chainreactors/malice-network
* implant: https://github.com/chainreactors/malefic
* 通讯协议(protobuf): https://github.com/chainreactors/proto
* 插件仓库 : [mals](https://github.com/chainreactors/mals)
	* 社区版默认插件包: [mal-community](https://github.com/chainreactors/mal-community)
* 流量与代理: https://github.com/chainreactors/rem-community 

**kits**
是一些专注于opsec与edr对抗的插件包或各类小组件, 作为IoM的附加能力

* malefic-win-kit , windows端工具包, 包含headlessPE, sleepmask, 进程注入, 进程镂空等等关于opsec的模块, 可以被implant热加载 (👤)
* malefic-linux-kit (🛠️)
* malefic-*os-kit (🛠️)
* malefic-android-kit (🛠️)
* mice (🔒), 持久性后门

## 更新日志

- [v0.0.1 next generation C2 project](/blog/2024/08/16/%E4%B8%80%E4%B8%8B%E4%BB%A3c2%E8%AE%A1%E5%88%92-----internal-of-malice/)
- [v0.0.2 the Real Beginning](/blog/2024/09/23/IoM_v0.0.2/)
- [v0.0.3 RedTeam Infra&C2 framework](/blog/2024/11/20/IoM_v0.0.3/)
- [v0.0.4 Bootstrapping](/blog/2025/01/02/IoM_v0.0.4/)
- [v0.1.0 代替CobaltStrike的最后四块碎片](/blog/2025/04/14/IoM_v0.1.0/)

**Advanced Posts:**

- [PELoader&RDI的TLS之殇](/blog/2025/01/07/IoM_advanced_TLS/)
## 社区

### github

malefic的[issues](https://github.com/chainreactors/malefic/issues)和[disscussion](https://github.com/chainreactors/malefic/discussions) 关于implant的bug, 疑惑, 需求, 建议都欢迎在该项目的issue/disscussion中讨论

malice-network的[issues](https://github.com/chainreactors/malice-network/issues)和[disscussion](https://github.com/chainreactors/malice-network/discussions) 关于client/server的bug, 疑惑, 需求, 建议都欢迎在该项目的issue/disscussion中讨论

!!! tips "公开的讨论更能帮助IoM改进自身"
	当然也有一些不便公开的讨论, 欢迎通过微信群添私聊我

### 微信群

如果有深入讨论关于IoM的问题, 更建议在github的issues/disscussion中进行, 微信群一般只用来广播更新进度. 

微信群已超过200人, 可以通过 m09ician@gmail.com 发送邮件, 会定期拉人入群
### 用户协议

* 本工具仅限拥有授权的用户在被授权项目中使用, 任何非法使用造成的后果与本工具无关.
* 本工具反对任何违法犯罪行为, 如有相关部门申请协助调查, 我们会尽全力配合.
* 本工具不包含任何破坏性的代码, 在进行可能造成的破坏的操作请用户自行评估.
* **Community** 版本不会试图与任何防护产品进行对抗. 所有特征将保持发布时的特征. 并提供对应的yara规则.



