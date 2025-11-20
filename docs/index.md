# ChainReactor's Wiki

## ChainReactor

**ChainReactor** 致力于构建 **下一代AI原生的进攻性安全基座**。

通过重构全流程全场景（ASM、C2、Tunnel等）的 **Offensive Infrastructure**，结合先进的 **AI Agent工程**，打造最强大的 **AI Native Offensive Infrastructure** 和 **AI驱动的作战指挥平台**。

我们以统一的设计风格重构各个细分领域的"**allinone**"工具，实现以人为核心、**AI为引擎**的红队工具链与工程化实践。我们将其命名为 **redboot**，通过达到 **临界质量** 以实现工件之间的 **链式反应**，并通过 **AI持续学习** 形成自我进化循环。

## 通往AI Native Offensive Infrastructure的三阶段演进

我们正在构建 **为AI设计** 的完整进攻性基础设施，从工具链到L4级AI主导的自动化攻击模拟平台：

```
第一阶段：Offensive Infrastructure（进攻性基础设施）
         ↓ 构建AI可编程的攻击能力体系
第二阶段：AI Copilot 自动化平台（L2级）
         ↓ 人类主导决策 + AI辅助执行SOP
第三阶段：AI Native Offensive Infra（L4级）
         ↓ AI主导决策与执行的自动化攻击模拟平台
```

**核心理念**：工具不仅为人类设计，更是 **为AI设计** —— 通过DSL让AI精确控制工具行为，通过GraphRAG让AI从每次执行中学习，通过Agent让AI从L2辅助执行演进到L4自主主导。

## Redboot：AI时代的进攻性基础设施

为了达成终极目标，我们的蓝图覆盖了 **Pre-Exploit ↔ Post-Exploit** 全流程，并通过 **AI** 将这些能力整合为智能化作战平台。

目前我们有三条链式反应的链路，分别对应后渗透[IoM](IoM)、前渗透/信息收集([mapping](mapping))、以及打通两者的流量工具[proxy](proxy.md)。这些工具采用统一的DSL设计，让AI能够创造性地组合攻击步骤，并将成功的策略沉淀为可复用的知识资产。

### Chain1 IoM (已发布)

IoM(`Internet of Malice`) 是 **AI原生的下一代C2框架**，以高度模块化与可拓展性为核心设计理念。

**AI Native设计**：
- **插件化DSL**：AI可通过DSL精确控制implant行为，动态生成攻击策略
- **SDK生态**：提供Python/JS/Go SDK，让AI能够编程式调用C2能力
- **知识沉淀**：每次Post-Exploit执行自动归档为GraphRAG可学习的TTP知识

更重要的是，IoM将C2与webshell的能力统一，让同一套插件化基建服务于完全不同的后渗透场景，并为AI提供统一的Post-Exploit能力接口。

!!! important "update v0.0.4"
	已经发布v0.0.4，实现了约sliver的80%、cs的70%功能，也有非常多sliver与cs都没有的功能

