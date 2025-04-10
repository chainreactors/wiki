
 经过几个月的时间，带来了四大全新组件, 以及十几个较大的功能性更新与数百个修复与优化。

四大新组件: 

- 基于vscode extension的GUI客户端
- 基于lua脚本语言的插件系统以及迁移了数百个插件的基础插件生态
- 基于rem实现的代理/隧道功能组
- 类似BeaconGate的动态函数调用

当然目前与CobaltStrike对比不免有些不自量力，班门弄斧。但这也代表IoM主体功能的阶段性成果。IoM不再是一个实验室中的demo， 而是能初步用于实战的工具。 

CobaltStrike最大的护城河是丝滑的GUI客户端， 稳定的beacon，以及丰富的插件生态。以至于抹平其OPSEC上的劣势。 而现在CobaltStrike的二开止步4.6， 破解版本停滞在4.10， 主流的CobaltStrike的使用者逐渐远离了其最新版本。 这让IoM有机会成为CS的备选品(我们承认距离代替CS还有不小的距离)。

## 新组件

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

我们迁移了数百个CobaltStrike的插件功能， 完成了mals社区的起步阶段的基础设施建设， 这些功能覆盖绝大多数常用的CobaltStrike的使用场景。

也是对IoM基础能力的一次完整的测试。这些插件大部分经过我们的简单测试， 确保其至少能运行在implant中不panic以及基本功能正常。

**这意味着mals与malefic功能上能完全代替CobaltStrike的aggresive script， 并且提供了细粒度更高的API。**

我们期待mals能在C2社区中有一席之地
#### mals中间层

通过 https://github.com/chainreactors/mals 实现了一个grpc与golang的中间层，可以通过中间层将各种内部函数/grpc等对外暴露给lua， yaegi等脚本语言。 目前以lua为主， 实现了一套高细粒度的api，以及自动文档生成。


### REM

https://github.com/chainreactors/rem/

rem是全场景代理/隧道工具. 提供了全访问的网络侧功能。 例如正反向代理，端口转发，多传输层信道， 级联等等功能。

v0.0.5 全面接入了rem 它会在listener，client， implant发挥不同的作用。 我将分别介绍
#### rem for pipeline

新增rem配置项， 监听rem console 服务

![](assets/Pasted%20image%2020250327004454.png)

这个服务可以给普通的rem二进制文件直接使用， 也可以让client与implant连接。

不再需要下载独立的rem程序， IoM的server就可以当作rem的服务端， 并提供了更多的管理功能。
#### rem for implant

提供了3种加载rem的方式。 

1. 通过.a 文件静态编译(不支持windows msvc)
2. 通过 dll/so 反射动态加载
3. 通过 pe loader 加载exe/elf。(pe to shellcode也算作此列)

这三种方式覆盖了绝大多数使用场景， rem虽然是golang编写的， 但是可以在编译时静态连接/反射动态加载到implant中。 可以作为独立的工具， 和其他二进制程序一样被pe loader加载。 在OPSEC上有略微的不同， 可以参照对应的命令的helper理解其实现原理。 


除了运行rem模块搭建隧道，还支持重载implant的信道，实现 rem over implant。 让rem在网络侧对抗发光发热， rust在网络相关的玩法上略逊于golang。 

#### rem for client/mals

rem本身只需要通过单行命令实现所有功能， 而IoM的client上的rem相关命令组一定程度上提供了rem的交互式命令行管理工具。 可以在client上管理已有的连接，新建隧道， 修改配置等。 


而client本身也支持接入 listener <--> implant 构建的网络， 实现网络测的三端打通。 

#### 小结

总的来说， 我们可以在client中通过一组命令操控server管理rem的console， 也可以直接基于rem在implant实现各种 proxy/tunnel的功能。 

```

```
### implant OPSEC

关于OPSEC的部分我们会保持闭源， 通过提供静态链接库公开基础可用版本。

