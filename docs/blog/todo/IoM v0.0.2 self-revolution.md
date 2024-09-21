
v0.0.2 是一次巨大的改动. 在仓促发布v0.0.1后, 我们同时对server/client/listener/implant都开始了重构. 重构工程的代码量接近20000行, 是原本代码的一半. 

好在这么大规模的改动, 也带来了各方面能力的提升. 

## malice-network 更新

### client 重构

本次更新中, 绝大部分修改都是为了提供一个更强大，更美观， 更简便的client. 也是为了后续GUI打下基础. 

我们带来了全新的client, 更优雅的命令补全, 提示与展示



新的usage 渲染

![](assets/Pasted%20image%2020240921042457.png)

#### 重构alias/extension

在sliver中, alias与extension是代表中原理不同, 完全不同的执行方式. alias只是本地的命令行别名, extension则会加载到implant内存中. 

对于IoM 这两者并无区别, IoM已经实现了需要加载的环境, 可以直接执行不同格式的插件. 所以在IoM新的client中, 我们不在区分这两者(在管理命令上有区分 ,在使用时无区分). 可以无缝执行所有的armory中的插件. 


#### notify

IoM现在原生支持第三方应用的通知.  目前我们支持了 telegram, 钉钉, 飞书与channel酱四种常用的方式. 

关于session上线, listener, pipeline, website的操作将自动发送到配置了的通知应用中. 

![](assets/Pasted%20image%2020240919234428.png)

#### pipeline/website

v0.0.1的pipeline与website命令设计存在问题, 并且存在多个bug. v0.0.2重构了这两个命令重新上线. 

现在的client可以控制listener快速打开一个新的pipeline或website, 并实现了自动化的证书生成与管理.



## server

### 合并了listener与server

原本的listener与server独立二进制文件的方式在部署上带来的不少的混淆, 需要同时管理两套配置文件与二进制文件.

我们接受用户的反馈, 简化了这个步骤, 现在不区分server与listener二进制文件. 也不区分server与listener的配置文件. 只需一个二进制文件, 将对应的`enable`设置为true, 即可自动识别为server. 同样也支持同时部署server与listener.

```
server:  
  enable: true  
  grpc_port: 5004  
  grpc_host: 0.0.0.0  
  ip: 127.0.0.1  
listeners:  
  name: listener  
  auth: listener.auth  
  enable: true  
  tcp:  
    - name: tcp_default  
      port: 5001  
      host: 0.0.0.0  
      protocol: tcp  
      enable: true  
```

## 支持crtm

在crtm中支持了iom(client) 与malice-network(server/listener) 的安装与管理

![](assets/Pasted%20image%2020240919234032.png)



### lua插件系统

在第一个版本中, IoM尝试兼容了sliver的armory武器库. sliver有两类插件, 分别是alias与extension. 都是通过json定义的manifest, 注册对应的command. 这确实是个非常简洁的办法, 但也意味着sliver的拓展方面的表现力远远弱于cobaltstrike. 我们做能的, 就是把一些攻击的参数固定下来. 

现在IoM在client中加入了能动态注册命令, 添加功能的lua插件. 目前只支持了lua作为插件语言, 在v0.0.3中还将支持golang作为动态的插件语言.  在IoM的架构设计中, 不仅在implant中的每个module/feature是可组装的, 对于client/server/listener中的每个细节, 也同样是可组装可自定义的. 

可组装,可拓展,插件化,热插拔是一个规模颇为宏大的工程.  后续会通过专门的设计系列文章介绍IoM将如何实现可能是最强大的C2拓展生态. 

(目前实现了插件系统的基本功能, 但它还很脆弱, 我们计划在v0.0.3基于它实现一套默认的工具包, 并在v0.0.4 公开文档欢迎外部贡献者.)

lua插件保留了三套设计风格, 可以互相任意组合. 

#### cobaltstrike的CNA风格

简单的例子:

将gogo注册为IoM的命令

```lua
function command_gogo(cmdline)
    return bexecute_exe(active(), script_resource("gogo.exe"), cmdline)
end
```

我们将maleifc中的每个模块都封装了一个CNA风格的lua函数, 可以在文档中看到全部的函数.

其中, 已经`b`开头的函数如果在Cobaltstrike中存在相同功能的函数, 函数签名也修改为一致, 减少迁移的成本. 


```
function bchown(sess, arg2, arg3, arg4, arg5) end
function bsetenv(sess, arg2, arg3) end
function bcp(sess, arg2, arg3) end
function bmimikatz(sess, arg2, arg3) end
function bdownload(sess, arg2) end
function bcd(sess, arg2) end
function binfo(sess) end
function bpwd(sess) end
function bwhoami(sess) end
function bclear(sess) end
function bsharp_wmi(sess, arg2, arg3, arg4) end
function binline_execute(sess, arg2, arg3, arg4) end
function bdllinject(sess, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) end
...
...
```

