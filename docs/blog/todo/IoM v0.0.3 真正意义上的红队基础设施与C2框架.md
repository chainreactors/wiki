
## 时间线

在8月份, 我们发布了IoM的蓝图和demo, 制定了一个宏伟的计划, 当时的IoM和绝大多数开源C2一样, 充满bug, 功能简单. 

在9月份, 我们发布了修复了大量bug, 以及对client/server/listener的大重构 v0.0.2版本. 还添加了基于lua的插件系统, 半自动化编译.

而现在, 我们终于可以发布v0.0.3 ,也意味着IoM已经具备在实战中使用的价值, 以及满足绝大数实战场景的能力. 在某些OPSEC或者拓展能力上, IoM更是目前最强大的C2框架. 

v0.0.3 的IoM至少已经具备了80%以上的Cobaltstrike的能力, 90%的Sliver的能力, 比起nighthawk和BRC4更是不遑多让，并且有非常多独有的功能.  当然在成熟程度与很多细节上我们缺少时间去打磨, 但可用的版本也称得上是开源世界中最强大的C2之一了.


## 更新日志
### implant重构
v0.0.3 最大的改动就是彻底重构了implant, 现在的implant是一个覆盖了几乎所有场景的框架, 你可以在里面找到C2开发的几乎一切相关技术. 

这次重构涉及到的改动过于庞大, 无法在更新日志中一次性展示, 后续会通过一系列文章介绍IoM的方方面面. 

#### 架构
项目链接: https://github.com/chainreactors/malefic
如果对本文提到的概念感到迷惑, 可以在这里了解前置知识: https://chainreactors.github.io/wiki/IoM/concept/
**主体结构:**
- malefic 主程序, 包含了beacon/bind两种模式的完整功能
- **malefic-mutant (新增)** 用来实现自动化配置malefic的各种条件编译与特性, 以及生成shellcode, SRDI等
- **malefic-prelude (新增)**, 多段上线的中间阶段, 可以在这里按需配置权限维持, 反沙箱, 反调试等功能. 
- **malefic-pulse (新增)** , shellcode模板生成器, 能生成只有5KB左右的shellcode, 类似cobalstrike artifact, 能轻松实现自定义shellcode特征

malefic, prelude, pulse 实际上是三个不同思路的implant实现, 都依赖malefic-win-kit提供的基础能力, 实现EDR对抗. 通过malefic提供的各种基础库, **我们可以实现定制任意场景的implant.** 

**基础库:**
- malefic-modules, 各种模块的具体实现, v0.0.3新添加了近30个原生模块, 覆盖service, registry, taskscheduer, token, wmi等常用功能, 目前malefic已经有
- **malefic-core (重构)**, 核心库, 实现beacon/bind与modules的交互与调度, 可以通过core快速实现各种不同模板不同需求的implant.
- **malefic-proto (重构)**, 加密与协议库, 定义了implant与server数据交互的协议与加密方式等
- **malefic-helper (重构)**, 辅助函数库, 也是对接malefic-kits的中间库, kits中的api将会通过FFI在helper中二次包装, 实现对kit中各种功能的调用
**kits**(二进制开源):
- malefic-win-kit, 实现了loadpe, UDRL, CLR, 堆栈混淆等等高级特性的OPSEC实现
#### 彻底重构
本次重构是为了后续开放的可拓展架构奠定基础, 我们进一步理清了依赖关系也项目结构. 

现在的malefic-helper将只提供基本功能与对接kits, 不再与malefic强耦合. 也就是说, 如果要重写一个全新的implant, malefic-helper与kits将能提供全方位的帮助, 因为我们维护了一个目前rust生态中最稳定的底层基座. 实现了load PE, CRL loader, Process Hollowing, 堆栈混淆等等等等功能的Red Team 原语. 
**可以轻松在IoM的基础上实现复杂功能的implant, 而不用过度关心底层实现**,  也不需要使用我们的Server与Client, 你可以任意的揉搓你的implant, 使其支持CobaltStrike,  支持Sliver, 使用接受度最高的CS的GUI作为你的操作界面.

更可以通过malefic-core与malefic-proto实现一个支持IoM的Server与Client的implant. 事实上, 我们pulse, prelude, 还有malefic本体相当于时IoM implant的三种实现. IoM的架构欢迎任何程度上使用到IoM的人, 如果你计划写自己的一个C2, 尝试一下IoM的基础设施一定是个非常不错的选择. 

