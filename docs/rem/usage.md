## Usage

```
Usage:
  C:\Users\Hunter\AppData\Local\Temp\go-build3142230917\b001\exe\rem.exe
        WIKI: https://chainreactors.github.io/wiki/rem

        QUICKSTART:
                serving:
                        ./rem

                reverse socks5 proxy:
                        ./rem -c [link]

                serve socks5 proxy on client:
                        ./rem -c [link] -m proxy

                remote port forward:
                        ./rem -c [link] -l port://:8080

                local port forward:
                        ./rem -c [link] -r port://:8080



Main Options:
  -c, --console=        console address
  -l, --local=          local address
  -r, --remote=         remote address
  -d, --destination=    destination agent id
  -x, --proxy=          outbound proxy chain
  -f, --forward=        proxy chain for connect to console
  -m, --mod=            rem mod, reverse/proxy/bind
  -n, --connect-only    only connect to console

Miscellaneous Options:
  -k, --key=            key for encrypt
  -a, --alias=          alias
      --version         show version
      --debug           debug mode
      --detail          show detail
      --quiet           quiet mode
      --dump            dump data

Config Options:
  -i, --ip=             console external ip address
      --retry=          retry times (default: 10)
      --retry-interval= retry interval (default: 10)
      --sub=            subscribe address (default: http://0.0.0.0:29999)
      --no-sub          disable subscribe

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
# 仅指定host, 自动补全其他参数
127.0.0.1
```

## 参数解释

当两个 rem 建立连接, 实际上就虚拟了一个传输层网络. 我们可以在这个网络上实现自由转发数据构造上层应用.

rem 提供了三种工作模式, 分别是:

- reverse(默认) , 建立连接后 inbound 在 server 端, 会在 server 上监听来自端口接收数据
- proxy, 建立连接后 inbound 在 client 端, 会在 client 上监听端口接收数据
- bind, 简单工作模式, 不需要两个 rem 建立连接

每个 agent 进程在逻辑上行可以承载任意多个隧道, 自动根据 rem 之间建立的传输层信道链接复用. 为了命令操作方便, 一般情况下, 我们通过一行命令描述一个服务.

### Console

Console当前支持的传输层

- tcp 默认启用
- udp (arq 协议: kcp) 默认启用
- icmp (arq 协议: kcp)
- unix , windows 上基于命名管道(SMB)实现, 非 unix 系统基于文件实现
- websocket
- wireguard
- http (通过单工信道模拟, arq 协议 kcp)
- memory 本进程中使用的虚拟信道

完整示例: 
```
./rem -c [transport]://[key]:@[host]:[port]?wrapper=[]&tls=[bool]&tlsintls=[bool]&compress=[bool]
```

**每个`[]`都表示可选项, 所有参都可留空**， 最简表达为搭建tcp协议的rem console， 随机加密方式。


参数解释:

- transport:  传输层，默认为tcp 
- key: 配置加密密钥， 留空自动使用默认值
- host: host留空或者为0.0.0.0 时表示监听rem console 服务, 其他值则为指定domain/ip的rem console
- port: console 端口
- wrapper: 留空自动生成随机加密方式， 特殊值`raw`不启用任何加密方式
- tls: 自动生成tls配置，并打开tls通讯，默认不启用
- tlsintls，默认不启用

### Local && Remote

rem 通过-l与-r 描述所有的应用层常见， 通过-m描述流量方向。 

**三种mod:**

- reverse (默认值), 表示流量入口在server， 会在server监听一个服务
- proxy , 表示流量入口在client， 会在client监听一个服务
- bind , 单机模式, 搭建普通的http/socks5代理

**应用层协议** 

- socks5 (默认启用)
- http/https (默认启用)
- port forward (默认启用)
- trojan
- shadowsocks

通过组合remote, local , mod 即可实现各种应用场景。


todo: 有一些参数有特殊的配置, 正在补充

### Forward

转发器,  用作 client 连接 server 时需要跨过的流量节点.

例如 client 连接 server 的时候可以通过多级代理, 常见于不出网内网但存在一个 http/socks5 代理让部分应用能够出网.

fowardd flag为`-f`/`forward`