#### IoM 风格

cobaltstrike的CNA对外暴露的接口与IoM实际上不完全一致. 

同样以注册gogo为例, IoM风格的函数能配置更多的特性, 例如etw, blockdll, 牺牲进程, 参数欺骗等.

```lua
function command_gogo(args)
    sac = new_sacrifice(0, false, true, true, "")
    return execute_exe(active(), script_resource("gogo.exe"), args, true, 0, "amd64", "", sac)
end
```

### implant 大量改动

在v0.0.1中, inline_exe, inline_dll, inline_shellcode 因为一些bug, 没有将其添加到client中. 

在v0.0.2中, 我们修复了bug, 并重构了这几个功能, 现在能实现更强大更OPSEC的无文件攻击了. 

### 无文件攻击
v0.0.2提供了6中不会创建新进程的无文件二进制文件的方式:

* inline_assembly , 等同于CS的execute_assembly当前无新进程创建的实现
* inline_shellcode, 通过bof可实现类似inline的exe/dll的功能, 可以根据实际情况选用
* inline_exe
* inline_dll
* powershell
* bof

也就是说, IoM现在不仅可以实现全程的无文件攻击, 还可以实现全程的无新进程攻击. 在OPSEC上迈出了新的一步. 


同时, 也保留了fork&run的版本

因为inline执行shellcode/dll/exe时, 会导致当前进程阻塞, 甚至会因为二进制程序的bug导致本进程panic, 所以我们也保留虽然不那么OPSEC但是相对安全的执行方式. 

* execute_shellcode
* execute_dll
* execute_exe

(powershell, bof, assembly因为其特性, 目前不会阻塞本进程, 也不太会导致本进程崩溃, 所以只保留了更OPSEC版本)

### 新的编译方式

在v0.0.1中.  只提供了编译的操作流程, 对于不熟悉的rust的用户编译implant时会遇到各种困难. 我们意识到了这点, 提供了更加优雅的编译方式. 

**从docker中编译**

我们提供了一个预配置了交叉编译环境的docker, 以及对应的Makefile. 使用一行命令即可编译出想要的结果. 

**使用github action编译**

更进一步, 我们提供了无需任何环境的编译方案. 

只需要从github生成token, 然后使用gh cli 执行一行命令即可生成implant. 

后续我们还会将目前需要手动执行命令的操作全都在server上自动实现, 使用client<->server交互即可实现可组装的implant的编译.

### addon
为了防止例如gogo, frp之类的二进制程序多次执行需要多次发送的问题, implant现在支持将这些数据保留在内存中, 下次使用对应工具的时候, 只需要传入参数即可. 

在client提供了一组新的命令, 用来增删改查addon, 并且将对应的接口暴露给插件系统. 


## v0.0.3 roadmap

- [ ] client
	- [ ] 新增client端插件类型 golang
	- [ ] 重构explorer
		- [ ] 实现process explorer
		- [ ] 实现netstat explorer
		- [ ] 实现services explorer
	- [ ] 实现profile, 能自定义自动加载的插件集
	- [ ] 初步实现通过client实现的自动化编译
	- [ ] mals 插件仓库
		- [ ] 实现插件从github自动下载管理
		- [ ] 提供默认插件集合
- [ ] server/listener
	- [ ] 重构listener的parser, 尝试兼容第三方C2
	- [ ] 添加donut, srdi, sgn等rpc, 实现shellcode的自定义操作
- [ ] implant
	- [ ] 提供多运行时支持, tokio, futures
	- [ ] 提供基本的流量加密选项
	- [ ] 更优雅的自动化编译
	- [ ] 新的原生module
		- [ ] services操作
		- [ ] 注册表操作
		- [ ] 计划任务操作
		- [ ] WMI/COM (待定)
	- [ ] StackSpoofer
	- [ ] SleepMask Community 
	- [ ] 实现stage 1 loader
	- [ ] 实现autorun, 运行在编译时通过yaml配置一系列自动执行的任务

有人也问过IoM与sliver有什么区别. 阅读了v0.0.2的更新公告, 应该能发现 IoM的架构与设计目标更加宏伟与激进. 

## End

![](assets/Pasted%20image%2020240914031643.png)

v0.0.1 实属仓猝发布, 有大量恶性bug以及实现到一半的功能. v0.0.2修复了近百个bug, 但还是只是稍微好一点点, 还是充满bug. 对于这一点我们很抱歉, 希望能在v0.1.0的时候达到基本可用的状态. 

IoM致力于成为下一代C2解决方案, 提供一套足够强大可以自定义的红队基础设施. 