我们不仅仅在malefic的本体上实现了模块化自定义, 更在软件架构上实现了一个大的突破, 离IoM的红队基础设施的开放架构迈进了一大步.


在对malefic添加了大量功能的同时,  我们也对依赖进行了重整. 确定了一个较为统一的风格.

malefic将 pure rust作为原则之一, 在不得不使用外部依赖时, 尽可能使用更为rust的库. 例如, 从ring切换到rustcrypto. 将ntapi, winapi,windows-sys 库切换到windows库等等.

这个工程还在继续. 在下个版本, 我们将进一步剔除第三方库, 例如wmi, netstat2, sysinfo等库, 所有的使用了系统调用的功能, 都将通过win-kit封装的实现了 RashoGate(相当于CS的BeaconGate)的syscall实现.

#### prelude
prelude在设计中是beacon上线前进行权限维持, 反沙箱, 反调试等功能的中间阶段. 

本质上是一个单线程无网络连接的beacon, prelude会按次序执行预先配置好的modules, 全部通过后唤再唤起beacon.

我们提供了基于yaml的自动化生成器, 能通过yaml快速生成不同场景下的prelude的二进制文件.

yaml示例:

```yaml
-  
  name: bof  
  body: !ExecuteBinary  
    name: service  
    bin: !File "addservice.o"
-
  name: exe
  body: !ExecRequest
    args:
      - net
      - user
      - add
      - ....
  
```

这个yaml能被自动打包编译成二进制文件. 
```
malefic-mutant generate prelude autorun.yaml

cargo build -p malefic-prelude
```
#### pulse

我们通过汇编+rust, 实现了windows x86/x64 架构的shellcode模板, 能生成最小4kb的可执行文件, 并能轻易转为shellcode. 

这段shellcode将在提权/横向/初始访问等等过程中被大量使用.  

pulse 通过 rust 内联汇编+rust的features控制, 实现了一个可控可组装的shellcode factory , 用以实现高度定制化的shellcode generator

Cobaltstrike提供了一些kit, 其中就有artifact kit, 能控制stager的生成, 并在其中进行一定程度的EDR对抗. 

后续IoM还会基于现在pulse的基础上提供一套类似的工具, 能调用我们封装过的syscall, inject, cryptor等流程, 快速实现一个shellcode 加载器. 
#### mutant
刚才提到了implant中多个新的组件, 为了管理这些组件, 以及实现自动化/半自动化编译, 我们将原先的malefic-config重构为malefic-mutant. 

malefic-mutant的定位类似msf中的venom, 可以进行rust代码生成, features配置, shellcode生成,SRDI等等用途.  并且可以脱离rust源码, 编译成二进制文件单独使用. 

未来, 还会mutant还会支持更多用途, 变成IoM的核心组件之一. 

#### 多阶段加载
在现代化的攻防场景中, 多阶段加载器是多个APT组织的常用手法. 可以给分析人员带来不少的困难. 

IoM中实现了一整套极高自由度的多阶段加载方式.

首先, IoM的工具链可以生成非常多不同用途的二进制文件

- loader (stage0) 用来加载shellcode, 这部分一般是用户实现, 可以使用任意的shellocde加载器代替. 在当前版本中可以使用pulse(pulse默认模板不提供免杀)作为临时代替
- prelude (stage1), 中间阶段加载器, 用来反沙箱, 反调试, 权限维持等等功能, 是最小化的本体
- beacon/bind (stage2), 回连与监听模式的主体程序, 到这阶段才会开始与server交互
- modules (stage3), 可以通过config编译一个不带任何功能的beacon, 然后单独编译modules, 将所需要的功能通过load_module 命令动态加载

到这一步. 应该能发现IoM, 可以按需实现任意场景的最小化加载, 并且在不同阶段之间, 通过流量混淆, 加密, 分离等等手段将整个上线过程变成一个极长的战线.

可以在使用loader 加载 prelude, 再通过prelude 加载 beacon, 最后通过load_module 分批按需加载所需的功能. 

也可以像Cobaltstrike的stageless一样实现一步到位的本体上线. 

不同阶段之间可以任意组合, 例如从stage0-stage3, 也可以stage1-stage3.

**这个架构不仅对杀软/EDR有很好的抗性, 对抗人工分析也有非常大的优势.**

#### bind 模式(Unstable)

在当前实际对抗中, 受到网络环境的限制, 很少有人使用bind类型的webshell.  但在一些极端场景下, 例如不出网的webshell中, 又或者长时间流量静默的场景下. bind也许有用武之地. 