`./rem -c [link] -f socks5://192.168.1.1:1080 -f http://192.168.2.2:1081`

使用场景：

目标网络环境不出网， 但是给必须出网的应用配置了内部的 http 代理（192.168.2.2）， 并且限制了白名单 ip（192.168.1.1）访问内网出网代理。

先通过 192.168.1.1 绕过白名单限制， 再通过出网代理建立代理

proxyclient的配置请见: https://chainreactors.github.io/wiki/libs/proxyclient/
### Outbound Proxy

outbound会在某一端对外发起请求,  这个请求同样支持代理链。

例如反向代理场景， 内网存在一个socks5代理跳板. 可以通过配置outbound proxy实现简单多级反向代理。

outbound proxy的flag为`-x` / `--proxy`

```
./rem -c [rem_link] -r socks5://:10080 -x socks5://10.1.1.1:1080
```

proxyclient的配置请见: https://chainreactors.github.io/wiki/libs/proxyclient/
### 多级网络

级联分为多个细分场景， 实际上是极为复杂的。 也收到了较多对级联比较迷惑的反馈。

#### 场景1 桥接

假设有内网服务器A，内网服务器B ， A与B位于不同的内网中， 有A与B都能访问到的服务器C

目的是打通A与B的网络，这个场景有点类似Cobaltstrike的rportfwd_local， 需要将目标服务器的某端口转发到本地。 但是rem可以更进一步， 直接进行代理而不是端口转发。 

我们通过服务器C作为桥， 打通A与B的内网。


user -[单向访问]-> console <-[单向访问]- client

rem 的桥接通过 -d/--destination 实现

每个连接对都会有唯一 ID, 也可以使用 alias(通过-a/--alias 自定义)

服务器C 启动 rem

```
./rem
```

内网A 连接到 C

如果不填 alias,则是自动分配的 ip:port

```
./rem -c [link] -a internal
```

内网B连接到 C

将会在内网A监听一个 socks5 端口, 通过该端口可以直接访问到 A所在的内网. 

```
./rem -c [link]  -d internal
``` 

具体用法与非级联场景完全一致

**将在 A 监听 socks5 端口, 通过该端口可以直接访问到 B 所在的内网.**

```
./rem -c [link] -d internal
```

**将在B 监听socks5端口， 通过该端口可以直接访问到A所在的内网**

```
./rem -c [link] -d internal -m proxy
```

**将 B 的 12345 端口转发到 A 的随机生成的端口**
```
./rem -c [link] -d internal -l port://:12345
```

**将会将 A 的 8888 端口转发到 B 的随机生成的端口**
```
./rem -c [link]  -d internal -r :1234 -m proxy
```
  
####  场景2 级联

假设有内网服务器A，可出网， 能访问到公网服务器C； 有内网服务器B， 可以访问到内网服务器A，但不出网访问不到公网服务器C

如果想搭建一个多级的代理， 让C服务器上搭建的socks5服务能直通最内层的服务器B。 可以按照如下操作

服务器C 启动 rem

```
./rem
```

服务器A上启动端口转发, 将C上的rem console的端口转发到本地的1234端口

```
./rem -c [link] -m proxy -r raw://:34996 -l port://:1234
```


在服务器B上搭建级联的反向代理

需要注意的是， rem的console的端口已经被转发到A上， 所以**需要修改address为A上转发后的端口， 其他参数保持不变**

```
./rem -c tcp://[A ip]:[port]/?wrapper=.......
```

!!! danger "场景2仅支持服务器B能访问到服务器A的情况下"
	如果是服务器A能访问到更内层服务器B， 而B无法访问到位于网络边界的服务器A， 可以使用另一种方式


#### 场景3 内网单向连通的级联


假设有内网服务器A，可出网， 能访问到公网服务器C； 有内网服务器B， 可以访问到内网服务器A，但不出网访问不到公网服务器C。 **服务器A能访问到更内层服务器B， 而B无法访问到位于网络边界的服务器A**

!!! tips "此思路也用于复现已存在的跨ACL代理实现级联"


服务器C 启动 rem

```
./rem
```

服务器B启动 socks5代理

```
./rem -m bind  -l socks5://:12345
```