CobaltStrike有三个大的OPSEC定制切面， 分别是UDRL，sleepmask 以及最新的BeaconGate。我们正在逐步实现CS的这些OPSEC功能， 以及更多的CS没有的OPSEC选项。 
#### Beacon Gate

#### Ollvm



### IoM for AI (Unstable)

*这是隐藏的第五个新组件，但是功能暂时还没有稳定，所以不算是正式发布。* 

AI给IoM的开发提供了非常巨大的帮助， 有不少模块的原型都是AI实现的。

并且在设计早期， 我们就幻想过如何将AI应用到C2中， 之前一直没有特别好的方案， 而现在我们有了全新的工具和思路。

刚才提到过我们的GUI基于vscode插件实现，而AI编程也很难离得开vscode， 如cursot、cline，trae，windsurf 等工具都离不开vscode。可以说vscode 大概率是未来AI编程的试验中心。 **IoM GUI在这个AI 驱动的自动化渗透领域中有先天的优势。** 

而这段时间内，出现了MCP协议， 作为AI与传统工具的桥梁， 让我们可以更快的打通其间的壁垒， 让我们不再需要自行实现一个agent框架，直接将知识和能力都暴露给AI， 让AI根据需求自行调用。 

**该功能还处于于早期测试阶段，会在nightly release中发布** 
![](assets/965c49bcc9de7d1706afc1cbfea36d0.png)



## 更新日志

#### (server) Context 重构

为了管理可复用的数据，提供了一组api保存渗透过程中需要重复使用的常见数据。

![](assets/Pasted%20image%2020250411004105.png)

#### (server) donut 重构

之前我们尝试自行实现了 https://github.com/chainreactors/malefic-srdi ， 但是RDI的功能并不止PE to shellcode， 还有大量各种各样的功能, 最后我们选择了妥协。 后续将采用二开的donut实现。 
这里
- 感谢 @howmp 的 https://github.com/howmp/donut_ollvm 
- 感谢@howmp 将malefic-srdi中TLS的解决方案移植到了zig。 
- 感谢@zema1 将TLS的解决方案从zig移植到了donut
- 感谢@wabzsy的 https://github.com/wabzsy/gonut 基于donut 1.1实现了golang版本的donut前端

又进行了大量的改造：

- 自动化 ollvm 编译
- 修复多个gonut的错误
- 将gonut升级到适配donut 1.1
- 注册到IoM的client与server的各个使用场景中

最终成功呈现在 https://github.com/chainreactors/malice-network/tree/dev/external/gonut 中
#### (server) http pipeline

实现了http pipeline的基础功能,  能自定义基本的特征。 并且将原本pulse http协议上线的相关功能从website迁移到http pipeline中。

现在http pipeline负责pulse和malefic beacon的http协议交互，website现在只负责挂载文件。 

#### (client) 命令行UI美化

flag分组展示
![](assets/959b94bc14e874f769a13000e27d807.jpg)

OPSEC标记，颜色标记，ATT&CK标记

![](assets/Pasted%20image%2020250411013610.png)

命令行help细节

![](assets/Pasted%20image%2020250411013629.png)
#### (implant) 支持打包与释放文件

implant添加了pack相关配置， 可以指定打包文件的路径与释放路径， 并在释放后自动打开文件。 

![](assets/Pasted%20image%2020250411013800.png)

#### (implant) 重构资源文件

通过 embed-resource 库(仅编译时引入)实现更多的资源文件功能。 并支持gnu+msvc(原先只支持msvc)

例如在启动时申请管理员权限或者UAC权限

![](assets/Pasted%20image%2020250411013947.png)

#### (implant) 支持win11 最新版本的pe loader



#### (implant) 去除外部依赖库

在早期版本中， 为了快速实现功能， 引入了大量第三方库， 这些库会引入更多不必要的库和特征， 并且会导致我们无法定制每个细节的OPSEC。 

