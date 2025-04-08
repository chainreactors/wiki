
 经过几个月的时间，带来了四大全新的功能模块

- 基于vscode extension的GUI客户端
- 基于lua脚本语言的插件系统以及迁移了数百个插件的基础插件生态
- 基于rem实现的代理/隧道功能组
- 类似BeaconGate的动态函数调用

当然目前与CobaltStrike对比不免有些不自量力，班门弄斧。但这也代表IoM主体功能的阶段性成果。IoM不再是一个实验室中的demo， 而是能初步用于实战的工具。 

CobaltStrike最大的护城河是丝滑的GUI客户端， 稳定的beacon，以及丰富的插件生态。以至于抹平其OPSEC上的劣势。 而现在CobaltStrike的二开止步4.6， 破解版本停滞在4.10， 主流的CobaltStrike的使用者逐渐远离了其最新版本。 这让IoM有机会成为CS的备选品(我们承认距离代替CS还有不小的距离)。

## 更新日志
### GUI 客户端

https://github.com/chainreactors/IoM-gui


### Mals 插件生态

https://github.com/chainreactors/mal-community

在v0.0.3中， 我们第一次提供了mal-community。 现在回看， 当时的实现较为粗糙， 有非常多的bug与设计缺陷， 经过两个版本的打磨。 我们可以发布mals 1.0版本了。  


**快速入门mals** :  https://chainreactors.github.io/wiki/IoM/manual/mal/quickstart/ 


已经实现/迁移的插件包: 
- lib
  - noconsolation, https://github.com/fortra/No-Consolation
  - SharpBlock, https://github.com/CCob/SharpBlock
- common (基础工具)
  - operatorskit, https://github.com/REDMED-X/OperatorsKit
  - remoteopsbof, https://github.com/trustedsec/CS-Remote-OPs-BOF
  - situationalbof, https://github.com/trustedsec/CS-Situational-Awareness-BOF
  - chainreactor, gogo/zombie/spray 等 chainreactor 的工具
- elevate (提权)
- persistence (权限维持)
- proxy (网络/代理)
	- https://github.com/go-gost/gost
	- https://github.com/chainreactors/rem/
#### mals中间层

通过 https://github.com/chainreactors/mals 实现了一个grpc与golang的中间层，可以通过中间层将各种内部函数/grpc等对外暴露给lua， yaegi等脚本语言。 目前以lua为主， 实现了一套高细粒度的api，以及自动文档生成。


### REM

https://github.com/chainreactors/rem/

rem是全场景代理/隧道工具. 提供了全访问的网络侧功能。 例如正反向代理，端口转发，多传输层信道， 级联等等功能。

因为rem的特殊性， 它会在listener，client， implant发挥不同的作用。 让我分别介绍
#### rem for pipeline

新增rem配置项， 监听rem console 服务

![](assets/Pasted%20image%2020250327004454.png)

这个服务可以给普通的rem二进制文件直接使用， 也可以让client与implant连接。

#### rem for implant

提供了3种加载rem的方式。 

1. 通过.a 文件静态编译(不支持windows msvc)
2. 通过 dll/so 反射动态加载
3. 通过 pe loader 加载exe/elf。(pe to shellcode也算作此列)

这三种方式覆盖了绝大多数使用场景， rem虽然是golang编写的， 但是可以在编译时静态连接/反射动态加载到implant中。 可以作为独立的工具， 和其他二进制程序一样被pe loader加载。 在OPSEC上有略微的不同， 可以参照对应的命令的helper理解其实现原理。 


除了运行rem模块搭建隧道，还支持重载implant的信道，实现 rem over implant。 让rem在网络侧对抗发光发热， rust在网络相关的玩法上并没有优势。 

#### rem for client/mals

rem本身只需要通过单行命令实现所有功能， 而IoM的client上的rem相关命令组一定程度上提供了rem的交互式命令行管理工具。 可以在client上管理已有的连接，新建隧道， 修改配置等。 


而client本身也支持接入 listener <--> implant 构建的网络， 实现网络测的三端打通。 
### implant OPSEC

关于OPSEC的部分我们会保持闭源， 通过提供静态链接库公开基础可用版本。

CobaltStrike有三个大的OPSEC定制切面， 分别是UDRL，sleepmask 以及最新的BeaconGate。我们正在逐步实现CS的这些OPSEC功能， 以及更多的CS没有的OPSEC选项。 
#### Beacon Gate

#### Ollvm



### 其他更新

#### (server) Context 重构

#### (server) donut 更新

#### (server) http pipeline

#### (client) 命令行UI美化

#### (implant) 支持打包与释放文件

#### (implant) 重构资源文件

#### (implant) 支持win11 最新版本的pe loader

#### (implant) 去除外部依赖库

#### (implant) 新增3rd module crate


### Fixs & Optimizations


- [ci] github action 因为某些库的自动依赖更新导致不适配1.74 编译失败
- [ci] 添加了nightly release， 每天自动发布最新版
- [server] event乱序bug
- [client] 更新底层readline与console 
- [implant] 特定情况下implant 发送header中断导致的挂死
- [implant] 重构pipe
- [implant] 去除绝大部分的async_std 依赖， 使用futures代替
- [implant] mutant log 格式美化
- ......


## End


原本计划从v0.0.4直接跳跃到v0.1.0, 实现商业化版本的各种功能。 但现实遇到的困难比预期多得多，我们不得不先发布一个中间版本 v0.0.5。而这个版本也将作为可预见未来内的最后一个大版本，后续会有一些小的改动和修复。 等待从社区中获取足够的使用反馈， 才会进行下一步的开发。 **可以尝试将IoM v0.0.5作为一个稳定版本投入生产， 期待你们的反馈！**

接下来， 我想尝试重构原本的 ASM项目， 实现一个 AI agent版本的ASM。
