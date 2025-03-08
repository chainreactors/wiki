---
date:
  created: 2024-11-20
slug: IoM_v0.0.3
---

## 时间线

在 8 月份, 我们发布了 IoM 的蓝图和 demo, 制定了一个宏伟的计划, 当时的 IoM 和绝大多数开源 C2 一样, 充满 bug, 功能简单.

在 9 月份, 我们发布了修复了大量 bug, 以及对 client/server/listener 的大重构 v0.0.2 版本. 还添加了基于 lua 的插件系统, 半自动化编译.

而现在, 我们终于可以发布 v0.0.3 ,这也意味着 IoM 已经具备在实战中使用的价值, 以及满足绝大多数实战场景的能力. 在某些 OPSEC 或者拓展能力上, IoM 更是目前最强大的 C2 框架.

v0.0.3 的 IoM 至少已经具备了 80%以上的 Cobaltstrike 的能力, 90%的 Sliver 的能力, 比起 Nighthawk 和 BRC4 更是不遑多让，并且有非常多独有的功能. 当然在成熟程度与很多细节上我们缺少时间去打磨, 但可用的版本也称得上是开源世界中最强大的 C2 之一了.

<!-- more -->

## 更新日志

### implant 重构

v0.0.3 最大的改动就是彻底重构了 implant, 现在的 implant 是一个覆盖了几乎所有场景的框架, 你可以在里面找到 C2 开发的几乎一切相关技术.

这次重构涉及到的改动过于庞大, 无法在更新日志中一次性展示, 后续会通过一系列文章介绍 IoM 的方方面面.

#### 架构

项目链接: https://github.com/chainreactors/malefic
如果对本文提到的概念感到迷惑, 可以在这里了解前置知识: https://chainreactors.github.io/wiki/IoM/concept/
**主体结构:**

- malefic 主程序, 包含了 beacon/bind 两种模式的完整功能
- **malefic-mutant (新增)** 用来实现自动化配置 malefic 的各种条件编译与特性, 以及生成 shellcode, SRDI 等
- **malefic-prelude (新增)**, 多段上线的中间阶段, 可以在这里按需配置权限维持, 反沙箱, 反调试等功能.
- **malefic-pulse (新增)** , shellcode 模板生成器, 能生成只有 5KB 左右的 shellcode, 类似 cobalstrike artifact, 能轻松实现自定义 shellcode 特征

malefic, prelude, pulse 实际上是三个不同思路的 implant 实现, 都依赖 malefic-win-kit 提供的基础能力, 实现 EDR 对抗. 通过 malefic 提供的各种基础库, **我们可以实现定制任意场景的 implant.**

**基础库:**

- malefic-modules, 各种模块的具体实现, v0.0.3 新添加了近 30 个原生模块, 覆盖 service, registry, taskscheduer, token, wmi 等常用功能, 目前 malefic 已经有
- **malefic-core (重构)**, 核心库, 实现 beacon/bind 与 modules 的交互与调度, 可以通过 core 快速实现各种不同模板不同需求的 implant.
- **malefic-proto (重构)**, 加密与协议库, 定义了 implant 与 server 数据交互的协议与加密方式等
- **malefic-helper (重构)**, 辅助函数库, 也是对接 malefic-kits 的中间库, kits 中的 api 将会通过 FFI 在 helper 中二次包装, 实现对 kit 中各种功能的调用
  **kits**(二进制开源):
- malefic-win-kit, 实现了 loadpe, UDRL, CLR, 堆栈混淆等等高级特性的 OPSEC 实现

#### 彻底重构

本次重构是为了后续开放的可拓展架构奠定基础, 我们进一步理清了依赖关系也项目结构.

现在的 malefic-helper 只提供基本功能与对接 kits 的 api, 不再与 malefic 强耦合. 意味着, 如果要实现一个新的 implant，可以使用 malefic-helper 与 kits 提供的全方位的帮助。

IoM 维护了一个目前 rust 生态中最稳定的底层基座. 实现了 load PE, CRL loader, Process Hollowing, 堆栈混淆等等等等功能的 Red Team 原语.

**可以轻松在 IoM 的基础上实现复杂功能的 implant, 而不用过度关心底层实现**, 甚至不需要使用我们的 Server 与 Client, 可以任意的揉搓你的 implant, 实现一个不在 IoM 环境中运行的 implant.

当然也可以基于 malefic-core 与 malefic-proto 实现一个支持 IoM 的 Server 与 Client 的 implant. 这两个 crate 中实现了与 server 通讯调度相关的代码.

