## Usage

```
WIKI: https://chainreactors.github.io/wiki/rem

QUICKSTART:
    start server (listen on default address):
        ./rem -s tcp://0.0.0.0:34996

    or just (uses default server address):
        ./rem

    reverse socks5 proxy (client connects to server):
        ./rem -c [link]

    serve socks5 proxy on client:
        ./rem -c [link] -l socks5://:1080

    remote port forward (server listens):
        ./rem -c [link] -r port://:8080

    local port forward (client listens):
        ./rem -c [link] -l port://:8080

OPTIONS:
  Main Options:
    -s, --server <addr>           server listen address (repeatable)
    -c, --client <addr>           client connect address (repeatable)
    -l, --local <addr>            local address (repeatable)
    -r, --remote <addr>           remote address (repeatable)
    -a, --alias <name>            alias
    -d, --destination <id>        destination agent id
    -x, --proxy <url>             outbound proxy chain (repeatable)
    -f, --forward <url>           proxy chain for connect to console (repeatable)
    -b, --bind                    bind mode (standalone local proxy)
    -n, --connect-only            only connect to console

  Miscellaneous Options:
    -k, --key <key>               key for encrypt
        --version                 show version
        --debug                   debug mode
        --detail                  show detail
    -q, --quiet                   quiet mode
        --dump                    dump data
        --list                    list all registered tunnels, services and wrappers

  Config Options:
    -i, --ip <ip>                 console external ip address
        --lb <name>               connhub load balance: random/fallback/round-robin
        --sub <url>               subscribe address (default: http://0.0.0.0:29999)
        --no-sub                  disable subscribe

  Common URL Query:
    retry=<num>                   reconnect attempts (0=infinite, default: 0)
    retry-interval=<num>          reconnect interval seconds (default: 10)
    retry-max-interval=<num>      max backoff interval seconds (default: 300)
    lb=<name>                     load balance: random/fallback/round-robin

    -h, --help                    show help
```

## QuickStart

rem 在被 client 与 user 都能访问到的机器上作为 server 运行，client 主动连接到 server。

Server 每次启动都会随机生成加密 wrapper 配置，并输出连接链接，复制该链接在 client 端使用。

```
./rem
```

!!! tips "-i 可手动指定对外暴露的 IP"
    这里的 `-i` 可不填，会自动尝试通过 ipip 获取外网 IP

**实测输出示例**：
```
[*] inbound: remote , remote: socks5://remno1:0onmer@0.0.0.0:21658
[*] console: [tcp://nonenonenonenone:@0.0.0.0:34996]
[*] tcp channel starting with 42.120.103.63
[*] tcp://nonenonenonenone:@42.120.103.63:34996?wrapper=uCDBWU...（完整连接链接）
```

### 反向代理

rem 默认模式：client 连接后，在 **server 端**建立 socks5 代理，用户通过 server 访问 client 内网

```
./rem -c [link]
```

等价于（显式指定 server 端 socks5 端口）：

```
./rem -c [link] -r socks5://:10086
```

**实测输出**（client 端）：
```
[*] inbound: remote , remote: socks5://remno1:0onmer@0.0.0.0:22451
[*] [agent.outbound] relay serving
```

`inbound: remote` 表示服务监听在 server 端，server 自动监听随机端口。

!!! tips "对外暴露不同的协议"
    rem 支持 socks5、http 等协议，可以通过 `-r` 指定：

    `./rem -c [link] -r http://:8080`

### 正向代理

在 **client 端**建立 socks5 代理，用户通过 client 访问 server 所在的网络

```
./rem -c [link] -l socks5://:1080
```

**实测输出**：
```
[*] inbound: local , remote: raw://...:0 ,local socks5://...:1080
[*] [agent.inbound] Socks5 serving: socks5 1080 remno1 0onmer
```

`inbound: local` 表示服务监听在 client 端（本地端口 1080）。

常用于出网受限的内网环境：client 在内网，连接外网 server，本地开放代理供内网用户出网。

