---
title: Internal of Malice · 快速上手
---

IoM 是包含了一系列仓库的复杂工具链, 我们正在全力简化其使用上的困难。

**quickstart 中将会提供最小使用说明与文档导航**

## 基本使用

### 安装部署server

IoM 的 server 与 client 都是通过 golang 编写的, 打包成二进制文件后不需要任何的依赖环境, 直接运行即可.

如果你的服务器于国外部署, 访问 github 畅通无阻的话可使用如下命令安装

```
curl -L "https://raw.githubusercontent.com/chainreactors/malice-network/master/install.sh" -o install.sh
sudo bash install.sh
```

如果你的服务器位于国内, 我们尽可能的提供了一些加速的配置：release下载、镜像拉取等, 可以使用如下脚本一键安装

```
curl -L "https://raw.githubusercontent.com/chainreactors/malice-network/master/install-cn.sh" -o install.sh
sudo bash install.sh
```

!!! important "网络问题"
	iom 项目 releases 中的文件仍然需要从 github 下载, 国内服务器访问 github 容易超时, 建议配置环境变量中的 proxy, 再执行上述操作
	
	可以映射本机的代理端口到 vps: ssh -R 1080:127.0.0.1:1080 root@vps.ip
	
	```
	export http_proxy="http://127.0.0.1:1080"
	export https_proxy="http://127.0.0.1:1080"
	```

	如果你的当前用户不是 root, 可以使用 sudo -E bash install.sh, 以保持环境变量生效

??? info "(非必要) 自行编译 client 与 server"
	如需自定编译可参照: ([自行编译说明](IoM/deploy/#_6))

![](/IoM/assets/install-pic.png)

安装完成后会自动添加到服务.


??? info "自定义 malefic-network 的 config"
	在使用 client 自动编译时, 会自动指定 pipeline 的 address, 如果需要自定义, 可以通过--address 修改.
	
	安装脚本自动使用的 config 为: https://github.com/chainreactors/malice-network/blob/master/server/config.yaml
	
	malefic 的 config.yaml [详细配置说明](/implant/mutant)


### 运行 client


从 https://github.com/chainreactors/malice-network/releases/latest 中获取 client 相关预编译文件.

**其中`iom_[os]_[arch]`开头的即为 client 端.**

在上一步操作中, 我们已经运行了 server, 并且会发现在当前目录中自动生成了一个新的配置文件, `admin_[ip].auth`. 这个文件是 IoM 的认证凭证, **请你保护好这个文件.**

!!! danger "可能需要检查 server host"
	如果非本机登录, 需要将其中的 `host: 127.0.0.1` 修改为你的远程服务器地址(后续将会优化这一点)
	
	或在启动server时使用-i 添加配置外网ip

`./iom login admin_[server_ip].auth` 即可使用这个配置文件登录到 server.

运行成功会进入到交互式命令, 这里将是操作整个 IoM 的地方.

![](/IoM/assets/NI55beE9Bo6ad5xtT3lcMuvunAd.png)

### 编译 implant

#### 使用github action （推荐）

**v0.0.4 开始推荐更加轻量的github action编译， 对服务器的配置无要求，也不需要安装docker**

新建github token: https://github.com/settings/tokens/new 

![](assets/Pasted%20image%2020250103134903.png)


fork 或者push到自己的malefic仓库

修改 /opt/IoM/malice-network/config.yaml

```yaml
github:  
  repo: malefic  
  workflow: generate.yaml  
  owner: your_name
  token: your_token
```

修改 config 后重启服务

```bash
service malice-network restart
```

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

在 v0.0.4 下，我们引入了 github action 来编译 implant，避免因为 rust 复杂的编译方案而需要准备 docker 环境来编译。现在你只需准备好 malefic 仓库和对应的 token（需要 workflow 和 package 权限），并且在 sever 或者 client 端配置（[详见配置说明](/IoM/manual/manual/deploy)），即可使用命令行进行 github action 编译。

使用 client 自动编译:

**新建profile**

```
profile new --basic-pipeline tcp_default --name beacon_profile_name_1
```

**编译beacon**

基于docker
```bash
build beacon --profile beacon_profile_name_1 --target x86_64-unknown-linux-musl
```

基于github action
```bash
action beacon --profile beacon_profile_name_1 --target x86_64-unknown-linux-musl
```


![build_and_download_beacon.png](/IoM/assets/build_and_download_beacon.png)

**下载编译结果**
```
artifact list
# 或可执行下载命令
artifact download [UNABLE_POOl] 
```

![](/IoM/assets/aa8ef0f33fc8e19ea7bcb9cfb3b094e.png)


!!! tips "多按 Tab, 大部分输入都可以通过 tab 自动补全"


??? info "(非必要)其他编译方式"
	我们提供了如下几种方式进行编译：
	
    1. [本地编译](/IoM/manual/implant/build/#_4)
    2. [Docker 编译(纯本地更安全)](/IoM/manual/implant/build/#docker)
    3. [Github Action编译环境(0环境配置, 推荐)](/IoM/manual/implant/build/#github-action)

	编译完整说明手册[implant 手册](/IoM/manual/implant/build)

#### 使用docker (对服务器性能有要求)

如果已经配置了github action, 可以忽略docker相关。

!!! important "服务器性能要求"
	自动化编译服务用到了 docker, 且 rust 生成的中间文件体积较大, 对 CPU 消耗较高.
	
	因此 IoM 要搭建自动化编译的服务端对性能有一定要求.
	
	我们推荐在 4 核或以上的机器运行, 并保留至少 20G 的空间.
	
	如果只是作为 server/listener 用途, 对性能没有任何要求.
	
	可以专门找一台服务器当做编译服务器. 后续也会提供这方面的优化.

如果要使用docker作为编译环境，需要准备一台性能还不错的机器， 并在install.sh 的交互式安装引导中选择docker.

安装脚本中已经自动化配置了IoM必备的所有环境，可以在client直接操作


??? "基于docker的手动编译(非必要)"
	docker 手动编译操作可见: https://chainreactors.github.io/wiki/IoM/manual/implant/build/#docker
	
	相比IoM目前提供的参数选项， 手动编译具有更高的细粒度，但只推荐对rust开发熟悉的使用



### 操作 implant

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
