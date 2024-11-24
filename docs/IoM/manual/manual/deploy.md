---
title: Internal of Malice ·  安装部署手册
---

## 安装

一键安装脚本:

```
curl -L "https://raw.githubusercontent.com/chainreactors/malice-network/master/install.sh" | sudo bash
```

确保 **IOM** 所在系统符合以下条件：

- **操作系统**：Linux 推荐使用 Ubuntu、Debian 或 CentOS, (后续会适配 mac 与 windows)
- **权限**：需要以 `root` 用户或通过 `sudo` 运行安装脚本。
- **网络连接**：确保能够访问以下资源：
	- `github.com`
	- `ghcr.io`
	- `docker.com`

!!! important ""
	对于国内服务器访问 github 容易超时且速度较慢, 建议配置环境变量中的 proxy
	`bash
		# ssh -R 1080:127.0.0.1:1080 root@ip  , tricks: 可以映射本机的代理端口到vps
		export http_proxy="http://127.0.0.1:1080"
		export https_proxy="http://127.0.0.1:1080"
	`

运行脚本时，将通过交互命令行提供以下信息：

**安装路径** ：

- 需要指定安装的根目录（默认路径为 /iom）：

  ```
  Please input the base directory for the installation [default: /iom]:
  ```

**IP 地址**：

- **install.sh** 会自动检测默认 IP 并提示：

  ```
  Please input your IP Address for the server to start [default: <自动检测的IP>]:
  ```

**install.sh** 将自动完成以下任务：

1. 检查并安装 Docker。
2. 下载并安装 Malice-Network 服务端及客户端。
3. 下载并安装 Malefic 组件及工具。
4. 拉取必要的 Docker 镜像。
   - `ghcr.io/chainreactors/x86_64-pc-windows-msvc:nightly-2023-09-18-latest`
   - `ghcr.io/chainreactors/i686-pc-windows-msvc:nightly-2023-09-18-latest`
   - `ghcr.io/chainreactors/x86_64-pc-windows-gnu:nightly-2023-09-18-latest`
   - `ghcr.io/chainreactors/i686-pc-windows-gnu:nightly-2023-09-18-latest`
   - `ghcr.io/chainreactors/x86_64-unknown-linux-musl:nightly-2023-09-18-latest`
   - `ghcr.io/chainreactors/i686-unknown-linux-musl:nightly-2023-09-18-latest`
   - `ghcr.io/chainreactors/aarch64-apple-darwin:nightly-2023-09-18-latest`
5. 配置并启动 Malice-Network 服务（基于 `systemd`）。

## 部署

### Config 示例

`config.yaml` 是 Malice-Network 服务器的配置文件，其中包含了一些服务器以及 `listener` 可选的配置。

默认配置中包含了 tcp, pulse, website, bind 的 pipeline 示例.

```bash
debug: false # 开启debug日志
server:
  enable: true        # server 是否启用
  grpc_port: 5004     # 监听的端口
  grpc_host: 0.0.0.0  # 监听的host
  ip: 127.0.0.1       # 服务外部ip
  audit: 1            # 日志审计等级 0 close , 1 basic , 2 detail
  config:
    packet_length: 1048576 # 与implant交互单个包上限, 默认1M
    certificate:           # grpc证书配置, 留空则自动生成
    certificate_key:       # grpc证书配置, 留空则自动生成
  notify:
	enable: false
	telegram:
		enable: false
		api_key:
		chat_id:
	dingtalk:
		enable: false
		secret:
		token:
	lark:
		enable: false
		webhook_url:
	serverchan:
		enable: false
		url:
listeners:
  enable: true            # listener 是否启用
  name: listener          # listener名字
  auth: listener.auth     # 认证文件路径
  tcp:                    # tcp协议的pipeline
    - name: tcp_default   # pipeline 名字
      port: 5001          # pipeline 监听的端口
      host: 0.0.0.0       # pipeline 监听的host
      protocol: tcp       # 传输层协议
      parser: malefic 	  # implant协议
      enable: true        # pipeline是否开启
      tls:                # tls配置项,留空则自动生成
        enable: false
        name: default
        CN: "test"
        O: "Sharp Depth"
        C: "US"
        L: "Houston"
        OU: "Persistent Housework, Limited"
        ST: "State of Texas"
        validity: "365"
		cert_file: ""
		key_file: ""
		ca_file: ""
      encryption:
        enable: true
        type: aes
        key: maliceofinternal
    - name: shellcode
      port: 5002
      host: 0.0.0.0
      parser: pulse    # 对应malefic-pulse上线
      enable: true
      encryption:
        enable: true
        type: xor
        key: maliceofinternal
  bind:
    -
      name: bind_default
      enable: true
      encryption:
        enable: true
        type: aes
        key: maliceofinternal
  websites:             # website http任务
    - name: test		# website 名字
      port: 10049		# website 端口
      root: "/test"		# website route根目录
      enable: false     # website 是否开启
      content:			# website 映射内容
        - path: \images\1.png
          raw:  maliceofinternal
          type: raw
        - path: \images\2.png
          raw: maliceofinternal
          type: raw
```

