---
title: zombie · index
---

## Overview

zombie是gogo设计之初就诞生的一个计划, 中间写了好几版(早期版本@PassingFoam), 搁置了快一年. 正巧有几个朋友一直在关注这个工具, 才把它从内部使用的工具变成基本可用的工具. 虽然拖了一年多, 但它绝对是地球上最强大的爆破工具. 

##  设计

### 开源世界

重新设计一套工具之前得先关注这个领域的前辈. 

* [hydra](https://github.com/vanhauser-thc/thc-hydra) 每个人都用过的爆破工具, 命令行简单直白. 但也会发现, 日站越熟练就用的越少, 和它编译麻烦, 性能较慢, 没办法跨平台等等问题相关. 不过阅读它的源码会发现, 它对每个协议的支持都是原生的, 直接通过socket实现, 而不是引入第三方库. 

* [medusa](https://github.com/jmk-foofus/medusa) 和hydra非常相似, 性能和设计上都差不多, 缺点也是类似, 编译麻烦, 性能较慢, 没办法跨平台

* [SNETCracker](https://github.com/shack2/) "超级弱口令检测工具", 有一段时间老是出现, 甚至在目标的内网机器上都找到过友商上传的记录. 带有gui, 上手快, 但性能差, 复杂场景无法支持(例如给非默认口令的服务爆破都无法做到). 支持的协议也不是很多. 

* [legba](https://github.com/evilsocket/legba) 一个rust编写的较新的爆破工具, 我第一眼看到它的时候一度觉得zombie项目可以停止了. 但实际使用了一次, 发现hydra有的问题它竟然完美的保留了, 除了rust的tokio提供了更强大的多线程性能外, 依旧是无法跨平台, 编译麻烦之类的问题, 支持的协议也没那么多. 反而让我更迫切的完成zombie项目

* 其他, 这两年也出现了fscan, kscan等等带有爆破功能的扫描器, 但不知道有没有人发现, 使用fscan的时候从来没扫描到过非默认端口的弱口令(😊), 因为fscan硬编码了端口号, 并根据端口号进行爆破. 诸如此类问题, 他们的爆破能力对比hydra来说反而是退步了. 

### 设计

 zombie的设计之初有几个目标:

1. 联动gogo. gogo为了轻量, 无依赖放弃了很多功能. 但服务爆破这个功能又不必可少.
2. 简洁并强大的命令行设计. (参考了hydra的命令行设计)
3. 支持足够多的服务, 包括各种web服务, 目前依旧支持了数十个服务. (通过原生插件与neutron引擎实现了)
4. 支持动态生成字典 (重写了hashcat的rule与mask生成器)
5. 支持一定的后渗透能力 (类似crackmapexec, 目前还未实现)

### 字典生成器

多年的经验告诉我, 一个好的字典能解决90%的目标, 剩下的10%只是因为字典还不够好. 

在绝大多数情况下,  找到一个口令, 就可以根据这个口令的规律生成出能通杀大部分服务的口令.  因此, 字典生成器的设计是zombie的核心. 

而目前使用最多的字典生成器还是hashcat. 也有各类社工字典生成器, 不过原理大同小异. 提供足够多的信息, 然后做笛卡尔积. 实际上的能力反而不如hashcat的[rule-base](https://hashcat.net/wiki/doku.php?id=rule_based_attack) . 

很多人可能不知道, hashcat内置了一个非常好用的规则库. [rockyou-30000](https://github.com/hashcat/hashcat/blob/master/rules/rockyou-30000.rule). 它是根据rockyou泄露的密码生成的30000条最常用的rule. 也就是说, 假设输入`admin`, 它会生成30000条与admin相关的字典. 

`hashcat --stdout -r /usr/share/hashcat/rules/rockyou-30000.rule word.txt >wordlist.txt`

这个规则库不止一次给我带来惊喜.  相信你也值得有用. (这个规则库已经在zombie中实现, 见: https://chainreactors.github.io/wiki/zombie/start/#_2)

而问题在于hashcat的rulebase竟然没有其他语言的实现, 于是我手搓了一个简单的dsl---[words](https://github.com/chainreactors/words), 实现了hashcat的rule与mask的大部分功能. 

hashcat因为太过于古老, 甚至不支持超过10位的字典, 以及一系列类似的小问题, 也在words中得到了解决. 我也将为[words提供文档](https://chainreactors.github.io/wiki/libs/words/), 欢迎更多的使用者. 

这个字典生成器也在[spray](https://github.com/chainreactors/spray)(一个强大的目录爆破/指纹识别工具) 得到了应用, 用来生成目录字典.

 

### 命令行设计

hydra给用户的使用体验就是, 它的文档只需要阅读一次, 上手非常亏. zombie也在尽力做到这一点(gogo与spray在这一点上很失败😊).

小写的`-i`是单个目标, 大写的`-I`是文件输入, 小写的`-u` 是单个用户名, 大写的`-U` 是用户名文件, 以此类推. 在zombie中, 这一点是完全一致的.  

zombie有更多的功能, 不得不加入了更多参数, 不过最基本使用上与hydra非常相似, 不需要付出额外的学习成本. 但要使用更多更强大的功能, 还是建议完整阅读文档, 学习更多复杂的高级用法. 



### 联动

zombie最初设计上就是补充gogo的能力, 因为gogo为了追求全场景可用被迫放弃了很多功能. zombie不仅不全了gogo没有的爆破能力, 还实现了更多的功能. 

假设一个场景, 拿到了一个账号密码, 如何判断它是通用的? 

在zombie中很简单, `zombie --gogo 1.dat -u [username] -p [password]` , zombie将会使用这个密码对所有支持的插件进行一轮碰撞. 比起其他工具中的每个服务都需要操作一次方便了不知道多少倍.  

同样的, 要实现类似fscan那样的最大可能爆破, zombie中也很简单, `zombie --gogo 1.dat`

zombie内置了将gogo文件解析为一个zombie可识别的json配置, 也可使用其他工具导出一个这样结构的json文件， 同样能调用zombie进行批量爆破.

```
[
    {
        "ip": "123.123.123.123",
        "port": "443",
        "service": "gitlab",
        "scheme": "https"
    }
]
```

### 拓展性

插件系统设计的并没有gogo那么复杂, web服务的复用了gogo原本的插件仓库, 非web服务则使用了go编写的原生插件实现.

除了插件之外, 还有一个内置的规则库, 用来生成字典以及默认密码的配置. 位于: https://github.com/chainreactors/templates/tree/master/zombie , 如果有遗漏欢迎提供建议.

## 未来

zombie接下来的工作重心将是细节上的优化, 有许多协议实现的挺粗糙的, 也还未进行充分测试,  panic是家常便饭(更新速度太快, 测试覆盖不全), 并从nuclei中移植所有较高价值的login相关的template. 

中长期规划是实现基本的信息提取和后渗透功能, 目前来看优先级并不高. 
