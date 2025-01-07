## Usage

```
Usage:
  rem

Miscellaneous Options:
  -k, --key=            key for encrypt
  -a, --alias=          alias
      --version         show version
      --debug           debug mode
      --detail          show detail
      --quiet           quiet mode

Main Options:
  -c, --console=        console address (default: tcp://0.0.0.0:34996)
  -l, --local=          local address
  -r, --remote=         remote address
  -d, --destination=    destination agent id
  -x, --proxy=          outbound proxy chain
  -f, --forward=        proxy chain for connect to console
  -m, --mod=            rem mod, reverse/proxy/bind (default: default)

Config Options:
  -i, --ip=             console external ip address
      --tls             enable tls
      --retry=          retry times (default: 10)
      --retry-interval= retry interval (default: 10)
      --sub=            subscribe address (default: http://0.0.0.0:29999)

Help Options:
  -h, --help            Show this help message
```

## QuickStart

命令行设计能简则简, `{}`中的内容为可省略的参数

rem 需要在被 client 与 user 都能访问到的一台机器上搭建一个对外暴露的中心服务器.

值得一提的是, 这个 console 并非实际意义上的 server, 而只是代理链路中平等的一环.

不需要任何参数启动的 rem 会自动生成连接链接与订阅链接

```
./rem
```

![image-20241216182132544](assets/image-20241216182132544.png)

!!! tips "-i 可手动指定对外暴露的ip"
	这里的-i 可不填, 会自动尝试通过 ipip 获取外网 ip

每次启动都会生成随机的密钥以及各种加密混淆配置, 所以需要复制这里生成的配置连接, 用来在对端连接使用

### 反向代理

rem 默认的模式即为反向代理, 并会在 server 上启动 socks5 代理

```
./rem -c [link] {-r socks5://user:pass@0.0.0.0:12345}
```

!!! tips "极简参数"
	`{}`中的内容为可省略的参数
	
	这行命令可以缩写为
	
	`./rem -c [link]`

![image-20241216182737400](assets/image-20241216182737400.png)

这个场景类似 frp 的 socks5 插件

client 通过 rem 支持的任意一种信道能连接到外网即可建立连接, 并在 server 端建立 socks5 服务.

user 位于外网, 通过 socks5 服务即可访问 client 所在的网络.