服务器A通过outbound proxy 实现级联

```
./rem -c [link] -f socks5://remno1:0onmer@[B]:12345
```

!!! danger "服务器A与服务器B的通讯为明文的socks5"
	可能存在被检测的风险。可以通过rem代替socks作为代理服务器

### 特殊场景

#### 域前置

域前置需要依赖阿里云、腾讯云、cloudflare等云服务提供商。 本质上并无不同， 我以cloudflare举例。

**配置cloudflare**

添加一个域名后， 添加一个示例的子域名 `rem` , IP 为rem 实际部署的服务器IP。

![](assets/Pasted%20image%2020250615145125.png)

**打开rem服务**

因为rem的http是半双工模拟的双工信道， 存在性能上的问题。 我们可以使用websocket作为更加高效而稳定的双工信道。 

!!! tips "rem默认release中不包含websocket信道， 需要自行编译"
	可参考[编译文档](#build)
	
	`sh build.sh -t ws` 

![](assets/Pasted%20image%2020250615145049.png)
**配置nginx**

我们通过nginx反向代理管理相关的rem的实际服务。

```
server {
    listen 8080;

    # 匹配所有路径，全部代理到 WebSocket
    location / {
        proxy_pass http://127.0.0.1:12355;  # 后端 WebSocket 服务地址
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        # 长连接超时设置
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

!!! tips "cloudflare默认的代理端口"
	- 80
	- 443
	- 8080
	- 8443
	- ...

**客户端连接**

客户端修改host为域名，port为nginx上设置的端口

![](assets/Pasted%20image%2020250615150938.png)

!!! danger "国内云服务器注意备案问题"
	国内云服务商会检测cloudflare的入站流量。 强制要求域名备案
	![](assets/Pasted%20image%2020250615152542.png)
#### 内网代理出网

#### 白名单HOST出网

#### 特定业务出网
## Clash订阅

默认情况下, 会自动自动打开clash订阅服务。 


![](assets/Pasted%20image%2020250415084713.png)

自动根据常见内网生成配置

```yaml
proxies:
    - name: Sangfor-c0e9550e127fd067
      type: socks5
      server: 127.0.0.1
      port: 10086
      udp: true
      tls: false
      skip-cert-verify: true
mode: rule
rules:
    - IP-CIDR,10.0.0.0/8,10_NET
    - IP-CIDR,172.16.0.0/12,172_NET
    - IP-CIDR,192.168.0.0/16,192_NET
    - IP-CIDR,10.0.0.1/24,LOCAL_NET
    - MATCH,DIRECT
proxy-groups:
    - name: 10_NET
      type: select
      proxies:
        - Sangfor-c0e9550e127fd067
        - DIRECT
    - name: 172_NET
      type: select
      proxies:
        - Sangfor-c0e9550e127fd067
        - DIRECT
    - name: 192_NET
      type: select
      proxies:
        - Sangfor-c0e9550e127fd067
        - DIRECT
    - name: LOCAL_NET
      type: select
      proxies:
        - Sangfor-c0e9550e127fd067
        - DIRECT
```

可以通过`-sub http://0.0.0.0:12345/abcd` 指定clash订阅链接

可以通过 `--no-sub` 关闭clash订阅
## Build 

自动发布的release中, 默认仅支持 tcp/udp的transport和socks4/socks5, http/https, port forward 的应用层协议。 

因此虽然实现了很多协议， 但是其他协议需要手动启用.

rem 提供了自动编译指定协议, 以及固定配置的编译脚本。

https://github.com/chainreactors/rem-community/blob/master/build.sh

参数: 

- -o 指定架构 , `-o linux/amd64`
- -t 指定传输层协议, `-t "tcp,udp,icmp"`
- -a 指定应用层协议, `-a "socks,http,trojan,shadowsocks"`

某些情况下, 我们希望预配置rem参数, 可以通过以下参数实现, 与rem原命令行一致

当前支持

- -m 
- -c 
- -r
- -l 

example:

`sh build.sh -o "windows/amd64" -t "tcp,udp"`

```
sh build.sh -c [rem_link] 
```

```
sh build.sh -t icmp -a socks5
```