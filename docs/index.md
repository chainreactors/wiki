# ChainReactor's Wiki

chainreactor 将专注于红队自动化领域. 

以一种统一的设计风格去设计各个细分领域"allinone"工具, 去实现以人为核心的半自动化工具链, 最终实现面向红队的协作式攻击面发现框架.

## ToolChain

chainreactor并非在各个领域重新造轮子, chainreactor将会解决很多其他人没考虑过的问题, 将会以工件化的视角定义下一代的工具. 

*没有添加超链接的为暂未公开的项目*

### Tools 

chainreactor 自研的工具链

- [GOGO](gogo/index.md) 基于端口的自动化引擎
- [Spray](spray/index.md) 下一代目录爆破工具
- Zombie 服务口令爆破工具
- Ina 一个空间引擎交叉爬虫
- Ani 企业信息爬虫
- ReMaitai全能的流量中间件/流量代理工具
- meta-matrix 云函数化框架
- Kindred 面向红队的协作式攻击面发现框架

### Lib

一些为了工具开发的通用库

* [words](https://github.com/chainreactors/words) ,  使用go重写了hashcat中的mask/rule 字典生成器, 并添加了一些新功能
* [parsers](https://github.com/chainreactors/parsers), 封装了chainreactor工具链上的各个工具输入输出的解析相关的代码. 
* [gogo-templates](https://github.com/chainreactors/gogo-templates) , gogo的指纹库, poc库等; 也为spray,kindred等工具提供指纹识别功能 
* kindred-engine, 一个面向云函数的工作流调度引擎
* kindred-cli, kindred的团队协作客户端

## Roadmap

**step1**

公开gogo, spray, zombie, ani, ina, 并根据需求选用并改造projectdiscovery中的工具

**step2**

公开meta-matrix 云函数化框架, 并将工具链上的各个工具云函数化

**step2**

公开remaitai, 作为打通内外网的流量中间件, 并初步实现kindred以及kindred的各个组件. 

## Other

我们将毫无保留的公开我们的设计理念与各种实践中积累的经验, 也欢迎社区提供更多的意见, 经验以及pr. 所有的工具链我们都将开源, 但因为主业是红队, 并不能全身心投入到开发中, 有些功能短期内无法完成.

目前也有不少与我们想法有重合的创业公司, 但我们将会保持开源, 为社区提供一个开源的选项, 不过为了避免有可能的冲突, 我们的开源协议不会选择商业化友好的协议, 只对个人使用者保持完全的开放.

部分工具正在开发中, 非常多功能没有实现, 也需要充分的测试才能公开, 所以暂时只对贡献者开放试用.

接下来一段时间, 我们将会发布一部分自认为已经相对成熟的工件, 并介绍设计过程中的一些奇思妙想与实战中面临的问题.