### Pipeline Config

#### tcp

最常用的 pipeline, 适用于主体程序交互的 pipeline.

tcp 是目前支持了最多特性的 pipeline. 单个 tcp pipeline 配置:

```
- name: tcp_default   # pipeline 名字
      port: 5001          # pipeline 监听的端口
      host: 0.0.0.0       # pipeline 监听的host
      protocol: tcp       # 传输层协议
      parser: malefic 	  # implant协议
      enable: true        # pipeline是否开启
      tls:                # tls配置项,留空则自动生成
        enable: false
        name: default
        CN: "test"
        O: "Sharp Depth"
        C: "US"
        L: "Houston"
        OU: "Persistent Housework, Limited"
        ST: "State of Texas"
        validity: "365"
		cert_file: ""
		key_file: ""
		ca_file: ""
      encryption:
        enable: true
        type: aes
        key: maliceofinternal
```

其中 parser 协议用来区分对应的 implant 类型. pulse 与 malefic 目前的传输协议略有不同, 因此 pulse 需要单独的 parser 配置.

```
    - name: shellcode
      port: 5002
      host: 0.0.0.0
      parser: pulse    # 对应malefic-pulse上线
      enable: true
      encryption:
        enable: true
        type: xor
        key: maliceofinternal
```

#### website

IoM 允许将一些文件挂载 web 服务上

```
  websites:             # website http任务
    - name: test		# website 名字
      port: 10049		# website 端口
      root: "/test"		# website route根目录
      enable: false     # website 是否开启
      content:			# website 映射内容
        - path: \images\1.png
          raw:  maliceofinternal
          type: raw
        - path: \images\2.png
          raw: maliceofinternal
          type: raw
```

#### bind (Unstable)

主动发送数据的 pipeline, 不同于 tcp 监听端口. bind 会主动向目标发送对应协议序列化后的数据.

```
  bind:
    -
      name: bind_default
      enable: true
      encryption:
        enable: true
        type: aes
        key: maliceofinternal
```

### 启动 Server

**Malice-Network** 服务器是能与控制 `Implant` 并与 **Malice-Network** 客户端交互的主机。服务器还存储了部分 **Malice-Network** 收集的数据，并管理日志记录。

需要提前获取对应的配置文件: https://github.com/chainreactors/malice-network/blob/master/server/listener.yaml ,并放到`malice-network`所在目录下

最简启动

```
./malice-network
```

如果配置文件非默认的 `config.yaml`, 可以通过 `-c path/any.yaml` 指定

启动后服务器会输出以下信息, 并生成两个配置文件, 分别为`listener.auth` 和`admin_[server_ip].auth`, 这两个配置文件后续还有用处

![](/wiki/IoM/assets/VNBYbUKdsokMfexhogfcKSLUnAh.png)

需要注意的是, server 中的 ip 字段需要在启动时设置为 listener 与 client 能访问到的地址, 所以可以手动修改`config.yaml`

```
...
ip: 123.123.123.123
...
```

也可以使用`-i` 重载这个参数

```
./malice-network -i 123.123.123.123
```

!!! tips "同时启动 server 与 listener"
在设计上, server 和 listener 是独立的, 但我们也提供了便捷的用法, 仓库中提供的默认`config.yaml`同时配置了 server 与 listener. 所以会同时启动多个服务.

### 启动 Listener

从 v0.0.2 开始, 将只提供一个服务端配置文件, 会根据配置自动解析需要开启的服务. 可以通过 enable 字段进行简单控制

刚才提到 Server 的 `config.yaml` 中已经包含了 listener 配置。 是对 server 与 listener 在同一台机器上部署时的简化。但在交互逻辑上, 同时启动的 listener 与 server 依旧通过 rpc 通讯, 与独立部署的 listener 没有任何区别.

