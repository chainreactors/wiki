# ChainReactor's Wiki

## ChainReactor

**chainreactor** 专注于 **offensive security** 领域.

以统一的设计风格去重构各个细分领域"**allinone**"工具, 去实现以人为核心的红队工具链与工程化实践,  我们将其命名为 **redboot** .  最终计划实现面向 **面向红队** 的 **一体化平台** ,提供一整套完整的 **红队工程基础设施** . 

通过达到 **临界质量** 以实现工件之间的 **链式反应**。

## Redboot Roadmap

为了达成我们的终极目标. 我们的蓝图从ASM拓展到了C2框架+流量控制工件+ASM框架三个部分.  这三个领域将覆盖攻击模拟流程中的Pre-Exploit <--> Post-Exploit

目前我们的计划中有三条链式反应的链路, 分别对应了后渗透[IoM](IoM), 前渗透/信息收集([mapping](mapping)), 以及打通IoM与mapping的流量工具[rem](rem)

### Chain1 IoM (已发布)

IoM(`Internet of Malice`) 的定位是下一代C2框架, 同样以高度模块化与可拓展性为核心设计理念. 基于这个理念去实现插件化的OPSEC, 插件化的社区生态, 插件化的一切.

更重要的是, IoM将结合C2与webshell, 将同一套插件化的基建共享给完全不同的后渗透场景. 

IoM已经发布v0.0.1, 这个版本离我们最初的v0.0.1设计目标还有很多遗憾, 但是为了防止闭门造车, 我们想提前从社区中接收反馈.

!!! important "update v0.0.4"
	已经发布v0.0.4, 实现了约sliver的80%, cs的70%功能, 也有非常sliver与cs都没有的功能

目前提供了IoM的[设计文档](/IoM/design)与[用户手册](/IoM/manual) ,可以在[这里](https://github.com/chainreactors/malice-network)体验到IoM的v0.1.0

### Chain2 mapping

[mapping](mapping) *预计在2024年内发布*

ASM是chainreactor的初衷, gogo/spray/zombie之类的工具实际上都是为了这个目标设计的. 通过极高的拓展性与细粒度实现的完全可控的攻击面管理引擎.

现在这个目标已经完成了v0.0.1, 但因为一些数据源与部署方式的问题, 暂时无法发布. 

目前提供了mapping的[设计文档](/mapping/design), 可以在这里看到mapping作为红队向的协作式攻击面引擎的设计理念.

### Chain3 rem (已发布)

rem是全场景的流量/代理工具. 能用来解决绝大多数场景的代理与转发需求, 也用来打通mapping与IoM, 让mapping能通过rem+IoM接入内网. rem提供了在传输层, 应用层, 加密层, 混淆层的拓展接口. 可以被轻松修改为自定义特征, 也将是IoM在流量端的能力拓展. 

目前提供了rem的[设计文档](/rem) 与社区版 https://github.com/chainreactors/rem-community

---

*目前这三个thread都已经完成了v0.0.1, 将逐步发布.*

### 可能会存在的商业化计划

现在redboot相关的项目逐渐从玩票性质转为了主业. redboot几乎是 **一体化攻击平台** 的 **理想形态** . 因此, 我们认为这个计划存在商业化的潜力.

如果您有 **蓝军基础设施建设** ，红队服务，BAS基础设施 的需求， 欢迎与我们联系。


??? mail
	m09ician@gmail.com
#### 接受定制化和采购的工具

- morefingers , 额外包含了约50000条指纹规则(与fingers自带的有重复), 可无缝接入fingers
- [IoM](https://chainreactors.github.io/wiki/IoM/), 目前发布了v0.0.4, 下一代C2框架, 正在快速开发迭代, 欢迎提供需求和定制化要求
- [rem](https://chainreactors.github.io/wiki/rem/) 能实现一切代理/流量侧的需求

## ToolChain

chainreactor 并非在各个领域重新造轮子, chainreactor 将会在各个细分领域深入探索, 以工件化的视角定义下一代的工具. 工具链将作为3个Threads的基本粒子赋能各个细分领域. 

_没有添加超链接的为暂未公开的项目_

### Artifact

chainreactor 自研的工具链

- [gogo](gogo/index) 面向红队的自动化引擎
- [spray](spray/index) 下一代目录爆破工具
- [urlfounder](https://github.com/chainreactors/urlfounder/) 被动 url 收集工具
- [zombie](https://github.com/chainreactors/zombie/) 服务/协议下一代爆破工具
- searcher 空间引擎交叉递归爬虫 (Private)
- ani 企业信息爬虫 (Private)
- found 基于nuclei-templates的配置化的本地敏感信息收集工具 (WIP)
- meta-matrix 云函数化框架 (Private)

### Lib

基础设施库

- [words](https://chainreactors.github.io/wiki/libs/words/) , 使用 go 重写了 hashcat 中的 mask/rule 字典生成器, 并添加了一些新功能
- [templates](https://github.com/chainreactors/templates)  工具链各类配置库, 包括指纹, 敏感信息, poc, 字典, 端口等等
- [neutron](https://chainreactors.github.io/wiki/libs/neutron/) 使用纯 go 实现并去掉几乎全部第三方依赖的轻量级 nuclei 引擎, 可以无副作用的集成到任意工具中而不会破坏系统兼容性. 也几乎不会带来额外的依赖.
- [fingers](https://chainreactors.github.io/wiki/libs/fingers/)  templates, wappalyzer, fingerprinthub等指纹库的go实现,  支持自定义添加各类第三方指纹库
- [proxyclient](https://github.com/chainreactors/proxyclient) golang风格的proxy客户端, 支持http/https, socks5/socks4/socks4a, ssh等代理
- [parsers](https://github.com/chainreactors/parsers), 封装了 chainreactor 工具链上的各个工具输入输出的解析相关的代码.
- [mals](https://github.com/chainreactors/mals) 基于lua实现的插件引擎
- [crtm](https://github.com/chainreactors/crtm) 基于pdtm修改的chainreactor包管理工具. 
- [picker](https://github.com/chainreactors/picker) 将repo变成RSS订阅,文章整理归档, 讨论的社区
- [wiki](https://github.com/chainreactors/wiki) chainreactors 文档库Markdown



## Other

我们将毫无保留的公开我们的设计理念与各种实践中积累的经验, 也欢迎社区提供更多的意见, 经验以及 PR. 

我们的绝大部分工具将会保持开源, 为社区提供一个开源的选项, 并在基于开源尝试寻找商业化路线, 不过为了避免有可能的争议, 我们的开源协议不会选择商业化友好的协议, 只对个人使用者保持完全的开放.

部分工具正在开发中, 非常多功能没有实现, 也需要充分的测试才能公开, 所以暂时只对贡献者开放试用.

接下来一段时间, 我们将会发布一部分自认为时机相对成熟的工件, 并介绍设计过程中的一些奇思妙想与实战中面临的问题.