在重构malefic的过程中, 也为了进一步解耦, 实现了一个demo版本的bind模式的implant.

bind模式同样不建立长连接, 如果下发了任务, 需要通过轮询获取任务的返回值. 因为为经过充分测试, 我们也暂时没有为其添加文档.  有特殊需求的用户可以自行尝试.

#### 其他implant更新

这些更新并非不重要, 很多内容都足够单独写一篇文章. 受限于篇幅, 本文详细介绍的内容只涉及到架构层面, 在v0.0.3后, 将会通过一系列文章介绍IoM目前的能力.

* 提供了内置的SRDI
* 支持堆栈混淆
* execute-assembly 支持自动patch exit
* execute-assembly 支持wldp bypass
* execute-assembly 修复执行完没有
* 提供了基于aes, xor, chacha20的流量加密
* 自动compress spite, 减少流量体积
* 允许通过feature控制初始化时自动信息收集与hot_load 功能
* 修复了大量modules bug, 涉及到近十个不同的module, *很抱歉之前的版本中出现了这么多bug*
* 兼容rust 1.74 编译
* 修复linux implant 编译报错, https://github.com/chainreactors/malefic/issues/8
* 新模块
	* token操作相关
	* 计划任务相关
	* 注册表相关
	* 服务相关
	* WMI query 与execute
	* 命名管道相关
	* 新的internal module, 包括 init, suicide, ping, sleep
* 解耦网络相关操作, 能通过简单修改支持新的协议, 作为在rem上线前的临时代替
* 支持自定义resources文件, 可以实现替换图标, PE元数据, 进程名等等
* addons相关内容实现了自动加解密
* ......

v0.0.3实现的新功能比我们roadmap计划中的多得多. 相信现在的malefic已经是功能最强大的开源implant, 并且可以很自信的说**没有之一**. 

### Server
#### 自动化编译
IoM目前接收到的最多的反馈就是编译复杂, 编译出现错误, 编译环境难配置. 

v0.0.2中,我们实现了基于docker与github action的半自动化编译吗, 而在v0.0.3着力解决全自动化编译. 

现在IoM可以通过client上的build命令组实现profile管理, 自动化build, shellcode生成等等功能. 

![](assets/Pasted%20image%2020241106192953.png)

受限于开发时间, 我们还没能实现100%细粒度的自动化编译, 所以对于专业用户来说, 更推荐手动进行编译控制, 可以享受到最大程度的定制特性.

#### 自定义parser (Unstable)

在新的server中, 我们将parser从中解耦出来. 因为IoM的计划是成为开放的基础设施, 我们不想绑死我们的通讯协议.  并且也在计划支持不同的第三方C2.
在v0.0.3中, 我们实现了第一步, 将协议解析与listener中的pipeline解耦. 可以在pipeline中配置不同的parser以实现不同的C2协议. 当然目前仅支持了malefic相关协议. 

```yaml
listeners:  
  name: listener  
  auth: listener.auth  
  enable: true  
  tcp:  
    - name: tcp_default  
	  enable: true
      port: 5001  
      host: 0.0.0.0  
      protocol: tcp  
      parser: malefic  
```

在代码中, 只需要实现这四个接口, 即可实现一个新的parser.

```
type PacketParser interface {  
    PeekHeader(conn *peek.Conn) (uint32, uint32, error)  
    ReadHeader(conn *peek.Conn) (uint32, uint32, error)  
    Parse([]byte) (*implantpb.Spites, error)  
    Marshal(*implantpb.Spites, uint32) ([]byte, error)  
}
```
### Client

在早期计划中, 我们还试图实现sleep语言的插件, 但在实现过程中, 发现cobaltstrike与sleep过度耦合, 很难在脱离Cobaltstrike的情况下支持sleep语言, 迫不得已转换了思路, 我们在lua中实现了一组Cobaltstrike的aggressive script风格 
#### lua插件

在v0.0.2中, IoM 尝试使用lua实现了一套类似Cobaltstrike的Aggressive Script的插件语言.  并实现了三种API风格的内置函数.  分别为Cobaltstrike风格, IoM风格以及grcp风格. 实际上是同一个grpc的三种不同包装.

在v0.0.3 我们再次重构了lua插件脚本, 提供了丰富的api, 完善了lua的定义文档与说明文档. 

现在的lua插件有140个builtin函数, 以及全部的grpc都注册到了lua中, 一共200个不同用途的函数, 可以通过lua脚本实现对IoM每个操作的完全控制. 

