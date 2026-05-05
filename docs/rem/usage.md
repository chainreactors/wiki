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
	rem 支持 socks5,http,trojan,shadowsocks 等协议, 可以指定任意协议, 具体请见[文件:应用层](#local-remote)

	`./rem -c [link] -r ss://`

### 正向代理

与反向代理相反, 可以在 client 上搭建 socks5 服务， 访问 server 所在的网络

`./rem -c [link] -m proxy`  
![image-20241216183149941](assets/image-20241216183149941.png)

!!! tips "工作模式"
	`-m` 表示工作模式, 请见 [文档:参数解释](#参数解释)
	
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

多级网络的核心不是“命令很多”，而是先判断**谁能主动访问谁**，再选择对应链路方式。

下面统一使用三个角色：

- `C`：公网/边界侧 `rem console`
- `A`：中间跳板（通常可出网）
- `B`：更内层主机（通常限制更多）

| 场景 | 主动连通关系 | 目标 | 关键参数/方式 |
| --- | --- | --- | --- |
| 场景1：桥接 | `A -> C` 且 `B -> C` | 打通 A/B 两个内网 | `-d` + `-a` |
| 场景2：级联 | `B -> A` 且 `A -> C` | 让 C 侧代理直达 B | A 转发 console 端口 |
| 场景3：单向级联 | `A -> B` 且 `A -> C` | B 不能回连时完成级联 | B `bind` + A `-f` |

#### 场景1：桥接（A 与 B 都能连到 C）

```mermaid
flowchart LR
    U[User] --> C[服务器 C<br/>rem console]
    A[内网 A] --> C
    B[内网 B] --> C
    B -. 使用 -d internal 指向 A .-> A
```

思路：先让 `A` 注册一个可识别别名，再让 `B` 通过 `-d` 指向该别名建立桥接。

1) 在 `C` 启动 console

```bash
./rem
```

2) 在 `A` 连接 `C` 并设置别名（示例：`internal`）

```bash
./rem -c [link] -a internal
```

3) 在 `B` 连接 `C` 并指向 `A`

```bash
./rem -c [link] -d internal
```

桥接建立后，常见用法：

- 在 `A` 监听 socks5，访问 `B` 内网（默认 `reverse`）

```bash
./rem -c [link] -d internal
```

- 在 `B` 监听 socks5，访问 `A` 内网（`proxy`）

```bash
./rem -c [link] -d internal -m proxy
```

- 将 `B:12345` 转发到 `A` 的随机端口

```bash
./rem -c [link] -d internal -l port://:12345
```

- 将 `A:1234` 转发到 `B` 的随机端口

```bash
./rem -c [link] -d internal -r :1234 -m proxy
```

#### 场景2：级联（B 能访问 A，A 能访问 C）

```mermaid
flowchart LR
    U[User] --> C[服务器 C<br/>rem console]
    A[服务器 A<br/>中间跳板] --> C
    B[服务器 B<br/>内层主机] --> A
    B -. 不能直接访问 .-> C
```

目标：让 `C` 上暴露的代理能力最终到达更内层 `B`。

1) 在 `C` 启动 console

```bash
./rem
```

2) 在 `A` 上做端口转发（把 `C` 的 console 端口转发到 `A:1234`）

```bash
./rem -c [link] -m proxy -r raw://:34996 -l port://:1234
```

3) 在 `B` 上连接 `A` 的转发端口完成级联

```bash
./rem -c tcp://[A ip]:[port]/?wrapper=.......
```

!!! warning "关键点"
    `B` 侧 `-c` 地址不再是 `C`，而是 `A` 上转发后的地址与端口；其余参数（如 key/wrapper）与原链接保持一致。

!!! danger "适用边界"
    该方案仅适用于 `B -> A` 可达。若只有 `A -> B` 可达，请使用场景3。

#### 场景3：内网单向连通级联（A 能访问 B，B 不能访问 A）

```mermaid
flowchart LR
    U[User] --> C[服务器 C<br/>rem console]
    A[服务器 A<br/>边界主机] --> C
    A --> B[服务器 B<br/>内层主机]
    B -. 无法回连 A .-> A
```

目标：在“仅单向可达”的内网中继续完成链路拼接。

