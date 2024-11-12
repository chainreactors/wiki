repo: https://github.com/chainreactors/neutron

## 背景

在projectdiscovery融第一轮前, 我就发现了这个充满未来的项目nuclei.  

nuclei提供了极简的poc配置, 强大的DSL引擎以及目前**地表最庞大的poc社区**, 最重要的是, 它是完全开源的.

随着nuclei 更新到v3, 也面临了工具进化路上必定会经过的"软件膨胀", nuclei从v1到v3 引入了非常的庞大的功能
* js/python作为  Internal DSL 引擎
* headless浏览器
* file, dns, offline,websoket,ssl,whois等新的协议引擎
* OAST Out-of-band服务
* ...

也引入了更多的bug, nuclei-templates的已经有一部分的poc随着引擎更新出现了bug. 

而nuclei的绝大数poc, 都用不着这些功能, 其中最常用的协议是http与socket, 最常用的功能是通过yaml配置一个或者几个数据包, 然后校验返回值. 甚至OAST都不是必备的功能, 因为极少漏洞强依赖这个功能, 都能找到时延, 回显等方式更高效与准确的判断.

### 嵌入nuclei

但对于nuclei的初衷---poc引擎来说, 确实拓展了引擎的能力边界, 也意味着很难将nuclei嵌入到各种场景中, 不管什么工具引入了nuclei, 体积都要飙升到30-50M. 压缩完体积也超过了10M.

更重要的是, nuclei还会破坏操作系统的兼容性, nuclei v2能支持到windows7, v3 应该只能在win10以上运行了(go 1.11 放弃对xp支持, go1.18放弃对windows7支持). 对于绝大多数使用者来说这没有影响, 各位都有最好配置的电脑. 但在红蓝对抗中, 我们没办法控制我们的立足点, 这点就显得尤为重要. 

github上能找到十来个引用了"github.com/projectdiscovery/nuclei" 的工具, 体积也是一个比一个庞大从upx完的10+M到上百M, 很难想象使用这样的工具在红蓝对抗中进行横向移动.  

在这里, 我可以很自豪得说, 在极限场景(upx+放弃少数几个dsl函数)的gogo可以做到保留完整功能体积在2M以下(现在github release上的体积也只有3M), 只比golang默认配置下编译出来的helloworld大30%. 

那这个体积能做什么呢? 给C2反射加载!!! 我们就可以实现不落地的gogo.  (现在的很多技术也可以加载不限制体积的pe文件, 但在各方面特征上, 总是越小越好)