目前, 我们 pulse, prelude 以及 malefic 本体 实际上是 IoM implant 的三种实现.

我们不仅仅在 malefic 的本体上实现了模块化自定义, 更在软件架构上实现了一个大的突破, 离 IoM 的红队基础设施的开放架构迈进了一大步.

IoM 的架构欢迎任何程度上使用到 IoM 的人, 如果你计划写自己的一个 C2, 尝试一下 IoM 的基础设施一定是个非常不错的选择.

在对 malefic 添加了大量功能的同时, 我们也对依赖进行了重整. 确定了一个较为统一的风格.

malefic 将 pure rust 作为原则之一, 在不得不使用外部依赖时, 尽可能使用更为 rust 的库. 例如, 从 ring 切换到 rustcrypto. 将 ntapi, winapi,windows-sys 库切换到 windows 库等等.

这个工程还在继续. 在下个版本, 我们将进一步剔除第三方库, 例如 wmi, netstat2, sysinfo 等库, 所有的使用了系统调用的功能, 都将通过 win-kit 封装的实现了 RashoGate(相当于 CS 的 BeaconGate)的 syscall 实现.

#### prelude

prelude 在设计中是 beacon 上线前进行权限维持, 反沙箱, 反调试等功能的中间阶段.

本质上是一个单线程无网络连接的 beacon, prelude 会按次序执行预先配置好的 modules, 全部通过后唤再唤起 beacon.

我们提供了基于 yaml 的自动化生成器, 能通过 yaml 快速生成不同场景下的 prelude 的二进制文件.

yaml 示例:

```yaml
- name: bof
  body: !ExecuteBinary
    name: service
    bin: !File "addservice.o"
- name: exe
  body: !ExecRequest
    args:
      - net
      - user
      - add
      - ....
```

这个 yaml 能被自动打包编译成二进制文件.

```
malefic-mutant generate prelude autorun.yaml

cargo build -p malefic-prelude
```

#### pulse

我们通过汇编+rust, 实现了 windows x86/x64 架构的 shellcode 模板, 能生成最小 4kb 的可执行文件, 并能轻易转为 shellcode.

这段 shellcode 将在提权/横向/初始访问等等过程中被大量使用.

pulse 通过 rust 内联汇编+rust 的 features 控制, 实现了一个可控可组装的 shellcode factory , 用以实现高度定制化的 shellcode generator

Cobaltstrike 提供了一些 kit, 其中就有 artifact kit, 能控制 stager 的生成, 并在其中进行一定程度的 EDR 对抗.

后续 IoM 还会基于现在 pulse 的基础上提供一套类似的工具, 能调用我们封装过的 syscall, inject, cryptor 等流程, 快速实现一个 shellcode 加载器.

#### mutant

刚才提到了 implant 中多个新的组件, 为了管理这些组件, 以及实现自动化/半自动化编译, 我们将原先的 malefic-config 重构为 malefic-mutant.

malefic-mutant 的定位类似 msf 中的 venom, 可以进行 rust 代码生成, features 配置, shellcode 生成,SRDI 等等用途. 并且可以脱离 rust 源码, 编译成二进制文件单独使用.

未来, 还会 mutant 还会支持更多用途, 变成 IoM 的核心组件之一.

#### 多阶段加载

在现代化的攻防场景中, 多阶段加载器是多个 APT 组织的常用手法. 可以给分析人员带来不少的困难.

IoM 中实现了一整套极高自由度的多阶段加载方式.

首先, IoM 的工具链可以生成非常多不同用途的二进制文件

- loader (stage0) 用来加载 shellcode, 这部分一般是用户实现, 可以使用任意的 shellocde 加载器代替. 在当前版本中可以使用 pulse(pulse 默认模板不提供免杀)作为临时代替
- prelude (stage1), 中间阶段加载器, 用来反沙箱, 反调试, 权限维持等等功能, 是最小化的本体
- beacon/bind (stage2), 回连与监听模式的主体程序, 到这阶段才会开始与 server 交互
- modules (stage3), 可以通过 config 编译一个不带任何功能的 beacon, 然后单独编译 modules, 将所需要的功能通过 load_module 命令动态加载

到这一步. 应该能发现 IoM, 可以按需实现任意场景的最小化加载, 并且在不同阶段之间, 通过流量混淆, 加密, 分离等等手段将整个上线过程变成一个极长的战线.

可以在使用 loader 加载 prelude, 再通过 prelude 加载 beacon, 最后通过 load_module 分批按需加载所需的功能.