所以在此次更新中， 尽可能去掉了所有不必要的库。目前仅剩下wmi依赖了@lz520520 修改后的库。 不过在后续更新中应该也会去除， 完全本地化。 并且将会实现一套类似BeaconGate的机制增强这些基本功能的OPSEC

#### (implant) 运行时解耦

在早期版本中， malefic 异步运行时基于tokio实现， 后来为了尽可能缩减依赖库， 替换为了async-std。 但因为async-std的停止更新以及3rd插件的引入。 我们对异步运行时做了解耦。 现在可以在三种异步运行时中任意选择一个， 用来适配不同的插件场景. 

当前支持的异步运行时：

- tokio
- async-std
- smol

可以在 implant的config.yaml 中修改

```yaml
implants:
  runtime: tokio
```

#### (implant) implant autorun

在v0.0.3中就引入了malefic-prelude.

这个功能是基于 yaml 2 protobuf实现的自动化命令预编排。 可以实现在启动时不进行任何交互就完成权限维持，反HOOK， 反DEBUG，杀软检查等功能。

现在我们给beacon也加入了这个功能， 不再必须分阶段实现。 

可以在编译时编译到beacon中， 在beacon启动时自动执行预编排的任务。 

```yaml
implants:  
  autorun: "persistence.yaml"
```

persistence.yaml:
```yaml
-
  name: bof
  body: !ExecuteBinary
    name: addservice
    bin: !File "addservice.o"

```

#### (implant) 新增3rd module crate

为了实现内置的rem， 我们引入了[3rd module](https://github.com/chainreactors/implant/tree/master/malefic-3rd)。 

在这个module集合中， 不再限制外部依赖库的使用， 后续的rustdest, keylogger或者各种需要依赖外部rust库的功能都会放到这里。 

3rd module 默认不会编译到beacon中， 通常作为hot load module使用。 如果想要直接编译时打包可以修改config.yaml

```yaml
implants:  
  modules:  
    - "full"  
  enable_3rd: false  
  3rd_modules:  
    - "full"
```

当然我们不建议这么做， 因为光引入了简单的http client。 体积就增加了数百K。 可以根据自己的需求修改

### Fixs & Optimizations


- [ci] github action 因为某些库的自动依赖更新导致不适配1.74 编译失败
- [ci] 添加了nightly release， 每天自动发布最新版
- [server] event乱序bug
- [server] 数据库结构大量改动，需要重建数据库， **从这个版本开始，后续将会实现自动化数据库迁移， 就算版本更新也不用担心数据丢失**
- [client] 更新底层readline与console 
- [client] 添加ClientGroup mals函数组, 添加了一组与cli交互的辅助函数，例如各种命令行补全
- [client] event format 重构， 现在将会在server format后再发送到各端
- [implant] 特定情况下implant 发送header中断导致的挂死
- [implant] 重构pipe
- [implant] 去除绝大部分的async_std 依赖， 使用futures代替
- [implant] mutant log 格式美化
- ......


## End


原本计划从v0.0.4直接跳跃到v0.1.0, 实现商业化版本的各种功能。 但现实遇到的困难比预期多得多，我们不得不先发布一个中间版本 v0.0.5。而这个版本也将作为可预见未来内的最后一个大版本，后续会有一些小的改动和修复。 等待从社区中获取足够的使用反馈， 才会进行下一步的开发。 **可以尝试将IoM v0.0.5作为一个稳定版本投入生产， 期待你们的反馈！**


也有一个相对遗憾的消息， 受限于资源和精力， v0.0.5 可能将是未来一段时间内的稳定版本。 因为实现roadmap中v0.1.0需要消耗的资源比预计的更多，也因为各种其他原因，我们无法按照预期实现v0.1.0的 Professional 和Community两个版本。 v0.1.0 应该只会面向付费用户。

如果您认可我们的产品， 欢迎联系我们咨询关于IoM Professional的相关信息。 联系方式: m09ician@gmail.com

