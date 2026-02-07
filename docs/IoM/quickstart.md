---
title: Internet of Malice · 快速上手
---

IoM 是包含了一系列仓库的复杂工具链, 我们正在全力简化其使用上的困难。

**quickstart 中将会提供最小使用说明与文档导航**


## 安装部署server

!!! info "Server是IoM的核心控制组件，负责数据处理、状态管理和任务调度"

!!! info "Client是用户交互界面，通过gRPC与Server通信，用于命令输入和结果展示"

IoM 的 [server](/IoM/concept/#server) 与 [client](/IoM/concept/#client) 都是通过 golang 编写的, 打包成二进制文件后不需要任何的依赖环境, 直接运行即可.

**v0.1.1 版本开始, 可以不再依赖任何外部环境, 提供了最基础的自动编译服务**

### 下载

[下载 server release](https://github.com/chainreactors/malice-network/releases/latest)并运行，其中malice_network为Server端，IOM为Client端

**注意**
1. IoM 项目 releases 中的文件需要从github下载，国内服务器访问github容易超时，建议配置环境变量中的proxy，再执行上述操作。
2. 可以映射本机的代理端口到vps，命令如下：
   ssh -p \<服务器端口\> -R 7890:127.0.0.1:7890 -o ServerAliveInterval=60 root@\<服务器地址\>
   示例：
   ssh -p 30065 -R 7890:127.0.0.1:7890 -o ServerAliveInterval=60 root@connect.xx.xx.com

### 运行 server

```sh
./malice-network -i [ip] 
```
**该ip需要设置为client可访问到的ip地址，如公网服务器需要设置为公网ip**

!!! tip "
1.	服务器与客⼾端的默认通过 5004 端⼝进⾏通信，如果需要外⽹访问请确保防⽕墙开启安全规则
2.	如果需开启额外监听器，如8080、5001等也需要确认防⽕墙规则
"

!!! tip "Implant是在目标系统中执行的核心组件，负责接收命令并执行具体操作"

** v0.1.1新特征: **开箱即用** 默认情况下, server会使用云编译对应的[implant](/IoM/concept/#implant)**

!!! danger "安全警告, 使用默认提供的云编译视为同意用户协议"
	用户协议全文: https://wiki.chainreactors.red/IoM/#%E7%94%A8%E6%88%B7%E5%8D%8F%E8%AE%AE
	
	可以通过config中设置关闭此功能, 使用docker/github action私有化编译过程
	```
	saas:  
	  enable: false  
	```

??? info "(非必要) 自行编译 [client](/IoM/concept/#client) 与 server"
	如需自定编译可参照: ([自行编译说明](/IoM/guideline/develop/))


??? info "(非必要)自定义 malefic-network 的 config"
	!!! tip "Pipeline是数据管道，负责Listener与Implant之间的具体通信实现（如TCP、HTTP等）"

	在使用 client 自动编译时, 会自动指定 [pipeline](/IoM/concept/#pipeline) 的 address, 如果需要自定义, 可以通过--address 修改.
	
	安装脚本自动使用的 config 为: https://github.com/chainreactors/malice-network/blob/master/server/config.yaml
	
	malefic 的 config.yaml [详细配置说明](/implant/mutant)


??? info "(非必要)独立运行 [listener](/IoM/concept/#listener)"
	!!! tip "Listener是分布式监听服务，负责与Implant的实际通信，可独立部署在任意服务器上"
	[listener 文档](/IoM/guideline/listener/#独立部署listener)
	
	从 v0.0.2 开始, 我们合并了 listener 与 server 两个二进制文件到`malice-network`
	需要在 [这里获取`listener.yaml`配置文件](https://github.com/chainreactors/malice-network/blob/master/server/listener.yaml)示例
	
	假设是在一台独立的服务器上, 我们需要将上一步骤中会自动生成的`listener.auth`复制到当前目录. 然后执行:
	
	```
	./malice-network -c listener.yaml
	```
	
	![](assets/image_20240903010041.png)
	
	可以看到, 启动了独立的 listener, 并与 server 建立了连接.

## 运行 client

### 下载

[下载IoM release](https://github.com/chainreactors/malice-network/releases/latest) 并运行

**其中`iom_[os]_[arch]`开头的即为 client 端.**

### 运行

在上一步操作中, 我们已经运行了 server, 并且会发现在当前目录中自动生成了一个新的配置文件, `admin_[ip].auth`. 这个文件是 IoM 的认证凭证, **请你保护好这个文件.**

`./iom login admin_[server_ip].auth` 即可使用这个配置文件登录到 server.

![](assets/Pasted%20image%2020250707014504.png)

运行成功会进入到交互式命令, 这里将是操作整个 IoM 的地方.

### 下载implant

下载自动编译好的beacon 或pulse

![](assets/Pasted%20image%2020250707014651.png)

此exe即为[implant](/IoM/concept/#implant), 可通过-f指定不同的输出格式。
## 操作 implant

!!! tip "Session是Implant会话的状态管理结构，保存单个Implant的完整信息和生命周期"

目标上线后选择合适的 [session](/IoM/concept/#session) 进行操作

```
session
```

这个时候输入`help` 将能看到这个 session 上下文完整可用的命令.

!!! important "implant 命令手册"
	[client 命令手册](/IoM/manual/manual/client/)
	
	[implant 命令手册](/IoM/manual/manual/implant/)

![](assets/Pasted image 20250424154703.png)

**Enjoy IoM**
