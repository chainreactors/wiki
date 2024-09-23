---
slug: IoM_design_01
---


## 背景

CS早期版本中通过用户自发的开源形成了社区了, 在近几年添加了 https://cobalt-strike.github.io/community_kit/ 官方的社区插件索引. 

sliver则通过在官方统一维护了[armory武器库](https://github.com/sliverarmory/armory) , 但sliver提供的拓展能力很有限, 只能简单注册命令, 预设参数. 在支持的生态上也只有 bof, dll, CLR. 

在前人的工作上改进IoM的插件生态设计. 我们计划在多个维度提供不同领域的拓展能力. 

我们在[IoM的设计文档中提到过插件相关设计目标](https://chainreactors.github.io/wiki/IoM/design/#_8) 

本文将更具体的描述这个设计理念的实现路径

**近些年关于模块化/可拓展性的趋势是 语言无关, 低代码, DSL .  这里有两个技术路线:**

### Internal DSL

> 名词解释: 内部DSL是嵌入在宿主语言中的领域特定语言。它利用宿主语言的语法、语义和库来创建一个特殊的语法，供特定领域的任务使用。

projectdiscovery的nuclei, 最初通过基于yaml的DSL( Domain Specific Language 特定领域语言), 实现poc的规范化. 在新的大版本nuclei v3更是提供了`Internal DSL` 嵌入了python, javascript作为GPL(General-Purpose Language 一般用途语言). 

> 顺便一提, nuclei到v3, 评价有些开始两级分化了. nuclei朝着通用扫描器(类似AWVS)前进, 但是最开始使用nuclei的用户看重的是其轻量化, 稳定, 可控, 可拓展. 过度的功能膨胀不止带来了非常多的bug(nuclei非常多的poc已经无法正常运行), 也带来了体积上升, 性能下降, debug困难等问题. 
> 曾经为了满足gogo在windows xp中使用, 编写的轻量nuclei-templates引擎 [nuetron](https://github.com/chainreactors/neutron) 现在兼容了nuclei v2.* 90%以上的功能, 并且不会带来大量依赖, 不会破坏原有的兼容性, 可以在任意代码中快速嵌入并解析运行 nuclei的templates-yaml.

IDSL的优点非常多, 适合AI生成, 使用简单, 上手门槛低. 而缺点也显而易见, IDSL通常只能满足较小的特定领域, 例如描述一个漏洞的POC如何实现, 但是对于更加通用的场景会显得捉襟见肘, 处处限制.

例如nuclei尝试支持通用漏洞(例如SQL注入, XSS), 曾经叫 [fuzzing-templates](https://github.com/projectdiscovery/fuzzing-templates), 现在是[templates仓库下的dast](https://github.com/projectdiscovery/nuclei-templates/tree/main/dast) .

直到现在也只是小猫三两只, 原因就在于IDSL的表现力是不如EDSL更不如GPL的, 如果通过内嵌的python,javascript实现, 又会失去DSL的原本的优势. 

![](assets/image_20240823164515.png)


### External DSL

> 名词解释: 外部DSL是一种独立的领域特定语言，它有自己的语法和语义，通常需要一个专门的解析器或编译器来处理

这个技术路线在安全领域的例子就是近两年火热的 yaklang 以及对应的yakit.  yakit早期应该是基于golang的动态解释器实现的(我不是特别了解, 欢迎纠正), 现在则是运行在自己实现的虚拟机上, 逐渐朝着GPL发展. 

yaklang从最初的兼容golang的生态, 到现在能将不同语言/DSL编译到自己的VM上以兼容网络安全领域五花八门的生态. 他们的技术路线几乎是网络安全领域实现DSL的最佳实践.

### 语言无关的拓展性

IoM在最初的设计上想兼容sliver的armory(这个相对简单,已经实现), 以及cobaltstrike的`agressor_script`, 并在此基础上提供自己的插件生态规范, 提供语言无关的插件规范.

简单来说, 就是支持lua, tcl, python, java甚至是yaklang, nuclei-templates等等任意语言/DSL进行拓展.
(当然我们不打算也没有资源实现一套类似yaklang的VM, 通过在rpc上的规范实现多语言SDK)

## 实现

目前的IoM的通讯架构

* client<->server 交互通过grpc实现
* server与listener则通过统一的数据包协议`Spite`(protobuf的message)交互. 
* listener与malefic(malefic只是implant的一个具体实现)通讯复用了`Spite` message.

拆分一下,一点一点实现, 主要在这四个地方进行拓展

* Client端插件脚本语言
* Server端rpc SDK
* Listener的自定义Parser
* Implant端的module

在用户侧看来, 最终使用体验回合CS的agressor_script相似

### Client端---插件

与CobaltStrike的agressor_script类似, 不论是Server的rpc, Listener的Parser, Implant的module, 都需要最终暴露在插件开发者手中. 

agressor_script 是基于sleep语言实现, sleep较强依赖于java. 并且也较为小众, 要不是CS估计很少有人了解它. IoM暂时不想背上已有的包袱, 先放开手脚大胆设计, 所以对agressor_script兼容的优先级在实现我们自己插件生态之后. 

IoM选择了lua与TCL作为第一阶段准备兼容的嵌入式脚本语言, lua/TCL脚本与`mal manifest`组成IoM插件包的单元, 在client端提供`mal`插件的.

只需要将所有的rpc包装为buildin函数, 注册到lua/TCL中, 然后提供一个包管理器, 用来管理加载顺序与依赖关系. 很简单就能实现一个自定义的脚本语言. 

但要和client的tui以及未来可能出现的gui交互, 还需要多做一步. 刚才是将rpc注册到lua/TCL中, 现在需要将用户脚本的指定规则的函数反向注册到client的命令, 或者gui的组件. 

最终效果就类似CS的`agressor_script`的表达力. 

当然, 这里面还有很多细节. 例如数据传输格式, 参数传输格式等 需要根据对应的脚本语言适配. 

### Server端---SDK

之前提到过, server与client的交互全都通过grpc提供的rpc. 这个rpc可以提供给client用, 也可以通过protobuf的对应语言插件, 生成grpc支持的所有语言(python,go,java,rust,javascript...)简易SDK. 

自动生成的SDK只包含了数据定义与rpc传入返回值. 要真正做到能让脚本便捷操控还需要一些改动. 
例如, client原本支持加载插件, 但是SDK中如何实现这个功能? 

CS中CNA插件可以在Client添加, 也可以在Server添加. 我们只需要照抄这个架构即可. 提供一种特殊的client类型, 在server启动时自动接入, 并加载插件. 然后提供一组新的rpc用来管理与调用插件. 

这样我们的语言无关的拓展性就初见雏形了.  在client中实际上是golang提供的buildin rpc层, 注册到不同的脚本语言中, 后续还将对接CS的CNA脚本.  在server中则通过grpc实现了多语言SDK.

但我们的可拓展化之旅不止如此. 

### Listener端---Parser

如果阅读过我们的设计的文档或者蓝图, 应该知道IoM一直将webshell列在计划中. 那IoM计划如何实现webshell呢?

实际上就是在Listener中做文章. 假设IoM尝试兼容冰蝎, 那么实际上就是需要一个冰蝎的动态数据生成器和解释器. 对于默认的implant(malefic)也是一样, 通过protobuf, 将message序列化成bytes, 将bytes解析为message. 

这里就可以将其变成抽象接口:

* parser 负责解析回传数据
* generator 将spite转为目标能理解的数据

我们还可以做得更多, 这个功能也是为了第三方C2留的. 

如果有大佬自己实现了一个C2, 但是出于工作量与时间的关系, cli/gui写得非常粗糙怎么办?

很简单, 可以完全不碰implant ,只需要在listener中添加一个parser与generator. 即可让IoM的server/listener/client三端的生态迁移到自定义C2中.

当然要实现无缝迁移还是需要一些基本的工作的. 例如支持Bof相关功能得implant原本就有对Bof的支持. 

### Implant端---Module

这是这个大饼中唯一已经实现的部分. 

详情可见: https://chainreactors.github.io/wiki/IoM/manual/implant/#dynamic-module

这是一个非常现代化的设计, 不需要的功能就不要打包进来, 不存在就无从查杀. 只在需要时加载需要的功能, 能在体积, 特征上做到最小化. 

这里的具体实现方案很多, 例如Havoc, 它是通过大量的BoF将大量基础功能转为插件, Sliver则是通过[自定义格式的extension](https://dominicbreuker.com/post/learning_sliver_c2_12_extensions/)实现了dll+bof.

而IoM中选择了更加opsec的方式, 通过headlessPE的方式, 动态加载模块, 就像正常加载DLL一样, 将按照接口规范编写的模块热加载进来. 甚至这个功能本身也是可以拆卸掉的, 可以选择只保留上传,下载和exec的mini implant, 甚至只保留loader implant的nano implant.

## 小结

在IoM中, client/server/listener/implant 四端几乎是完全解耦的, 可以在任意一端插入用户自己编写的实现. 而不影响到其他组件的工作, 我们通过约定统一的规范来兼容尽可能多的生态与社区. 

在本文发布的同时, 也会尝试邀请一些开发者与IoM进行对接, 共同建设.







