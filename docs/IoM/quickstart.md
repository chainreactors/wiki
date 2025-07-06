---
title: Internet of Malice · 快速上手
---

IoM 是包含了一系列仓库的复杂工具链, 我们正在全力简化其使用上的困难。

**quickstart 中将会提供最小使用说明与文档导航**


## 安装部署server

IoM 的 server 与 client 都是通过 golang 编写的, 打包成二进制文件后不需要任何的依赖环境, 直接运行即可.

**v0.1.1 版本开始, 可以不再依赖任何外部环境, 提供了最基础的自动编译服务**

### 下载

[下载 server release](https://github.com/chainreactors/malice-network/releases/latest)并运行

### 运行

```sh
./malice-network -i [ip]
```

** v0.1.1新特征: **开箱即用** 默认情况下, server会使用云编译对应的implant**

!!! danger "安全警告, 使用默认提供的云编译视为同意用户协议"
	用户协议全文: https://wiki.chainreactors.red/IoM/#_4
	
	可以通过config中设置关闭此功能, 使用docker/github action私有化编译过程
	```
	saas:  
	  enable: false  
	```

??? info "(非必要) 自行编译 client 与 server"
	如需自定编译可参照: ([自行编译说明](IoM/deploy/#_6))


??? info "(非必要)自定义 malefic-network 的 config"
	在使用 client 自动编译时, 会自动指定 pipeline 的 address, 如果需要自定义, 可以通过--address 修改.
	
	安装脚本自动使用的 config 为: https://github.com/chainreactors/malice-network/blob/master/server/config.yaml
	
	malefic 的 config.yaml [详细配置说明](/implant/mutant)


??? info "(非必要)独立运行 listener"
	[listener 文档](/IoM/manual/manual/deploy/#listener)
	
	从 v0.0.2 开始, 我们合并了 listener 与 server 两个二进制文件到`malice-network`
	需要在 [这里获取`listener.yaml`配置文件](https://github.com/chainreactors/malice-network/blob/master/server/listener.yaml)示例
	
	假设是在一台独立的服务器上, 我们需要将上一步骤中会自动生成的`listener.auth`复制到当前目录. 然后执行:
	
	```
	./malice-network -c listener.yaml
	```
	
	![](/IoM/assets/image_20240903010041.png)
	
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

下载自动编译好的beacon 或pluse

![](assets/Pasted%20image%2020250707014651.png)

此exe即为implant, 可通过-f指定不同的输出格式。
## 操作 implant

目标上线后选择合适的 session 进行操作

```
session
```

这个时候输入`help` 将能看到这个 session 上下文完整可用的命令.

!!! important "implant 命令手册"
	[client 命令手册](/IoM/manual/manual/client/)
	
	[implant 命令手册](/IoM/manual/manual/implant/)

![](/IoM/assets/Pasted%20image%2020250424154703.png)

**Enjoy IoM**