!!! tips "对外暴露不同的协议"
	rem 支持 socks5,http,trojan,shadowsocks 等协议, 可以指定任意协议, 具体请见[文件:应用层](#_6)
	
	`./rem -c [link] -r ss://`

### 正向代理

与反向代理相反, 可以在 client 上搭建 socks5 服务， 访问 server 所在的网络

`./rem -c [link] -m proxy`  
![image-20241216183149941](assets/image-20241216183149941.png)

!!! tips "工作模式"
	`-m` 表示工作模式, 请见 [文档:传输层](##transport)
	
	`-m reverse` 表示 inbound 位于 server 端
	
	`-m proxy` 表示 inbound 位于 client 端

这个场景中 user 位于内网, client 通过 rem 支持的任意一种信道能连接到外网即可建立连接, 并在 client 端打开 socks5 服务.

user 可以通过 client 上监听的 socks5 服务实现出网, 访问 server 能访问到的网络. 在一些有各种限制的不出网场景中常用.

### 远程端口转发

server 会监听一个端口, 访问该端口的流量都会转发到 client 的指定端口

`./rem -c [link] -l port://:8000 `  
![image-20241217004325283](assets/image-20241217004325283.png)

!!! important "-l 与-r"
	一般来说, 这两个参数会在 client 端使用, 用来描述用户层协议.
	
	`-r` 表示 remote, 即 server 端.
	
	`-l` 表示 local, 即 client(自身)端
	
	通过这两个参数的组合, 可以构造出任意想要的应用层功能

默认情况下, 未描述`-r` 会使用随机生成的端口. 也可以手动指定 server 的端口

```
./rem -c [link] -r :12345 -l port://:8000
```

等价于 ssh 的`ssh -R 12345:localhost:8000 user@ip`

`-l` 的 host 留空表示 127.0.0.1. 可以指定 client 内网 ip

```
./rem -c [link] -l port://[internal_ip]:8000
```

### 本地端口转发

与远程端口转发相反, client 监听一个端口, 访问该端口的流量会转发到 server 的指定端口

`./rem -c [link] -r port://:8000 -m proxy`

### url 缩写

rem 中的 url 可以使用各种缩写表示默认值, 下面是一些常用的示例.

```bash
#socks5代理
socks5://:10086
```

```bash
# 只保留协议
ss://
```

```bash
# 指定端口
:12345
```

```
# 指定host
127.0.0.1
```

## 传输层

当两个 rem 建立连接, 实际上就虚拟了一个传输层网络. 我们可以在这个网络上实现自由转发数据构造上层应用.

rem 提供了三种工作模式, 分别是:

- reverse(默认) , 建立连接后 inbound 在 server 端, 会在 server 上监听来自端口接收数据
- proxy, 建立连接后 inbound 在 client 端, 会在 client 上监听端口接收数据
- bind, 简单工作模式, 不需要两个 rem 建立连接

每个 agent 进程在逻辑上行可以承载任意多个隧道, 自动根据 rem 之间建立的传输层信道链接复用. 为了命令操作方便, 一般情况下, 我们通过一行命令描述一个服务.

### transport

当前支持的传输层

- tcp
- udp (arq 协议: kcp)
- icmp (arq 协议: kcp)
- unix , windows 上基于命名管道实现, 非 unix 系统基于文件实现
- websocket
- http (通过单工信道模拟, arq 协议 kcp)
- memory 本进程中使用的虚拟信道

#### tcp

最稳定的最常用的信道， 也是 rem 的默认配置

server 端:

```
./rem
```

client 端:

```
./rem -c [link]
```

基于 tcp 搭建传输层， 对 server 端暴露 socks5 的反向代理

#### udp

#### icmp

#### uinx

#### websocket

#### http

#### memory

### wrapper

- xor
- aes
- padding

### 转发链 forward chain

转发器, 与代理器是相对应的概念. 用作 client 连接 server 时需要跨过的流量节点.

例如 client 连接 server 的时候可以通过多级代理, 常见于不出网内网但存在一个 http/socks5 代理让部分应用能够出网.

`./rem -c [link] -f socks5://192.168.1.1:1080 -f http://192.168.2.2:1081`

使用场景：

目标网络环境不出网， 但是给必须出网的应用配置了内部的 http 代理（192.168.2.2）， 并且限制了白名单 ip（192.168.1.1）访问内网出网代理。

先通过 192.168.1.1 绕过白名单限制， 再通过出网代理建立代理

### 级联 redirecter

user <-> console <-[网络隔离]-> client

rem 的级联实现通过 -d/--destination 实现

每个连接对都会有唯一 ID, 也可以使用 alias(通过-a/--alias 自定义)

console 启动 rem

`./rem`

client 连接到 console

`./rem -c [link] -a internal` , 如果不填 alias,则是系统分配的 ip:port

user 通过 console 访问 client.

`./rem -c [link]  -d internal` 将会在 client 监听一个 socks5 端口, 通过该端口可以直接访问到 user 所在的内网.

具体用法与非级联场景完全一致

本地反向代理: `./rem -c [link] -d internal` 将在 user 监听 socks5 端口, 通过该端口可以直接访问到 client 所在的内网.

本地端口转发: `./rem -c [link] -d internal -l port://:12345 ` 将会将 client 的 12345 端口转发到 user 的随机生成的端口

远程端口转发: `./rem -c [link]  -d internal -l :8888 -m proxy` 将会将 user 的 8888 端口转发到 client 的随机生成的端口

## 应用层

### 代理协议

- socks5
- trojan
- shadowsocks
- port forward
- http/https

### 代理链 proxy chain

代理链，表示对 outbound 配置的代理

可以将任何信道(一般是应用层代理)封装为 proxier, 例如最基本的 socks5, http, https 之外, 还可以将 neoreg(已实现), sou5 等

使用-x/--proxy , 当前支持

- socks4, socks4a, socks5
- http, https
- ssh
- shadowsocks
- rem
- memory
- neoreg(todo)
- suo5(todo)

使用场景:

控制了位于边界的 192 网段内的服务， 需要访问三层代理后的专网内的服务。

`./rem -c [link] -x socks5://192.169.1.1:1080 -x http://172.16.1.1:1081 -x neoreg://10.0.0.1:1082`  
表示在服务器上打开 socks5 协议的反向代理. 通过这个反向代理对内网访问时，还会经过位于内网的任意层级代理链。

这里配置的表示出口流量先经过 192.169.1.1，172.16.1.1， 10.0.0.1 最终访问到位于层层内网之内的目标服务。

todo:

- 当前只支持 tcp 协议, udp 支持开发中
- 支持正向代理的 proxy
- 云函数代理
