# 用户手册

## 安装

按照以下说明安装 Malice-Network：

1. 为支持的操作系统下载 Malice-Network 服务器版本和客户端版本。

Malice-Network 服务器支持 `Linux`、 `Windows` 和 `MacOS`，但是我们建议在 Linux 主机上运行服务器，因为在 Windows 上，服务器运行某些特性可能更加困难。Malice-Network 客户端在从 Windows 访问 Linux/MacOS 服务器时能正常工作。

1. 运行服务器版本二进制文件。

## 部署

### Server Config

`config.yaml` 是 Malice-Network 服务器的配置文件，其中包含了一些服务器以及 `listener` 可选的配置。

`server` 字段包含了以下服务器配置：

```
    `grpc_host`：gRPC 服务绑定的主机地址。

    `grpc_port`：gRPC 服务绑定的端口号。

    `audit`：日志审计级别设置，`0`为关闭审计，`1`为基本信息审计，`2`为详细审计。

    `packet_length`：数据包长度设置。

    `certificate`：自定义证书相关配置。

    `certificate_key`：自定义证书密钥相关配置项。
```

`listener` 字段包含了以下 `listener` 配置（可独立部署）

```
    `name`：listener名称。

    `auth`：listener身份验证配置文件名。
```

`tcp`：TCP 的连接配置选项:

```
    `name`: TCP配置连接名称。

    `host`：TCP连接绑定的主机地址。

    `port`：TCP 连接使用的端口号.

    `protocol`：使用的协议类型。

    `enable`：TCP 配置项是否启用。
```

`tls`：TLS 配置:

```
    `enable`：TLS配置是否启用。

    `CN`：TLS 证书的通用名称。

    `O`：TLS 证书的组织名称。

    `C`：TLS 证书的国家代码。

    `L`：TLS 证书的城市。

    `OU`：TLS 证书的组织单位。

    `ST`：TLS 证书的州或省份。

    `validity`：TLS 证书的有效期。
```

`encryption`：加密配置：

```
    `enable`：加密是否启用。

    `type`：加密类型。

    `key`：加密密钥。
```

`websites`：网站配置列表：

```
    `websiteName`：网站名称。

    `port`：网站使用的端口号。

    `rootPath`：网站的根路径。

    `enable`：网站配置项是否启用。
```

配置样例:

```bash
ca: .
opsec: true

server:
  grpc_port: 5004
  grpc_host: 127.0.0.1
  audit: 1  _# 0 close , 1 basic , 2 detail_
_  _config:
    packet_length: 100 _# 1M:_
_    _certificate:
    certificate_key:

listeners:
  name: default
  auth: default.yaml
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
  websites:
    - websiteName: test
      port: 10049
      rootPath: "/"
      enable: false
```

### 启动 Server

**Malice-Network** 服务器是能与控制 `Implant` 并与 **Malice-Network** 客户端交互的主机。服务器还存储了部分 **Malice-Network** 收集的数据，并管理日志记录。**Malice-Network** 服务器必须和 `config.yaml` 在同一个目录下。要启动 **Malice-Network **服务器，请根据不同操作系统进行以下操作：

a. 对于 Linux：

```
     i. 输入以下命令：
```

```bash
bash
cd /path/to/malice-network-server
./malice-network-server
## 后台挂起
./malice-network-server --daemon
```

b. 对于 MacOS X：

```
     i. 输入以下命令：
```

```bash
bash
cd /path/to/malice-network-server
./malice-network-server
```

c. 对于 Windows

```
    i. 输入以下命令：
```

```powershell
powershell
cd "C:\path\to\malice-network-server"
.\malice-network.exe
```

如果配置文件非默认的 `config.yaml`, 可以通过 `-c path/any.yaml` 指定

启动后服务器会输出以下信息：

![](assets/VNBYbUKdsokMfexhogfcKSLUnAh.png)

### 启动 Listener

Server 的 `config.yaml` 中已经包含了 listener 配置。 是对 server 与 listener 在同一台机器上部署时的简化。

listener 将始终保持独立， 并通过 grpc 与 server 进行交互， 包括注册、启动、关闭、删除等功能。

**Malice-Network** 将提供独立的 listener 二进制文件，通过加载 listener.yaml 在任意机器上部署，并连接到 server， 接受 server 的调度。

`listener.yaml` 的配置格式与 `config.yaml` 中的 listener 部分完全一致.

a. 对于 Linux：

```
     i. 输入以下命令：
```

```bash
bash
cd /path/to/malice-network-server
./listener 
## 后台挂起
./listener --daemon
```

b. 对于 MacOS X：

```
     i. 输入以下命令：
```

```bash
bash
cd /path/to/malice-network-server
./listener
```

c. 对于 Windows

```
    i. 输入以下命令：
```

```powershell
powershell
cd "C:\path\to\malice-network-server"
.\listener.exe
```

如果配置文件非默认的 `listener.yaml`, 可以通过 `-c path/any.yaml` 指定.

配置样例:

