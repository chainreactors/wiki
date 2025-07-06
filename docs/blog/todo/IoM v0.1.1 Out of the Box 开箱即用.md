
## 前言

距离上次大版本的更新已经过去了三个月， 我们大概每个月会发布一个patch， 修复已知bug、对功能进行小的改动。 

但三个月也足够我们积累发布一个大版本的更新内容。 恰逢良机，决定将v0.1.1提前搬上来。 

*本次更新内容并不多， 主要在用户体验改进上*

## 新特性

### saas build & auto build

我们也进行了大量的测试和实战， 接收到了一定的反馈。目前IoM最大的上手难度还是rust编译部分。即使我们提供了一行命令即可试用的docker自动化编译以及github action自动化编译， 比起Cobaltstrike这样的通过patch生成beacon还是不够直接。

因此将给**所有用户提供最基础版本的自动化编译服务**， 这个编译服务托管在我们的服务器上， **如果有安全上顾虑， 可以手动关闭这个功能。** 



![](Pasted%20image%2020250630161154.png)


如果token为null， 则会自动注册， 向服务器获得一个token， **对于用户来说是无感的**。 

只需要运行server后等待几分钟， 即可自动生成对应的implant。 

![](Pasted%20image%2020250630161458.png)

我们极大的简化了原本`安装docker/github action -> new profile -> build` 的流程， 现在只需要运行server的二进制文件， 即可直接使用

#### web管理

我们还实现了一套简单的license管理以及build管理的web界面

### embed mal

我们发现了mal-community因为实现的过于匆忙， 导致bug较多，用户体验极差，实际使用者也寥寥无几。 为了弥补这一点， 我们决定在client中维护一个内置的mal 插件工具集， 这个工具集将被良好的维护以及持久更新， 但只会添加必要的功能，已防止client二进制文件体积膨胀。 



### 证书管理

目前IoM的tls相关功能被使用较少， 主要原因是tls使用较为复杂， 需要手动申请证书，通过多个flag进行配置。 为此， 我们优化了这个流程， 大大简化了证书自动申请， 证书配置，自签名证书相关操作


### implant 重构transport

- 支持socks5/http代理
- 修复与重构tls支持， 可以配置tls1.2，tls1.3
- 优化transport性能
- 优化rem的支持

### implant anti sandbox

我们实现一组简单的反沙箱的检测机制，技术来自 https://github.com/ayoubfaouzi/al-khaser 。 我们使用rust进行了简单的修改与实现。 这个检测机制非常简单， 实际上也不具备对抗效果。 目的是提供反沙箱的相关接口， 以供后续定制化开发

![](Pasted%20image%2020250630162746.png)

### implant 其他更新


- 新增swtich internal module
- exec module支持实时回显
- 修复darwin 编译报错
- 特定操作系统下，随即数生成器失效的bug
-  fix XOR cryptor not work


## End

从v0.1.1 开始， 我们可以丢掉安装脚本， 只需要server和client两个二进制文件， 即可在任意位置使用IoM，不再有复杂的环境安装，rust编译操作。 对绝大多数轻度用户不会带来任何的负担， **能做到接近CobaltStrike/vshell级别的开箱即用**。 