目前提供了IoM的[设计文档](/IoM/design)与[用户手册](/IoM/manual)，可以在[这里](https://github.com/chainreactors/malice-network)体验到IoM的v0.1.0

### Chain2 mapping

[mapping](mapping) 是 **AI驱动的攻击面管理引擎**。

gogo/spray/zombie等工具都是为这个目标设计的Pre-Exploit能力组件。通过极高的拓展性与细粒度实现完全可控的攻击面发现与验证。

**AI Native设计**：
- **DSL驱动**：所有工具支持DSL配置，AI可动态生成扫描策略、指纹规则、爆破字典
- **三阶图谱**：从资产拓扑→攻击面分析→攻击策略图，AI实时计算Attack Path
- **知识复用**：成功的DSL自动沉淀到GraphRAG，AI持续优化攻击效率

目前提供了mapping的[设计文档](/mapping/design)，可以看到mapping作为红队向的协作式攻击面引擎的设计理念。

### Chain3 rem (已发布)

rem是 **AI可编程的全场景流量/代理工具**。

能解决绝大多数场景的代理与转发需求，打通mapping与IoM，让mapping能通过rem+IoM接入内网。rem提供了传输层、应用层、加密层、混淆层的拓展接口，可被轻松修改为自定义特征。

**AI Native设计**：
- **隧道配置DSL**：AI可动态生成代理链路配置，适应复杂网络环境
- **流量特征定制**：AI根据目标环境自动调整流量混淆策略
- **Pre-Post桥接**：为AI提供统一的流量中转能力，连接侦察与后渗透阶段

目前提供了rem的[设计文档](/rem)与社区版 https://github.com/chainreactors/rem-community

---

*目前这三个thread都已经完成了v0.0.1, 将逐步发布.*

### 商业化计划

现在redboot相关的项目逐渐从玩票性质转为了主业。redboot是 **AI原生的一体化进攻性平台** 的 **理想形态**，我们认为这个计划存在商业化的潜力。

如果您有以下需求，欢迎与我们联系：
- **AI驱动的蓝军基础设施建设**
- **CTEM平台（ASM + BAS）**
- **红队作战指挥平台**
- **AI Agent定制化开发**

??? mail
	m09ician@gmail.com

#### 接受定制化和采购的产品

- **morefingers**：额外包含约50000条指纹规则（与fingers自带的有重复），可无缝接入fingers，支持AI动态生成指纹
- **[IoM](https://chainreactors.github.io/wiki/IoM/)**：AI原生的下一代C2框架，目前发布了v0.0.4，正在快速开发迭代，支持AI编程式调用
- **[rem](https://chainreactors.github.io/wiki/rem/)**：AI可编程的全场景流量/代理工具，能实现一切代理/流量侧的需求
- **AI Agent平台**：基于进攻性基础设施的AI作战指挥平台（开发中）

## ToolChain：AI原生的工件体系

chainreactor 并非在各个领域重新造轮子，而是以 **工件化视角** 定义下一代工具，并通过 **DSL设计** 让AI能够精确控制这些工具。工具链将作为3个Threads的基本粒子赋能各个细分领域。

**核心设计理念**：
- **DSL优先**：所有工具支持DSL配置，AI可动态生成攻击策略
- **结构化输出**：统一的JSON输出格式，便于AI解析和学习
- **知识沉淀**：成功的DSL自动归档到GraphRAG，形成可复用的知识资产

_没有添加超链接的为暂未公开的项目_

### Artifact：AI可编程的攻击工件

chainreactor 自研的工具链，每个工具都是AI的"效应器"

- [gogo](gogo/index) - 面向红队的自动化引擎，支持AI动态生成扫描策略
- [spray](spray/index) - 下一代目录爆破工具，AI可通过字典DSL优化爆破效率
- [urlfounder](https://github.com/chainreactors/urlfounder/) - 被动URL收集工具
- [zombie](https://github.com/chainreactors/zombie/) - 服务/协议爆破工具，支持AI定制爆破策略DSL
- searcher - 空间引擎交叉递归爬虫 (Private)
- ani - 企业信息爬虫 (Private)
- found - 基于nuclei-templates的配置化敏感信息收集工具 (WIP)
- meta-matrix - 云函数化框架，为AI提供分布式执行环境 (Private)

### Lib：AI的知识库与能力库

基础设施库，为AI提供可复用的能力组件

- [words](https://chainreactors.github.io/wiki/libs/words/) - 使用go重写的hashcat mask/rule字典生成器，AI可编程式生成字典
- [templates](https://github.com/chainreactors/templates) - 工具链各类配置库（指纹、敏感信息、PoC、字典、端口等），AI的知识库基础
- [neutron](https://chainreactors.github.io/wiki/libs/neutron/) - 轻量级nuclei引擎，AI可通过PoC YAML DSL验证漏洞
- [fingers](https://chainreactors.github.io/wiki/libs/fingers/) - 指纹库的go实现，AI可动态生成指纹规则
- [proxyclient](https://github.com/chainreactors/proxyclient) - golang风格的proxy客户端，支持http/https、socks5/socks4/socks4a、ssh等代理
- [parsers](https://github.com/chainreactors/parsers) - 封装工具链输入输出解析，为AI提供结构化数据
- [mals](https://github.com/chainreactors/mals) - 基于lua的插件引擎，支持AI动态加载能力
- [crtm](https://github.com/chainreactors/crtm) - chainreactor包管理工具
- [picker](https://github.com/chainreactors/picker) - 将repo变成RSS订阅、文章整理归档、讨论的社区
- [wiki](https://github.com/chainreactors/wiki) - chainreactors文档库Markdown



## Other

我们将毫无保留地公开我们的设计理念与各种实践中积累的经验，也欢迎社区提供更多的意见、经验以及PR。

**开源与商业化**：

我们的绝大部分工具将会保持开源，为社区提供一个开源的选项，并在基于开源尝试寻找商业化路线。不过为了避免可能的争议，我们的开源协议不会选择商业化友好的协议，只对个人使用者保持完全的开放。

**AI时代的开源理念**：

- **工具开源**：核心工具链（gogo、spray、zombie、IoM等）保持开源
- **知识共享**：设计文档、架构思路、实战经验完全公开
- **AI能力开放**：DSL设计、Executor架构、知识沉淀机制开源
- **商业化部分**：AI Agent平台、CTEM平台、企业级知识库等作为商业化产品

部分工具正在开发中，非常多功能没有实现，也需要充分的测试才能公开，所以暂时只对贡献者开放试用。

接下来一段时间，我们将会发布一部分自认为时机相对成熟的工件，并介绍设计过程中的一些奇思妙想与实战中面临的问题，特别是 **如何为AI设计进攻性基础设施** 的思考与实践。