### 远程端口转发（Server 监听）

**server 端**监听端口，访问该端口的流量转发到 client 指定地址。等价于 SSH `-R`。

```
./rem -c [link] -r port://:8080
```

**实测输出**：
```
[*] inbound: remote , remote: port://...:8080 ,local raw://...:0
[*] [agent.outbound] relay serving
```

手动指定转发目标（client 端某个端口）：

```
./rem -c [link] -r port://:8080 -l :9090
```

### 本地端口转发（Client 监听）

**client 端**监听端口，访问该端口的流量转发到 server 指定地址。等价于 SSH `-L`。

```
./rem -c [link] -l port://:8001
```

**实测输出**：
```
[*] inbound: local , remote: raw://...:0 ,local port://...:8001
[*] [agent.inbound] portforward serving: 0.0.0.0:8001 -> 0.0.0.0:0
```

手动指定转发目标（server 端某个端口）：

```
./rem -c [link] -l port://:8001 -r :9001
```

!!! important "-l 与 -r 的语义"
    `-l` = **L**ocal，client 端地址，`-l port://:X` 表示 client 监听 X 端口

    `-r` = **R**emote，server 端地址，`-r port://:X` 表示 server 监听 X 端口

    inbound（服务入口）跟随地址所在端：哪端指定 `port://`，哪端就监听。

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

当两个 rem 建立连接，实际上就虚拟了一个传输层网络，可以在这个网络上自由转发数据。

**三种工作模式**（由 `-l`/`-r` 位置自动推断）：

- **inbound=remote（默认）**：inbound 在 server 端，server 监听并提供服务 → 仅指定 `-r` 或不指定任何地址
- **inbound=local**：inbound 在 client 端，client 监听并提供服务 → 仅指定 `-l`
- **bind（`-b`）**：单机模式，不连接 server，直接在本地提供代理

每个 agent 可承载任意多个隧道（通过多个 `-l`/`-r` 参数），自动复用传输层连接。

### Server / Client 地址

**Server 模式**（监听等待连接）：
```
./rem -s [transport]://[key]:@[host]:[port]?wrapper=[]&tls=[]&compress=[]
```

**Client 模式**（主动连接）：
```
./rem -c [transport]://[key]:@[host]:[port]?wrapper=[]
```

**每个 `[]` 都是可选项，留空使用默认值**。

URL 参数说明：

| 参数 | 说明 | 默认 |
|-----|------|------|
| `transport` | 传输层协议 | `tcp` |
| `key` | 加密密钥（用户名位置） | 自动使用默认值 |
| `host` | 地址（`0.0.0.0` 表示监听，其他为连接目标） | `0.0.0.0` |
| `port` | 端口 | `34996` |
| `wrapper` | 加密混淆配置（留空自动生成随机，`raw` 不加密） | 随机生成 |
| `tls` | 启用标准 TLS | 不启用 |
| `tlsintls` | 启用 TLS-in-TLS | 不启用 |
| `compress` | 启用流量压缩 | 不启用 |

**实测：默认传输层（默认编译版本）**

```bash
./rem --list
```
输出：
```
Tunnels (Dialers):
  - memory
  - simplex [onedrive, oss, azureblob, sharepoint]
  - tcp

Services (Inbound/Outbound):
  - forward
  - http
  - raw
  - socks5

Wrappers:
  - cryptor
  - padding
```

!!! tips "完整传输层需自行编译"
    默认编译包含 `tcp,udp,http,icmp`，`websocket,wireguard,unix` 等需要 `--full` 编译：
    
    `./build.sh --full -o windows/amd64`

### Local && Remote

rem 通过 `-l` 与 `-r` 描述应用层场景，inbound 侧由参数位置自动决定。

**流量方向规则**（实测确认）：

