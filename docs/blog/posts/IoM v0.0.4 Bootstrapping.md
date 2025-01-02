---
date:
  created: 2025-01-02
slug: IoM_v0.0.4
---

## Intro

IoM通过几个月的快速迭代, 已经具备了一个现代化C2的绝大部分功能. 

v0.0.4将是v0.1.0之前的最后一个版本， 可以在这里看到我们v0.1.0的路线图: https://chainreactors.github.io/wiki/IoM/roadmap/#v010-professional-release

在这几个月的开发历程中，我们积累了足够多的独一无二的功能。 从v0.1.0 开始， 我们将尝试发布professional。

profressinal额外支持的功能:

* 基于独特的ollvm 能对malefic的所有编译产物进行高度混淆
* 可自定义可组装的loader
* 独特的pe loader与sRDI, 能实现无新进程执行cmd/wmic等任意命令， 或loader远程二进制文件
* linux kit
* 基于rem实现的任意信道的流量, 代理功能
* OPSEC
	* 独立的堆加密
	* 独立的堆栈混淆
	* 独立的indirect-syscall
	* 可自定义的进程注入
	* ......

**professional 将提供从静态、行为、内存、流量场景的解决方案**

## v0.0.4  更新日志

v0.0.4 是一个过度版本，大部分更新都在修复bug， 提高兼容性稳定性， 降低使用难度与简化操作上。 

### implant更新

#### 兼容win7/windows 2008

新版的rust放弃了对windows7/windows server 2008的支持。 为了兼容win7，我们调整了编译环境的版本， 使用1.74 rust + lto 链接， 使得v0.0.4的implant能运行在低版本的windows中。 

并重载了链接过程，解决rust lto无法正确加载符号表的bug: https://github.com/rust-lang/rust/issues/44322 

#### 修复sRDI 静态 TLS 无法加载的问题 

解决了PE loader 无法加载存在静态 `TLS`的PE文件， 导致以 `Rust` 编写的程序加载panic问题。 

目前还没有解决了这个问题的sRDI， 为此我们实现了自己的sRDI并替换了原有的link sRDI

```
.\malefic-mutant.exe build srdi -i .\malefic.exe
```

![](assets/Pasted%20image%2020241227192048.png)

(在v0.0.4发布之时，我们同步开启了硬核的系列技术文章分享， 将分享一些尚未有人解决过的问题)
#### dllspawn

由于还有很多资源停留在 `CS` 的各类库中， 因此， 我们提供了 `dllspanw` 来适配 `CS` 的对应功能

CS中各种提权的dll以及各种功能， 绝大部分都基于此实现， 现在我们能完美的兼容CS的dll像相关命令了


### 自动化编译

在刚发布的v0.0.3中, 我们使用docker作为自动化编译的解决方案。 但是rust复杂的编译方案不得不准备每个target对应的编译环境。这导致了对CPU, 内存，硬盘都有巨大的占用， 并且我们目前只实现了基于linux的自动化安装。 

比起sliver或者CobaltStrike过于笨重, 这导致上手门槛极大提高。为此， 我们准备了更加轻量的解决方案。 

在v0.0.2中， 提供了使用两行gh命令实现的自动化编译， 在v0.0.4中，我们将github action的云编译接入到client/server中， 只需要申请一个github token， 即可实现对client/server无任何环境要求的自动化编译。

**v0.0.4支持无任何本地环境的自动化编译了， 极大减轻了malefic编译的心智负担**
#### 基于github action的快速编译
##### github相关配置

使用github action前，需要先在server所处服务器上对server二进制文件同一目录下的config.yaml进行配置。将malefic源码所在的github仓库名、github用户名github token以及workflow配置文件名填入。

```
...
  github:
    repo:           				# malefic的仓库名
    owner:           				# github用户名 
    token:                          # github的token
    workflow: 				        # workflow的配置文件名（默认为generate.yaml）
```


 若有多个用户使用服务器，也可以在client所处主机的~/.config/malice/malice.yaml下进行配置。当client端的github 配置填入之后，server会优先使用client提供的github配置，来启动工作流。

  ```
...
    github_repo:                           # malefic的仓库名
    github_owner:                          # github用户名 
    github_token:                          # github的token 
    github_workflow_file: 			     # workflow的配置文件名（默认为generate.yaml）
  ```

##### action build

使用action和子命令来进行编译，必须指定build target以及对应的profile。当workflow运行成功时，client会提示当前workflow的html_url，方便在网页端进行查看。当编译完成时，也会在client进行通知。

![image-20241227041104563](../../IoM/assets/image-20241227035800410.png)

命令示例：

  ```
  action run --profile test --type beacon --target x86_64-pc-windows-msvc
  ```

为了统一使用，action run的参数命令与docker build的参数基本一致。

#### docker优化

添加了服务器端的docker编译队列，因为rust端对性能占用较大， 编译时会占用所有的CPU。现在添加了编译队列， 同时只会运行一个编译任务。 

