# ChainReactor's Wiki

## ChainReactor

**chainreactor** 将专注于 **offensive security** 领域.

以统一的设计风格去重构各个细分领域"**allinone**"工具, 去实现以人为核心的红队工具链与工程化实践,  我们将其命名为**redboot**. reboot 最终计划实现面向**面向红队**的**一体化平台,** 提供一整套完整的**红队工程基础设施**. 

通过工件之间的**链式反应**以达到**临界质量**.

## Redboot Roadmap

为了达成我们的终极目标. 我们的蓝图从ASM拓展到了C2框架+流量控制工件+ASM框架三个部分.  这三个领域将覆盖攻击模拟流程中的Pre-Exploit <--> Post-Exploit

### Thread1 IoM

[IoM](IoM)

IoM(`Internal of Malice`) 的定位是下一代C2框架, 同样以高度模块化与可拓展性为核心设计理念. 基于这个理念去实现插件化的OPSEC, 插件化的社区生态, 插件化的一切.

更重要的是, IoM将结合C2与webshell, 将同一套插件化的基建共享给完全不同的后渗透场景. 

IoM即将发布v0.0.1, 这个版本离我们最初的v0.0.1设计目标还有很多遗憾, 但是为了防止闭门造车, 我们想提前从社区中接收反馈.

目前提供了IoM的[设计文档](/wiki/IoM/design.md)与[用户手册](/wiki/IoM/manual.md) ,可以在[这里](https://github.com/chainreactors/malice-network)体验到IoM的v0.0.1

### Thread2 mapping

[mapping Roadmap](mapping/roadmap.md) *预计在2024年内发布*

ASM是chainreactor的初衷, gogo/spray/zombie之类的工具实际上都是为了这个目标设计的. 通过极高的拓展性与细粒度实现的完全可控的攻击面管理引擎.

现在这个目标已经完成了v0.0.1, 但因为一些数据源与部署方式的问题, 暂时无法发布. 

目前提供了mapping的[设计文档](/wiki/mapping), 可以在这里看到mapping作为红队向的协作式攻击面引擎的设计理念.

### Thread3 rem

*预计在2024年内发布*

rem是全场景的流量/代理工具. 能用来解决绝大多数场景的代理与转发需求, 也用来打通mapping与IoM, 让mapping能通过rem+IoM接入内网. rem提供了在传输层, 应用层, 加密层, 混淆层的拓展接口. 可以被轻松修改为自定义特征, 也将是IoM在流量端的能力拓展. 

目前提供了rem的[设计文档](/wiki/rem)

---

*目前这三个thread都已经完成了v0.0.1, 将逐步发布.*

## ToolChain

chainreactor 并非在各个领域重新造轮子, chainreactor 将会在各个细分领域深入探索, 以工件化的视角定义下一代的工具. 工具链将作为3个Threads的基本粒子赋能各个细分领域. 

_没有添加超链接的为暂未公开的项目_

### Artifact

chainreactor 自研的工具链

- [gogo](gogo/index.md) 基于端口的自动化引擎
- [spray](spray/index.md) 下一代目录爆破工具
- [urlfounder](https://github.com/chainreactors/urlfounder/) 快速的被动 url 收集工具
- [zombie](https://github.com/chainreactors/zombie/) 服务口令爆破工具
- searcher 空间引擎交叉递归爬虫 (Private)
- ani 企业信息爬虫 (Private)
- found 基于nuclei-templates的配置化的本地敏感信息收集工具 (WIP)
- meta-matrix 云函数化框架 (Private)

### Lib

基础设施库

- [words](https://chainreactors.github.io/wiki/libs/words/) , 使用 go 重写了 hashcat 中的 mask/rule 字典生成器, 并添加了一些新功能
- [templates](https://github.com/chainreactors/templates) , gogo 的指纹库, poc 库等; 也为 spray,kindred 等工具提供指纹识别功能
- [neutron](https://chainreactors.github.io/wiki/libs/neutron/) 使用纯 go 实现并去掉几乎全部第三方依赖的轻量级 nuclei 引擎, 可以无副作用的集成到任意工具中而不会破坏系统兼容性. 也几乎不会带来额外的依赖.
- [fingers](https://chainreactors.github.io/wiki/libs/fingers/)  templates, wappalyzer, fingerprinthub等指纹库的go实现,  支持添加各类第三方指纹库
- [parsers](https://github.com/chainreactors/parsers), 封装了 chainreactor 工具链上的各个工具输入输出的解析相关的代码.

## Other

我们将毫无保留的公开我们的设计理念与各种实践中积累的经验, 也欢迎社区提供更多的意见, 经验以及 PR. 

我们的绝大部分工具将会保持开源, 为社区提供一个开源的选项, 并在基于开源尝试寻找商业化路线, 不过为了避免有可能的争议, 我们的开源协议不会选择商业化友好的协议, 只对个人使用者保持完全的开放.

部分工具正在开发中, 非常多功能没有实现, 也需要充分的测试才能公开, 所以暂时只对贡献者开放试用.

接下来一段时间, 我们将会发布一部分自认为时机相对成熟的工件, 并介绍设计过程中的一些奇思妙想与实战中面临的问题.
