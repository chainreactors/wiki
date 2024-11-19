---
title: Internal of Malice · 快速上手
---


IoM是包含了一组仓库的复杂工具链, 对于用户来说可能会有使用上的挑战. 

**quickstart中将会提供最小使用说明与文档导航**

## 基本使用

### 安装部署

IoM的server与client都是通过golang编写的, 打包成二进制文件后不需要任何的依赖环境, 直接运行即可. 

```
curl -L "https://raw.githubusercontent.com/chainreactors/malice-network/dev/install.sh" | sudo bash
```

!!! info "自行编译"
	如需自定编译可参照: ([自行编译说明](IoM/deploy/#_6))

![](assets/596887d2f643d94495d5cd43d8a43e8.png)

安装完成后会自动添加到服务. 

安装脚本自动使用的config为: https://github.com/chainreactors/malice-network/blob/master/server/config.yaml 

如需自定义可以修改config后重启服务

```bash
service malice-network restart
```

!!! important "分离部署listener"
	**在默认配置下, listener和server同时部署, 但IoM更推荐分布式部署listener**
	
	[完整的配置文件说明](/wiki/IoM/manual/deploy/#config)
	
	可以根据自己的需要修改. 


??? info "(非必要)独立运行listener"
	[listener文档](/wiki/IoM/manual/deploy/#listener)
	
	从v0.0.2开始, 我们合并了listener与server两个二进制文件到`malice-network`
	
	需要在[这里获取`listener.yaml`配置文件](https://github.com/chainreactors/malice-network/blob/master/server/listener.yaml)示例
	
	假设是在一台独立的服务器上, 我们需要将上一步骤中会自动生成的`listener.auth`复制到当前目录. 然后执行:
	
	```
	./malice-network -c listener.yaml
	```
	
	![](assets/image_20240903010041.png)
	
	可以看到, 启动了独立的listener, 并与server建立了连接. 


### 运行client

从 https://github.com/chainreactors/malice-network/releases/latest 中获取client相关预编译文件.

**其中`iom_[os]_[arch]`开头的即为client端.**

在上一步操作中, 我们已经运行了server, 并且会发现在当前目录中自动生成了一个新的配置文件, `admin_[ip].auth`. 这个文件是IoM的认证凭证, **请你保护好这个文件.** 

!!! danger "可能需要检查server host"
	如果非本机登录, 需要将其中的 `host: 127.0.0.1` 修改为你的远程服务器地址(后续将会优化这一点)

`./iom admin_[server_ip].auth` 即可使用这个配置文件登录到server.

运行成功会进入到交互式命令, 这里将是操作整个IoM的地方. 

![](assets/NI55beE9Bo6ad5xtT3lcMuvunAd.png)

### 编译implant

对于rust新手来说, 我们提供了提前准备好的编译环境. 免得复杂的环境搭建劝退.

我们提供了如下几种方式进行编译：
1. [本地编译]
2. Github Action编译环境(推荐)
3. Docker 编译(推荐)
4. 手动编译

编译完整说明手册[implant手册](/wiki/IoM/manual/implant/)

### 操作implant

使用在client中使用 `sessions` 命令, 将会进入到一个交互式表格中, 可以在这个表格中找到刚才上线的session, 然后运行 回车即可进入到 session的交互上下文.

这个时候输入`help` 将能看到这个session上下文完整可用的命令.  也可以在文档中找到[对应的用法](/wiki/IoM/manual/implant_help) . 

![](assets/image_20240819003338.png)

**Enjoy IoM**