| 命令 | Inbound 侧 | 效果 |
|-----|-----------|------|
| 仅 `-r socks5://:X` 或不指定 | remote（server） | Server 监听 X，提供 socks5 代理 |
| 仅 `-l socks5://:X` | local（client） | Client 监听 X，提供 socks5 代理 |
| 仅 `-r port://:X` | remote（server） | Server 监听 X，流量转到 client |
| 仅 `-l port://:X` | local（client） | Client 监听 X，流量转到 server |
| `-l port://:X -r :Y` | local（client） | Client 监听 X，流量转到 server:Y |
| `-r port://:X -l :Y` | remote（server） | Server 监听 X，流量转到 client:Y |

**应用层协议（默认编译包含）**：

- `socks5`（默认）
- `http`
- `port`（端口转发）
- `raw`（透明转发）
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

- 在 `A` 监听 socks5，访问 `B` 内网（默认，inbound 在 server 端）

```bash
./rem -c [link] -d internal
```

- 在 `B` 监听 socks5，访问 `A` 内网（正向代理，client 端监听）

```bash
./rem -c [link] -d internal -l socks5://:1080
```

- 将 `B:12345` 转发到 `A` 的随机端口（远程端口转发，server 监听）

```bash
./rem -c [link] -d internal -r port://:12345
```

- 将 `A:1234` 转发到 `B` 的随机端口（本地端口转发，client 监听）

```bash
./rem -c [link] -d internal -l port://:1234
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

2) 在 `A` 上做端口转发（把 `C` 的 console 端口转发到 `A:1234`，client 端监听）

```bash
./rem -c [link] -l port://:1234 -r :34996
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

2) 在 `B` 启动本地 socks5（bind 单机模式，`-b`）

```bash
./rem -b -l socks5://:12345
```

3) 在 `A` 连接 `C` 时使用 `-f` 经由 `B` 的 socks5 级联

```bash
./rem -c [link] -f socks5://remno1:0onmer@[B]:12345
```

!!! tips "跨 ACL 场景"
    该思路可用于复现已有跨 ACL 的代理链路。

!!! danger "安全提示"
    `A` 与 `B` 间若直接使用明文 socks5，可能存在被检测风险。可用 rem 再套一层隧道降低暴露面。

#### 场景4：Relay 模式（透明中继）🆕

适用于：B 无法直接访问 C，但可访问 A；A 可访问 C。与场景2的区别：A 作为**透明中继**，不解密流量，加密端到端（C ↔ B）。

```mermaid
flowchart LR
    U[User] --> C[服务器 C<br/>rem console]
    A[服务器 A<br/>中继节点] --> C
    B[服务器 B<br/>内层主机] --> A
    B -. 使用 relay link .-> C
```

1) 在 `C` 启动 console

```bash
./rem -s tcp://0.0.0.0:34996
```

2) 在 `A` 同时连接上游 C 并监听下游（`-s` 和 `-c` 同时使用触发 relay 模式）

```bash
./rem -c [C_link] -s tcp://0.0.0.0:12345 -i [A的外网IP]
```

A 会输出 relay link（包含 `via` 参数）：
```
[relay] relay link: tcp://nonenonenonenone:@[A_IP]:12345?wrapper=...&via=[agentID]
```

3) 在 `B` 使用 relay link 连接（流量透过 A 直达 C）

```bash
./rem -c [relay_link]
```

!!! tips "Relay vs 级联的选择"
    - **Relay（透明中继）**：A 只转发字节，加密在 C-B 之间端到端，A 无法解密流量
    - **级联（场景2）**：A 需要解密重加密，有两次握手开销，但更灵活

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
# 编译默认版本（多平台）
./build.sh

# 编译完整版本（全模块，多平台）
./build.sh --full