```bash
listeners:
  name: default
  auth: default.yaml
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

需要注意的是, 非本机部署的 listener, 需要提供 `auth.yaml` 配置，auth 配置需要按照以下方法生成。

在确保 **Malice-Network** 服务器已经运行后，在终端输入以下指令：

```powershell
powershell
cd "C:\path\to\malice-network-server"
.\malice-network-server.exe listener add listenerName
```

执行命令成功后，服务端会输出以下信息并在所处文件夹下生成对应auth配置文件：

![image-20240816205524283](assets\image-20240816205524283.png)

![image-20240816205616073](assets\image-20240816205616073.png)

auth配置文件中包含了以下信息：

`operator`: listener名称。

`lhost`：listener所连接的服务器地址。

`lport`：listener所连接的服务器端口号。

`type`：配置类型分为 client 和 listener，auth配置为 listener。

`cacertificate`：服务端生成的 CA 证书，用于验证服务端的合法性。

`privatekey`：listener的私钥，用于加密和解密数据。

`certificate`: listener的证书，用于向服务端证明listener的合法性。

### 启动Listener

将生成的auth配置文件复制到 `Malice-Network` listener的所在位置，该目录下需要包含以下文件：malice-network-listener启动文件、listener.yaml、xxxx.yaml（auth配置文件）。

![image-20240816213518902](assets\image-20240816213518902.png)修改listener.yaml文件中的listeners下的配置，name需要为auth配置文件的前缀名， auth为auth配置文件的文件名，以上图为例，listener.yaml的配置应为：

![image-20240816213745122](assets\image-20240816213745122.png)

listener配置完成后，确保 **Malice-Network** 服务器已经运行后，在终端输入以下指令：

```powershell
powershell
cd "C:\path\to\malice-network-listener"
.\malice-network-listener
```

listener成功启动后，listener终端会输出以下信息：

![image-20240816214150489](assets\image-20240816214150489.png)

**Malice-Network** 服务器也会输出listener登录信息：

![image-20240816214248821](assets\image-20240816214248821.png)

### 初始化客户端用户

**Malice-Network** 客户端需要使用用户配置文件才能与服务端进行交互。用户配置文件中包含由服务端生成的证书信息。每次客户端尝试连接服务端时，服务端都会校验该证书信息，以确保用户的合法性。这一过程保证了只有经过认证的用户才能访问和使用 **Malice-Network** 服务，从而提升了系统的安全性和可靠性。

在确保 **Malice-Network** 服务器已经运行后，在终端输入以下指令：

```powershell
powershell
cd "C:\path\to\malice-network-server"
.\malice-network-server.exe user add username
```

执行命令成功后，服务端会输出以下信息并在所处文件夹下生成对应用户配置文件：

![](assets/PmmUbFsfOoD4qnxKD2Uc6uP5n5f.png)

![](assets/YO45bNucEoDOtsxjNzTcC6rJnHd.png)

用户配置文件中包含了以下信息：

`operator`: 客户端名称。

`lhost`：客户端所连接的服务器地址。

`lport`：客户端所连接的服务器端口号。

`type`：配置类型分为 client 和 listener，用户配置为 client。

`cacertificate`：服务端生成的 CA 证书，用于验证服务端的合法性。

`privatekey`：客户端的私钥，用于加密和解密数据。

`certificate`: 客户端的证书，用于向服务端证明客户端的合法性。

### 启动客户端

将生成的用户配置文件复制到 `Malice-Network` 客户端的所在位置。使用新的用户配置文件时，可以使用以下指令启动客户端：

```powershell
cd "C:\path\to\malice-network-client"
.\malice-network-client.exe .\username_host.yaml
```

执行命令后，客户端会自动使用新的客户配置文件与服务器连接，并将用户配置文件移动至客户端的用户配置文件夹 (Windows 下为 `C:\Users\user\.config\malice\configs`,MacOS X 为 `/home/username/.config/malice/configs`，Linux 为 `/Users/username/.config/malice/configs`）

客户端登录成功后会输出以下信息：

![](assets/NI55beE9Bo6ad5xtT3lcMuvunAd.png)

下次登录后，客户端会自动显示在用户配置文件夹下所有的用户配置，根据需求，选择对应的用户进行选择。Linux 端使用命令启动 **Malice-Network** 客户端，Windows 和 MacOS X 可以双击 **Malice-Network** 客户端可执行文件启动客户端。

a. 对于 Linux：

```bash
bash
cd \path\to\malice-network-client
.\malice-network-client
```

b. 对于 MacOS X：

c. 对于 Windows：

i. 导航到 Malice-Network 文件夹。

ii. 双击 `malice-network-client.exe`。

![](assets/EEgKb86iwop9xaxBUt8cHZG9n8f.png)

## 编译
自行编译

### 编译client

```
go generate ./client
go mod tidy
go build ./client/
```

### 编译server

```
go generate ./client
go mod tidy
go build ./server/cmd/server
```

### 编译listener
```
go generate ./client
go mod tidy
go build ./server/cmd/listener
```

### 编译 Implant

请参阅 [Implant](implant.md) 中 compile 部分