与CS的cobaltstrike不同的是, IoM还提供了作为库的插件. 例如我们实现了No-Consolation, 只需要在mal的配置中, 将lib设置为true, 将允许将这个模块作为lib给其他插件包使用. 

#### 插件仓库

在IoM的计划中, 包含了community-driver的插件管理系统, 并提供了初始的插件包.

插件包索引: https://github.com/chainreactors/mals

默认插件包: https://github.com/chainreactors/mal-community

我们将一些cobaltstrike中被使用的较多的插件包进行了迁移, 使用IoM的lua插件系统重写, 也对IoM的插件系统进行了能力验证, 结果证明, IoM的插件系统已经可以实现绝大多数Aggressive Script的功能, 并且拥有更大的自由度和更丰富的lua库的支持.

目前已经迁移了非常多工具包:
* lib
	* noconsolation, https://github.com/fortra/No-Consolation
	* SharpBlock, https://github.com/CCob/SharpBlock
* common (基础工具)
	* operatorskit, https://github.com/REDMED-X/OperatorsKit
	* remoteopsbof, https://github.com/trustedsec/CS-Remote-OPs-BOF
	* situationalbof, https://github.com/trustedsec/CS-Situational-Awareness-BOF
	* chainreactor, gogo/zombie/spray等chainreactor的工具