# 指定单平台
./build.sh --full -o "windows/amd64"
```

### 构建参数

#### 编译时内嵌默认值

以下参数将默认值直接编入二进制，client 无需每次传参：

| 参数 | 说明 | 示例 |
|-----|------|------|
| `-s SERVER` | 内嵌默认 server 监听地址 | `-s tcp://0.0.0.0:34996` |
| `-c CLIENT` | 内嵌默认 client 连接地址 | `-c tcp://1.2.3.4:34996?wrapper=...` |
| `-l LOCAL` | 内嵌默认 local 地址 | `-l socks5://:1080` |
| `-r REMOTE` | 内嵌默认 remote 地址 | `-r port://:8080` |
| `-q` | 内嵌静默模式 | `-q` |

#### 模块选择

| 参数 | 说明 |
|-----|------|
| `-a APPLICATION` | 应用模块，逗号分隔 |
| `-t TRANSPORT` | 传输模块，逗号分隔 |
| `--full` | 使用完整模块配置 |
| `--tags TAGS` | 额外 build tags，逗号分隔 |

#### 目标平台与构建模式

| 参数 | 说明 |
|-----|------|
| `-o OSARCH` | 目标平台，逗号或空格分隔 |
| `-buildmode MODE` | 构建模式（见下表） |
| `-g` | 只生成模块配置文件，不编译 |

**构建模式**：

| 模式 | 说明 | CGO |
|-----|------|-----|
| `exe`（默认） | 可执行文件，gox 交叉编译 | 0 |
| `c-shared` | 动态链接库（.dll/.so） | 1 |
| `c-archive` | 静态链接库（.a） | 1 |
| `--tinygo` | TinyGo 极小体积可执行文件 | - |

#### 其他选项

| 参数 | 说明 |
|-----|------|
| `--tinygo` | 使用 TinyGo 编译（体积极小，Linux ~724KB） |
| `--ollvm` | 配合 `--tinygo`，启用 OLLVM 代码混淆（需 Docker） |
| `--clientui` | 快速打包单文件客户端 UI |
| `--webui` | 快速打包单文件 WebUI Server |
| `--chromeext` | 快速打包 Chrome 浏览器插件（unpacked） |

### 模块配置

**默认模块**（`./build.sh`）：

- 应用模块：`http, raw, socks, portforward`
- 传输模块：`tcp, udp, http, icmp`

**完整模块**（`./build.sh --full`）：

- 应用模块：`http, raw, socks, portforward, fetch, shadowsocks, trojan`
- 传输模块：`tcp, udp, websocket, unix, icmp, http, memory`

!!! tips "simplex 信道需独立 tag"
    OSS、OneDrive、AzureBlob、DNS 等 simplex 信道不包含在 `--full` 中，需通过 `--tags` 单独添加：

    `./build.sh --full --tags oss,graph,dns`

### 常用场景

#### Community 标准版

```bash
./build.sh --full -o "windows/amd64,linux/amd64,darwin/amd64"
```

#### Pro 版本（advance tag）

```bash
./build.sh --full --tags advance -o "windows/amd64,linux/amd64"
```

#### Pro + Simplex 扩展

```bash
./build.sh --full --tags advance,oss,graph,dns,azureblob
```

#### TinyGo 最小化版本

```bash
./build.sh --tinygo
```

#### TinyGo + OLLVM 混淆（需 Docker）

```bash
./build.sh --tinygo --ollvm -o linux/amd64
```

#### 内嵌默认连接地址（免配置 agent）

```bash
# 编译后 client 无需 -c 参数，直接运行即可连接
./build.sh --full -c "tcp://1.2.3.4:34996?wrapper=..." -o "linux/amd64"
```

#### 库文件（FFI/SDK 使用）

```bash
# 动态库
./build.sh --full -buildmode c-shared -o "windows/amd64,linux/amd64"
# 输出: dist/lib/rem_community_windows_amd64.dll

# 静态库
./build.sh --full -buildmode c-archive -o "linux/amd64"
# 输出: dist/lib/librem_community_linux_amd64.a
```

**默认目标平台**（不指定 `-o` 时）：
`windows/amd64, windows/386, linux/amd64, linux/arm64, linux/mips, linux/mipsle, linux/mips64, linux/mips64le, darwin/amd64, darwin/arm64`