也可以像 Cobaltstrike 的 stageless 一样实现一步到位的本体上线.

不同阶段之间可以任意组合, 例如从 stage0-stage3, 也可以 stage1-stage3.

**这个架构不仅对杀软/EDR 有很好的抗性, 对抗人工分析也有非常大的优势.**

#### bind 模式(Unstable)

在当前实际对抗中, 受到网络环境的限制, 很少有人使用 bind 类型的 webshell. 但在一些极端场景下, 例如不出网的 webshell 中, 又或者长时间流量静默的场景下. bind 也许有用武之地.

在重构 malefic 的过程中, 也为了进一步解耦, 实现了一个 demo 版本的 bind 模式的 implant.

bind 模式同样不建立长连接, 如果下发了任务, 需要通过轮询获取任务的返回值. 因为为经过充分测试, 我们也暂时没有为其添加文档. 有特殊需求的用户可自行尝试.

#### 其他 implant 更新

这些更新并非不重要, 很多内容都足够单独写一篇文章. 受限于篇幅, 本文详细介绍的内容只涉及到架构层面, 在 v0.0.3 后, 将会通过一系列文章介绍 IoM 目前的能力.

- 提供了内置的 SRDI
- 支持堆栈混淆
- execute-assembly 支持自动 patch exit
- execute-assembly 支持 wldp bypass
- execute-assembly 修复执行完成后没有正确退出的问题
- 提供了基于 AES、XOR、ChaCha20 的流量加密
- 自动 compress spite，减少流量体积
- 允许通过 feature 控制初始化时自动信息收集与 hot_load 功能
- 修复了大量 modules bug, 涉及到近十个不同的 module, _很抱歉之前的版本中出现了这么多 bug_
- 兼容 rust 1.74 编译
- 修复 linux implant 编译报错, https://github.com/chainreactors/malefic/issues/8
- 新模块
  - token 操作相关
  - 计划任务相关
  - 注册表相关
  - 服务相关
  - WMI query 与 execute
  - 命名管道相关
  - 新的 internal module, 包括 init, suicide, ping, sleep
- 解耦网络相关操作, 能通过简单修改支持新的协议, 作为在 rem 上线前的临时代替
- 支持自定义 resources 文件, 可以实现替换图标, PE 元数据, 进程名等等
- addons 相关内容实现了自动加解密
- ......

v0.0.3 实现的新功能比我们 roadmap 计划中的多得多. 相信现在的 malefic 已经是功能最强大的开源 implant, 并且可以很自信的说**没有之一**.

### Server

#### 自动化编译

IoM 目前接收到的最多的反馈就是编译复杂, 编译出现错误, 编译环境难配置.

v0.0.2 中,我们实现了基于 docker 与 github action 的半自动化编译, 而在 v0.0.3 着力解决全自动化编译.

现在 IoM 可以通过 client 上的 build 命令组实现 profile 管理, 自动化 build, shellcode 生成等等功能.

![](assets/Pasted%20image%2020241106192953.png)

受限于开发时间, 我们还没能实现 100%细粒度的自动化编译, 所以对于专业用户来说, 更推荐手动进行编译控制, 可以享受到最大程度的定制特性.

#### 自定义 parser (Unstable)

在新的 server 中, 我们将 parser 从中解耦出来. 因为 IoM 的计划是成为开放的基础设施, 我们不想绑死我们的通讯协议. 并且也在计划支持不同的第三方 C2.
在 v0.0.3 中, 我们实现了第一步, 将协议解析与 listener 中的 pipeline 解耦. 可以在 pipeline 中配置不同的 parser 以实现不同的 C2 协议. 当然目前仅支持了 malefic 相关协议.

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

在代码中, 只需要实现这四个接口, 即可实现一个新的 parser.

```
type PacketParser interface {
    PeekHeader(conn *peek.Conn) (uint32, uint32, error)
    ReadHeader(conn *peek.Conn) (uint32, uint32, error)
    Parse([]byte) (*implantpb.Spites, error)
    Marshal(*implantpb.Spites, uint32) ([]byte, error)
}
```

### Client

在早期计划中, 我们还试图实现 sleep 语言的插件, 但在实现过程中, 发现 cobaltstrike 与 sleep 过度耦合, 很难在脱离 Cobaltstrike 的情况下支持 sleep 语言, 迫不得已转换了思路, 我们在 lua 中实现了一组 Cobaltstrike 的 aggressive script 风格

#### lua 插件