* elevate (提权)
	* elevatekit, https://github.com/rsmudge/ElevateKit
	* uac, https://github.com/icyguider/UAC-BOF-Bonanza
	* postkit, [链接](https://mp.weixin.qq.com/s?src=11&timestamp=1731323099&ver=5622&signature=Z0oiEsI0oaTrfkWMz*KlZc8JHU5dXKla*2Nn9MKT*aBb7012oQvjQnzFsXeDmpCueBKd4-4mDNx-uiAv4c1Xnz0AqdNEbS*Ss1ZHSjTc5aF1ttwZUO*bIVIN0c1B3-LG&new=1)
* move (横向移动)
	* movekit, https://github.com/0xthirteen/MoveKit
* persistence (权限维持)
	* staykit, https://github.com/0xthirteen/StayKit
* proxy (网络/代理)
	* gost, https://github.com/go-gost/gost
* domain(域渗透) TODO

我们将我们提供的插件包分为了这五个大类, 并在这个框架中填充更多的内容. 

插件仓库的第一阶段的工程迁移了最常用最好用的公开的工具包, 这些工具大多都是在Cobaltstrike框架中设计的, 下一阶段, 我们会添加一些更opsec的专为IoM特性设计的插件. 
#### golang 插件 (Unstable)
client目前还通过yaegi(一个支持golang语法的脚本语言)实现了基于golang的动态插件. 是除了lua之外的另一个选择. 

目前基于yaegi实现的golang插件系统还未经过充分使用, 只进行了基本的测试. 暂时不推荐使用golang编写IoM的插件.

#### events (Unstable)

在cobaltstrike的Aggressive Script中有一个事件通知与回调机制. 
https://hstechdocs.helpsystems.com/manuals/cobaltstrike/current/userguide/content/topics_aggressor-scripts/as-resources_events.htm

在实现lua插件时, 我们也参考这套机制实现了一个类似的回调机制。

并且注册了与CobaltStrike中类似的api. 当然在lua中语法会有些区别

```lua
function on_beacon_initial(event)

    print("beacon init")

end
```


### OPSEC模型 (Unstable)

在实现上面这些内容后, 我们有了新的想法,  我们想基于ATT&CK的威胁建模以及CVSS的评分模型的思路上设计一套红队视角的OPSEC评分模型.

通过四个维度的评判， 参考CVSS的分级标准。

**评分越高越安全** , 具体评分为：

* 低(0-3.9)操作极其容易被检测, 明显痕迹, 造成恶性(失去立足点, 系统崩溃等)后果
* 中(4.0-6.9) 操作可能被检测,痕迹可控, 后果可控
* 高(7.0-8.9) 操作基本不可能不检测, 痕迹较小或无痕迹, 被检测也不会有明显后果
* OPSEC(9.0-10)分, 这个级别的操作被称为OPSEC. 几乎不可能被检测, 没有痕迹, 不会造成后果.
 
 **暴露度**
被EDR/NDR或任意设备检测到的暴露程度
- 是否有新进程创建
- 是否有新文件创建
- 是否有新网络连接创建
- 是否需要调用系统api
- ...

**痕迹**
被追踪还原操作痕迹的成功率
* 是否可以删除相关操作日志
* 是否可以删除相关文件
* ...

**检测可能性**
- 现有检测机制是否有可能追踪
- 在操作系统内部是否有可能被追踪
- 实现相关检测手段复杂性
- ...

**后果**
- 操作失败可能带来的后果
- 是否影响长期潜伏
- 是否影响驻留时间
- ...

第一阶段, 我们会将内置的模块对应到这个评分模型, 然后尝试将插件包与OPSEC模型管理. 

最终通过OPSEC模型与ATT&CK攻击矩阵还原整个攻击模拟的流程.  

这个模型现在还很简陋, 我们将在实战中不断调整. 

### 其他更新

#### 修复大量implant恶性bug

除了这些功能性更新, 还修复了极为大量的bug, 我们发现了在bof, CLR, execute_dll等等模块会导致panic或者无法正确工作的bug. 这些bug在使用任何一款rust编写的C2中都会遇到. 可以说目前bug百出的IoM已经对各种模块兼容性和稳定性最好的rustC2了. 

修复各种各样的bug耗费了极为大量的精力, 才使得大部分模块能在绝大多数环境中运行. 要达到Cobaltstrike的稳定性还需要一些时间, 但可以肯定是, 我们是在Offensive Security这个领域中, 使用rust走得最远的团队之一了. 
#### 修复client TUI大量bug
目前client使用的repl(交互式命令行)库与sliver相同, 这个库的bug在sliver中也有非常多的人吐槽. 更关键的是, windows terminal也会给client带来bug. 

可以在这里看到已知bug合集, https://github.com/chainreactors/malice-network/issues/16 , 这些bug每一个都极为影响用户体验, 也因此有不少人建议不要在windows系统中使用sliver. 都源于这些client的恶性bug.

在反馈库作者没有得到解决的情况下, 我们又花费了大量精力去修复这些sliver也无法解决的bug. 最终, 除了windows terminal导致的bug, 我们修复了其他所有的已知问题.

#### Other

* 重构了client的表格, 使用多行表格代替老的表格
* 修复了多个cli换行导致的显示问题
* 支持了BOF更多的输出格式
* 优化了login逻辑, 并支持了自动重连到server
* 修复了sliver armory的一些bug, 重新支持了extension
* 优化sliver armory的索引方式
* 重构website与pipeline相关组件
* 重构server db相关代码, 实现依赖关系反转
* 添加donut与sliver SRDI rpc与lua api, 后续还会暴露到client的cmd中
* 优化`!` 命令, 现在能从PATH中寻找程序
* 实装了encryption与tls相关参数
* 修复lua相关大量bug
* ......

#### 未解决的问题

在v0.0.3中还有一些遗憾. 

1. 因为rust的MSVC target对TLS的特殊优化, 导致使用MSVC编译的二进制文件无法被SRDI转为shellcode. 
2. 使用windows GNU target 编译的产物暂时无法在win7上运行

我们已经有了一些眉目去解决这两个问题, 但是在这个版本来不及实现. 如果遇到了这两个bug, 欢迎提供issue, 我们会尽可能提供代替方案. 

## 未来路线

现在的IoM不论是在功能覆盖面; 还是OPSEC; 还是可拓展性上都已经超过了任意一款开源C2. 

而要真正意思上堪比Cobaltstrike的红队基础设施, 要走的路还很长. 

最大的问题就是功能拓展过于迅速, 导致的bug/用户体验问题. IoM极其缺少实战的打磨, 我们欢迎在实战中使用IoM, 并计划免费为合法用途的红蓝对抗/HW的使用者提供技术解释与技术支持.

下一阶段的工作重点将是GUI与文档. 

在具体功能上, 我们通过三个版本的快速迭代, 已经实现了最初计划的至少80%, 我们将在IoM的横向与纵向继续拓展能力, 将设计蓝图中的LLVM obfuscator, rem代理工具, linux-kit, mac-kit等逐一实现. 

向着成为**开放的红队基础设施**的目标迈进.

详细的路线图可参阅: https://chainreactors.github.io/wiki/IoM/roadmap/ 


**本次更新内容多到没办法通过一个更新日志进行描述, 后续还会有一系列文档对IoM的方方面面进行系统介绍.** 

## End

我们计划给有**红队蓝军建设计**划的企业提供系统化的基础设施与技术支撑.

欢迎有类似需求的朋友与我们联系. 我们是一个开放的基础设施. **就算没有计划支持我们的产品, 我们也会为任何关注IoM的使用者提供一定程度的支持.** 