(欢迎体验我们的新工具 [下一代C2IoM](https://chainreactors.github.io/wiki/IoM/) , 已经支持了chainreactor的工具)

![](assets/Pasted%20image%2020241010175938.png)

## 实现

刚才提到gogo只有2-3M, 那为了实现这个特性, 就不可能引用完整的nuclei引擎. 

在gogo最初接入poc引擎时, nuclei大约是v2.7版本, 于是决定从nuclei中把需要的代码抠出来, 封装成0依赖的库.  不得不说, nuclei代码质量已经非常不错, 但这项工作还是耗费了很大的精力. 好在结果也值得这样的投入.

gogo在public第一个版本之前, 就已经支持了nuclei v2.7的大部分常用特性, 特别是其yaml引擎. 只有OAST, DSL(已在新版本中支持)这两个相对有用的功能没有实现, 其他特定均能完美运行在无依赖的nano版本引擎中. 

这正因如此, 将其命名为 neutron (中子).  这最初是给gogo使用的nano版本的poc引擎.

机缘巧合之下, 有不少相同需求的朋友看到了这个项目, 并尝试将其用到自己的工具中.  

于是neutron开始再次进化. 

gogo的使用场景较为极端, 因此对nuclei阉割的时候下手太重, 有很多很常用的功能以及v2.7后出现的功能都不支持. 但他们的场景覆盖的范围更广, 有在外网使用的, 用在集成化的扫描器使用的, 他们需要一个相对完整的nuclei. 而我也觉得, gogo目前的poc库支持的poc过于少, 也无更多精力去维护poc库.  我想要能从nuclei-templates中直接移植, 而不需要过多改动, 尽可能减少移植成本. 

neutron就在今年的早些时候进行了大量更新, 将各种特性兼容到v2的最后一个版本, 并且重新支持了dsl(有太多poc中包含了这个功能). 更重要的是, 这些提升并没有带来兼容性的损失, gogo还是可以在windowsxp中完美运行, 也是目前市面上, 高性能的扫描中, **唯一支持windows xp的工具**. 

可以在这里看到更新日志: https://chainreactors.github.io/wiki/libs/neutron/update/

目前唯一的遗憾可能是, 依旧不支持OAST, 可能未来也不会支持这个功能. 因为对于我们关心的场景来说, 需要用到OOB本身就代表这个poc不可靠. 

### 新用途

随着zombie逐渐成熟, 支持了市面上其他同类型工具都支持的协议后, 继续向着web领域扩张.  这时候发现neutron与zombie是绝配. 

nuclei的templates语法中本身就有payload这个可以被动态修改的参数, 配合上zombie的字典生成器, 一拍即合.  zombie可以通过neutron实现多大多数web应用的自动化爆破以及更进一步的定制化爆破.  各种OA, 邮箱, 接口, 只要适合账号密码有关, 且没有验证码(大部分内部应用都没有验证码或者存在特殊的爆破接口)的服务, 都可以通过neutron快速实现, 并积累下来. 

相关爆破的poc如下: 

https://github.com/chainreactors/templates/tree/master/neutron/login

只需要在poc中的info字段下添加专属的 zombie属性, 即可注册到zombie中.  通过这个方式, 现在的zombie支持70+服务/协议. 配合gogo的自动化扫描与指纹识别, 可以实现远超fscan, hydra, kscan等等任意扫描器或爆破工具的效率与能力, 让zombie变成内网最合适的帮手. 

更重要的是, 对于爆破来说, 十几个线程(代理能够承受的)已经非常够用, 不像fscan/gogo这类工具起步就是1000,2000,4000的并发(代理无法承受, 会大量丢包). 只需要下载gogo的扫描结果, 即可调用zombie配合代理实现快速的, 批量的自动化爆破.


### 更进一步

如果深入研究过nuclei的朋友可能会发现, nuclei的设计理念可以运用到很多地方, nuclei还实现了基于file的protocol. 也就是在本地文件中查找敏感信息, 或者实现简单的代码审计工具. 

将这个思路拓展到红蓝对抗中, 那就是后渗透中, 自动在文件中搜索敏感信息. 这个思路由来已久, 网上也有不少这个用途的工具. 

https://github.com/qwqdanchun/Pillager

https://github.com/Naturehi666/searchall

这两个工具以及相同用途的其他工具都没能解决这方面的自动化, 打到点后还需要大量的时间去摸. 实际上缺少的就是将经验变成积累的能力. 通过GPT, 可以将经验快速变成一个yaml, 然后加到templates仓库中, 通过团队的力量将其变成基础设施.

而nuclei的设计理念提供的就是这样的能力,  从nuclei开始写poc不需要新建一个python脚本, 只需要将burp中的包复制过来, 甚至通过GPT将数据包直接转为yaml即可. 

nuclei的file协议如果单独抽出来, 就可以将这个能力带到这个使用场景中.  平时遇到的各种各样的框架, 产品, 组件都有自己的配置文件, 敏感信息等等能被自动化处理的信息. 

也是挂在wiki首页一年多的工具`found`的设计雏形. 受限于精力, 目前只将file从nuclei中剥离出来, 变成一个独立的库. 

found demo:

![](assets/Pasted%20image%2020241011000054.png)

库的名字是proto(质子), 与neutron相对, 同属于nuclei的组成部分. 目前还处于demo状态.

https://github.com/chainreactors/proton  (demo)

在proton中, 已经将file从nuclei中迁移, 但在本机信息收集场景下,  还有更多可以实现的功能. 

例如:

- 内存搜索, 类似yara. 可以考虑复用yara引擎
- 注册表搜索, 很多软件的key保存在注册表内

这两个场景都非常适合被templates化. 


## 其他项目更新
### gogo的改动

在过去的两年中, gogo的绝大部分能力提升都来自neutron, fingers 以及对应的templates. 均已经在各自库的文章中进行介绍, 这里不想多水一篇文章, 一次性把gogo自身重要的改动一并介绍.

TL;DR
- 支持更多架构与更多操作系统的自动化编译, 提供了windowsxp的release, 以及android, solaris, freebsd等等操作系统的预编译文件
- 新增与zombie联动的相关功能
- `--opsec`参数, 所有已知被设备标记的扫描探针都可以添加这个参数关闭. 以及大量关于opsec的改动
	- 减少icmp探测的特征
	- 随机化http协议探针的UA
	- 减少多个主动指纹识别的特征
	- 随机化网段扫描时的ip生成器
- 支持`--exclude`/`--exclude-file`排除指定网段
- 支持ipv6网段的解析与扫描
- templates大量改动
	- 新增100.64.0.0/10保留地址的workflow配置
	- 增加数十个各类现代服务的默认端口配置
	- .....
- 大量细节上的改动与bug修复, 不一一赘述. 


现在的gogo是所有扫描器中, 发包数量最少,但是能获取最多信息的扫描器. 并且能让多家厂商的态势感知完全无感(需开启 `--opsec` 配置).

#### 自定义opsec配置

fingers的opsec
```
- name: swagger
  focus: true
  opsec: true
  rule:
    - regexps:
        vuln:
          - Swagger UI
      send_data: /swagger-ui.html
      info: swagger leak
```

neutron的opsec
```
id: shiro-default-key
opsec: true
info:
  name: brute Shiro key
  severity: critical
  tags: shiro
...
```

通过在templates中添加这两个配置项即可在`--opsec`时自动忽略

### words

repo: https://github.com/chainreactors/words

docs: https://chainreactors.github.io/wiki/libs/words/

**更加轻量**

使用来自words(自研的一些脚本解释器, 用来代替hashcat的mask/rule) 新增的logic表达式代替更加重量级的expr表达式, 带来了约10%的性能提升和体积的数百k的减少. 

欢迎在各类项目中使用words实现基于掩码和基于rule的字典生成器. words没有任何依赖, 不会带来任何负担, 但是可以实现非常强大能力. 目前已经在fingers, spray, zombie中被使用

![](assets/Pasted%20image%2020241010170605.png)


### spray

新增了一个panel帮助用户更好的理解spray的工作方式

![](assets/Pasted%20image%2020241010170833.png)

### IoM v0.0.3 预告

IoM在v0.0.1发布之后, 经过了v0.0.2 对server/client的重构, 现在implant也迎来了彻底的重构. 

我们实现了srdi, 手搓汇编实现的shellcode generator, stage1 加载器, 插件合集与插件仓库等等等等一系列新功能. 

更重要的是, 我们**将这些新功能统统开源**, IoM将会是最强大的可自定义的C2框架. 

v0.0.3版本的IoM将是开源生态中最强大的C2之一, 在功能覆盖上已经超过了Havoc和Sliver这些知名C2框架, 并且**基于模块化实现的前所未有的自定义与拓展能力**. 

v0.0.3 预计在十一月的第一周发布.