在 v0.0.2 中, IoM 尝试使用 lua 实现了一套类似 Cobaltstrike 的 Aggressive Script 的插件语言. 并实现了三种 API 风格的内置函数. 分别为 Cobaltstrike 风格, IoM 风格以及 grcp 风格. 实际上是同一个 grpc 的三种不同包装.

在 v0.0.3 我们再次重构了 lua 插件脚本, 提供了丰富的 api, 完善了 lua 的定义文档与说明文档.

现在的 lua 插件有 140 个 builtin 函数, 以及全部的 grpc 都注册到了 lua 中, 一共 200 个不同用途的函数, 可以通过 lua 脚本实现对 IoM 每个操作的完全控制.

与 CS 的 cobaltstrike 不同的是, IoM 还提供了作为库的插件. 例如我们实现了 No-Consolation, 只需要在 mal 的配置中, 将 lib 设置为 true, 将允许将这个模块作为 lib 给其他插件包使用.

#### 插件仓库

在 IoM 的计划中, 包含了 community-driver 的插件管理系统, 并提供了初始的插件包.

插件包索引: https://github.com/chainreactors/mals

默认插件包: https://github.com/chainreactors/mal-community

我们将一些 cobaltstrike 中被使用的较多的插件包进行了迁移, 使用 IoM 的 lua 插件系统重写, 也对 IoM 的插件系统进行了能力验证, 结果证明, IoM 的插件系统已经可以实现绝大多数 Aggressive Script 的功能, 并且拥有更大的自由度和更丰富的 lua 库的支持.

目前已经迁移了非常多工具包:

- lib
  - noconsolation, https://github.com/fortra/No-Consolation
  - SharpBlock, https://github.com/CCob/SharpBlock
- common (基础工具)
  - operatorskit, https://github.com/REDMED-X/OperatorsKit
  - remoteopsbof, https://github.com/trustedsec/CS-Remote-OPs-BOF
  - situationalbof, https://github.com/trustedsec/CS-Situational-Awareness-BOF
  - chainreactor, gogo/zombie/spray 等 chainreactor 的工具
- elevate (提权)
- move (横向移动)
- persistence (权限维持)
- proxy (网络/代理)
- domain(域渗透)

我们将我们提供的插件包分为了这六个大类, 并在这个框架中填充更多的内容.

插件仓库的第一阶段的工程迁移了最常用最好用的公开的工具包, 这些工具大多都是在 Cobaltstrike 框架中设计的, 下一阶段, 我们会添加一些更 opsec 的专为 IoM 特性设计的插件.

#### golang 插件 (Unstable)

client 目前还通过 yaegi(一个支持 golang 语法的脚本语言)实现了基于 golang 的动态插件. 是除了 lua 之外的另一个选择.

目前基于 yaegi 实现的 golang 插件系统还未经过充分使用, 只进行了基本的测试. 暂时不推荐使用 golang 编写 IoM 的插件.

#### events (Unstable)

在 cobaltstrike 的 Aggressive Script 中有一个事件通知与回调机制.
https://hstechdocs.helpsystems.com/manuals/cobaltstrike/current/userguide/content/topics_aggressor-scripts/as-resources_events.htm

在实现 lua 插件时, 我们也参考这套机制实现了一个类似的回调机制。

并且注册了与 CobaltStrike 中类似的 api. 当然在 lua 中语法会有些区别

```lua
function on_beacon_initial(event)

    print("beacon init")

end
```

### OPSEC 模型 (Unstable)

在实现上面这些内容后, 我们有了新的想法, 我们想基于 ATT&CK 的威胁建模以及 CVSS 的评分模型的思路上设计一套红队视角的 OPSEC 评分模型.

通过四个维度的评判， 参考 CVSS 的分级标准。

**评分越高越安全** , 具体评分为：

- 低(0-3.9)操作极其容易被检测, 明显痕迹, 造成恶性(失去立足点, 系统崩溃等)后果
- 中(4.0-6.9) 操作可能被检测,痕迹可控, 后果可控
- 高(7.0-8.9) 操作基本不可能不检测, 痕迹较小或无痕迹, 被检测也不会有明显后果
- OPSEC(9.0-10)分, 这个级别的操作被称为 OPSEC. 几乎不可能被检测, 没有痕迹, 不会造成后果.
  **暴露度**
  被 EDR/NDR 或任意设备检测到的暴露程度

* 是否有新进程创建
* 是否有新文件创建
* 是否有新网络连接创建
* 是否需要调用系统 api
* ...

**痕迹**
被追踪还原操作痕迹的成功率

- 是否可以删除相关操作日志
- 是否可以删除相关文件
- ...

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