可以在这里获取到[独立的`listener.yaml` 配置文件](https://github.com/chainreactors/malice-network/blob/master/server/listener.yaml), `listener.yaml` 的配置格式与 `config.yaml` 中的 listener 部分完全一致.

如果配置文件非默认的 `listener.yaml`, 可以通过 `-c path/any.yaml` 指定.

配置样例:

```bash
listeners:
  enable: true
  name: default
  auth: listener.auth
  tcp:
    - name: tcp_default
      port: 5001
      host: 0.0.0.0
      protocol: tcp
      enable: true
      tls:
        enable: false
        CN: "test"
        O: "Sharp Depth"
        C: "US"
        L: "Houston"
        OU: "Persistent Housework, Limited"
        ST: "State of Texas"
        validity: "365"
      encryption:
        enable: false
        type: aes-cfb
        key: maliceofinternal
```

!!! important "请检查 listener.auth"
如果换了一台服务部署 listener, 请检查目录下是否存在`listener.yaml`与`listener.auth`

listener 成功启动后，listener 终端会输出以下信息：

![image-20240816214150489](/wiki/IoM/assets/image-20240816214150489.png)

**Malice-Network** 服务器也会输出 listener 登录信息：

![image-20240816214248821](/wiki/IoM/assets/image-20240816214248821.png)

### 启动客户端

将生成的用户配置文件, 默认为 `admin_[server_ip].auth` 复制到 `Malice-Network` 客户端的所在位置。使用新的用户配置文件时，可以使用以下指令启动客户端：

```powershell
.\iom admin_[server_ip].auth
```

执行命令后，客户端会自动使用新的客户配置文件与服务器连接，并将用户配置文件移动至客户端的用户配置文件夹 (Windows 下为 `C:\Users\user\.config\malice\configs`,MacOS X 为 `/home/username/.config/malice/configs`，Linux 为 `/Users/username/.config/malice/configs`）

客户端登录成功后会输出以下信息：

![](/wiki/IoM/assets/NI55beE9Bo6ad5xtT3lcMuvunAd.png)

下次登录后，客户端会自动显示在用户配置文件夹下所有的用户配置，根据需求，选择对应的用户进行选择。

```
./iom
```

![](/wiki/IoM/assets/EEgKb86iwop9xaxBUt8cHZG9n8f.png)

## ROOTRPC

`malice-network` 实际上还存在一个高权限的管理组件. 需要根证书配置才可实现. 这个证书不会生成`.auth`文件, 直接保存在服务端配置和数据库中.

只允许已经启动了`malice-network`的机器上, 继续通过`malice-network user` 或 `malice-network listener` 进行用户管理.

### 认证文件

**Malice-Network** 客户端需要使用用户配置文件才能与服务端进行交互。用户配置文件中包含由服务端生成的证书信息。每次客户端尝试连接服务端时，服务端都会校验该证书信息，以确保用户的合法性。这一过程保证了只有经过认证的用户才能访问和使用 **Malice-Network** 服务，从而提升了系统的安全性和可靠性。

所有的远程 rpc 交互都需要`auth`文件打开 mtls 认证.

```
operator: listener # 操作者名字
host: 127.0.0.1    # server grpc ip
port: 5004         # server grpc port
type: listener     # 操作者类型, 如果不匹配则会认证失败, 默认生成的即可
ca: |
   ...
private_key: |
   ...
certificate: |
   ...

```

### 添加 client

默认情况下, 会生成一个`admin_[server_ip].auth`的配置. 大部分情况下, 使用这个 auth 即可.

目前所有用户都是平级的, 但可以在服务端添加或吊销指定用户的证书实现简单的管理

在确保 **Malice-Network** 服务器已经运行后，在终端输入以下指令：

```
.\malice-network user add [username]
```

执行命令成功后，服务端会输出以下信息并在所处文件夹下生成对应用户配置文件：

![](/wiki/IoM/assets/image_20240903012951.png)

也可以删除用户, 吊销证书, 使其无法登录 server

```
.\malice-network user del [username]
```

列出所有可用的用户配置

```
.\malice-network user list
```

### 添加 listener

在确保 **Malice-Network** 服务器已经运行后，在终端输入以下指令：

```powershell
.\malice-network listener add [listener_name]
```

执行命令成功后，服务端会输出以下信息并在所处文件夹下生成对应 auth 配置文件：

也可以删除用户, 使其无法登录 server

```
.\malice-network listener del [listener_name]
```

列出所有可用的用户配置

```
.\malice-network listener list
```

## 编译

malice-network 已经提供了相关的 release: https://github.com/chainreactors/malice-network/releases

clone 项目到本地

```
git clone https://github.com/chainreactors/malice-network
```

### 编译 client

```
go mod tidy
go build ./client/
```

### 编译 server

```
go mod tidy
go build ./server
```