1) 在 `C` 启动 console

```bash
./rem
```

2) 在 `B` 启动本地 socks5（`bind` 单机模式）

```bash
./rem -m bind -l socks5://:12345
```

3) 在 `A` 连接 `C` 时使用 `-f` 经由 `B` 的 socks5 级联

```bash
./rem -c [link] -f socks5://remno1:0onmer@[B]:12345
```

!!! tips "跨 ACL 场景"
    该思路可用于复现已有跨 ACL 的代理链路。

!!! danger "安全提示"
    `A` 与 `B` 间若直接使用明文 socks5，可能存在被检测风险。可用 rem 再套一层隧道降低暴露面。

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
	
	`sh build.sh -t websocket` 

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
  
rem 提供了灵活的构建系统，支持多种构建模式和目标平台。  
  
### 快速开始  
  
```bash  
# 编译默认版本（基础模块，多平台）  
./build.sh  
  
# 编译完整版本（包含所有模块，多平台）  
./build.sh --full  
  
# 编译自定义平台版本  
./build.sh --full -o "windows/amd64,linux/amd64,darwin/amd64"  
```  
  
### 构建参数  
  
#### 基础参数  

- `-m MOD`: 设置默认模式  
- `-c CONSOLE`: 设置默认控制台地址  
- `-l LOCAL`: 设置默认本地地址  
- `-r REMOTE`: 设置默认远程地址  
- `-o OSARCH`: 指定目标平台，格式：`os/arch`，多个平台用逗号分隔（默认：`windows/amd64,windows/386,linux/amd64,linux/arm64,darwin/amd64,darwin/arm64`）  
- `-a APPLICATION`: 指定应用模块，多个模块用逗号分隔  
- `-t TRANSPORT`: 指定传输模块，多个模块用逗号分隔  
- `-g`: 只生成配置文件，不进行编译  
- `--full`: 使用完整模块配置  
- `-buildmode MODE`: 指定构建模式  
- `-h, --help`: 显示帮助信息  
  
#### 构建模式  

- `exe`: 默认可执行文件（使用 gox 进行交叉编译，CGO_ENABLED=0）  
- `c-shared`: 动态链接库（.dll/.so，CGO_ENABLED=1）  
- `c-archive`: 静态链接库（.a，CGO_ENABLED=1）  
  
### 模块配置  
  
#### 默认模块  

- **应用模块**: `http,raw,socks,portforward`  
- **传输模块**: `tcp,udp`  
  
#### 完整模块（--full）  

- **应用模块**: `http,raw,socks,portforward,shadowsocks,trojan`  
- **传输模块**: `tcp,udp,websocket,unix,icmp,http,memory`  
  
### 使用场景  
  
#### 默认模式  
  
```bash  
# 编译多平台版本用于开发调试  
./build.sh  
  
# 只生成配置文件，检查模块配置  
./build.sh --full -g  
```  
  
#### 完整模式  
  
```bash  
# 编译生产版本（完整功能，默认多平台）  
./build.sh --full  
  
# 编译自定义平台生产版本  
./build.sh --full -o "windows/amd64,linux/amd64,darwin/amd64"  
```  
  
#### 自定义模块  
  
```bash  
# 只编译 HTTP 和 SOCKS 代理功能  
./build.sh -a "http,socks" -t "tcp,websocket"  
  
# 编译特定平台的自定义版本  
./build.sh -a "http,socks" -t "tcp,udp" -o "linux/amd64"  
```  
  
#### 库文件编译  
  
```bash  
# 编译动态链接库  
./build.sh --full -buildmode c-shared -o "windows/amd64,linux/amd64"  
# 输出: dist/lib/rem_community_windows_amd64.dll, dist/lib/rem_community_linux_amd64.so  
  
# 编译静态链接库  
./build.sh --full -buildmode c-archive -o "windows/amd64,linux/amd64"  
# 输出: dist/lib/librem_community_windows_amd64.a, dist/lib/librem_community_linux_amd64.a  
  
# 编译本地平台库文件  
./build.sh --full -buildmode c-shared  
# 输出: dist/lib/rem_community_<local_os>_<local_arch>.<ext>  
```  
  