极大减少了install.sh安装时的配置, 现在只会下载一个allinone的镜像. 这个镜像允许除了arm架构以及win MSVC之外的所有架构编译。 

原本的install.sh 会下载约13g的镜像， 然后生成几个g的编译中间文件。现在我们大大简化了对服务器的负担， 提供了新的allinone的编译镜像以及简化安装脚本。 

allinone 镜像: ghcr.io/chainreactors/malefic-builder:v0.0.4

这个镜像解决了大量的rust的环境安装，交叉编译等问题。如果有其他rust项目在编译上遇到各种错误， 不妨使用这个试试。 
### client更新

#### artifact功能组

为了在提权脚本中更方便使用IoM, 就像CS能直接通过listener生成对应的shellcode一样. patch2将一系列shellcode与artifact操作的函数暴露出来了。

我们添加大量shellcode生成，sRDI等操作相关的api。

* artifact_payload ,对应CobaltStrike中的同名函数， 用于生成stageless的shellcode， 在IoM是SRDI后的beacon
* artifact_stager， 对应CobaltStrike中的同名函数， 用于生成stager的shellcode， 在IoM中式SRDI后的pulse
* donut_dll2shellcode, 基于donut实现的dll转shellcode 
* donut_exe2shellcode, 基于donut实现的exe转shellcode
* sgn_encode, shellcode sgn混淆
* srdi, 能调用malefic-mutant中支持的srdi将二进制程序转为shellcode

详细文档可以查阅: https://chainreactors.github.io/wiki/IoM/manual/mal/builtin/#artifact 

#### donut

将内置的donut从 https://github.com/Binject/go-donut 迁移到 https://github.com/wabzsy/gonut .

并对其进行了大量改动:

1. 将内置的donut 从v1.0 更新到v1.1 , 现在更加稳定
2. 将execute-assembly替换为donut生成的shellcode (临时， 后续会使用malefic-srdi代替)
3. 新增donut命令

![](assets/Pasted%20image%2020241227195559.png)


#### 非交互式client

```bash
.\client.exe implant whoami --use 08d6c05a21512a79a1dfeb9d2a8f262f --auth admin_127.0.0.1.auth --wait
```

![](assets/Pasted%20image%2020241227194931.png)
 
### Other of others

* lua api文档格式重构， 现在更加清晰
* 将sgn与malefic-mutant在编译时内嵌， 减少安装时的步骤
* 优化`!`命令， 能更好得执行本地的命令， 而不需要退出程序
* 编译pulse时 联动beacon
* 重构website
* 优化tui渲染的颜色
* 修复了各种细节处的bug数十处

## End

在我们最初的计划中， 我们的ASM框架mapping可以与C2框架IoM同步进行。 但是C2需要耗费的精力远超想象， 所以ASM再次被搁置。 好在代理工具rem的进展顺利，不出意外近期就可以见面。 

### rem

rem的简介：


> 在 rem 中, 基于传输层之上重新抽象了整个网络交互的流程。
> 
> - 传输层, 对应 tunnel, 分为 listener 和 dialer, 可以实现自定义的任意传输层信道， 只需要实现对应的 golang 的接口即可。目前实现了，tcp, udp, icmp, websocket.
> - 会话层, 实现了链接复用(mux)，会话管理.
> - 加密混淆层(对应表示层)，对应 core/wrapper，对应的接口是 ReadWriteCloser, 只需要实现对应的 Read 和 Writer 接口， 即可实现对传输层流程的加密，混淆， 伪装。甚至可以实现上下行流量分别配置不同的 wrapper. 目前实现了 aes, xor, padding.
> - 中转/代理层(对应表示层) (可选), 可以通过第三方代理/服务中转流量， 例如通过 ssh, socks5, neoreg, suo5 等任意具有流量功能的实现数据转发, 目前实现了 http/https, socks5/4, ssh, shadowsocks
> - 应用层, 基于上面三层实现的信道, 可以被封装为不同的应用, 目前实现了 socks5, port forward, http 代理, shadowsocks, trojan
> 
> 基于这样的抽象层级, 我们可以任意拓展 rem 的能力边界。 我们可以快速添加一个传输层协议， 或是加密混淆算法， 或是代理中转工具， 又或是最终面向用户的协议。
> 
> 这是前所未有的潜力， 理论上不存在任何在流量上被特征/统计学检测的可能。

可以在 https://chainreactors.github.io/wiki/rem/design/ 找到rem的设计文档(update 2024.12), 更新了重构后的rem架构设计。

### IoM-gui

并且IoM的GUI也已经完成了大部分工作， 马上可以发布v0.0.1的IoM-gui .

我们终于可以通过可视化的方式呈现各种复杂的功能。

![](assets/img_v3_02i2_d14419de-3d26-4776-b61c-60a9ede22a7g.jpg)