第一阶段, 我们会将内置的模块对应到这个评分模型, 然后尝试将插件包与 OPSEC 模型管理.

最终通过 OPSEC 模型与 ATT&CK 攻击矩阵还原整个攻击模拟的流程.

这个模型现在还很简陋, 我们将在实战中不断调整.

### 其他更新

#### 修复大量 implant 恶性 bug

除了这些功能性更新, 还修复了极为大量的 bug, 我们发现了在 bof, CLR, execute_dll 等等模块会导致 panic 或者无法正确工作的 bug. 这些 bug 在使用任何一款 rust 编写的 C2 中都会遇到. 可以说目前 bug 百出的 IoM 已经对各种模块兼容性和稳定性最好的 rustC2 了.

修复各种各样的 bug 耗费了极为大量的精力, 才使得大部分模块能在绝大多数环境中运行. 要达到 Cobaltstrike 的稳定性还需要一些时间, 但可以肯定是, 我们是在 Offensive Security 这个领域中, 使用 rust 走得最远的团队之一了.

#### 修复 client TUI 大量 bug

目前 client 使用的 repl(交互式命令行)库与 sliver 相同, 这个库的 bug 在 sliver 中也有非常多的人吐槽. 更关键的是, windows terminal 也会给 client 带来 bug.

可以在这里看到已知 bug 合集, https://github.com/chainreactors/malice-network/issues/16 , 这些 bug 每一个都极为影响用户体验, 也因此有不少人建议不要在 windows 系统中使用 sliver. 都源于这些 client 的恶性 bug.

在反馈库作者没有得到解决的情况下, 我们又花费了大量精力去修复这些 sliver 也无法解决的 bug. 最终, 除了 windows terminal 导致的 bug, 我们修复了其他所有的已知问题.

#### Other

- 重构了 client 的表格, 使用多行表格代替老的表格
- 修复了多个 cli 换行导致的显示问题
- 支持了 BOF 更多的输出格式
- 优化了 login 逻辑, 并支持了自动重连到 server
- 修复了 sliver armory 的一些 bug, 重新支持了 extension
- 优化 sliver armory 的索引方式
- 重构 website 与 pipeline 相关组件
- 重构 server db 相关代码,  依赖关系反转
- 添加 donut 与 sliver SRDI rpc 与 lua api, 后续还会暴露到 client 的 cmd 中
- 优化`!` 命令, 现在能从 PATH 中寻找程序
- 实装了 encryption 与 tls 相关参数
- 修复 lua 相关大量 bug
- ......

#### 未解决的问题

在 v0.0.3 中还有一些遗憾.

1. 因为 rust 的 MSVC target 对 TLS 的特殊优化, 导致使用 MSVC 编译的二进制文件无法被 SRDI 转为 shellcode.
2. 使用 windows GNU target 编译的产物暂时无法在 win7 上运行

我们已经有了一些眉目去解决这两个问题, 但是在这个版本来不及实现. 如果遇到了这两个 bug, 欢迎提供 issue, 我们会尽可能提供代替方案.

## 未来路线

现在的 IoM 不论是在功能覆盖面; 还是 OPSEC; 还是可拓展性上都已经超过了任意一款开源 C2.

而要真正意思上堪比 Cobaltstrike 的红队基础设施, 要走的路还很长.

最大的问题就是功能拓展过于迅速, 导致的 bug/用户体验问题. IoM 极其缺少实战的打磨, 我们欢迎在实战中使用 IoM, 并计划免费为合法用途的红蓝对抗/HW 的使用者提供技术解释与技术支持.

下一阶段的工作重点将是 GUI 与文档.

在具体功能上, 我们通过三个版本的快速迭代, 已经实现了最初计划的至少 80%, 我们将在 IoM 的横向与纵向继续拓展能力, 将设计蓝图中的 LLVM obfuscator, rem 代理工具, linux-kit, mac-kit 等逐一实现.

向着成为 **开放的红队基础设施**的目标迈进.

详细的路线图可参阅: https://chainreactors.github.io/wiki/IoM/roadmap/

**本次更新内容多到没办法通过一个更新日志进行描述, 后续还会有一系列文档对 IoM 的方方面面进行系统介绍.**

## End

我们计划给有 **红队蓝军建设计划**的企业提供系统化的基础设施与技术支撑.

欢迎有类似需求的朋友与我们联系. 我们是一个开放的基础设施. **就算没有计划支持我们的产品, 我们也会为任何关注 IoM 的使用者提供一定程度的支持.**
