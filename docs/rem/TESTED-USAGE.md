# rem v0.3.0 实测用法文档

> 本文档基于 rem v0.3.0 实际编译测试验证，所有示例均已通过测试

## 快速开始

### 启动 Server

```bash
# 默认启动（监听 tcp://0.0.0.0:34996）
./rem

# 指定地址启动
./rem -s tcp://0.0.0.0:12345

# 指定外网 IP（用于生成正确的连接链接）
./rem -s tcp://0.0.0.0:34996 -i 42.120.103.63
```

**实际输出示例**：
```
[*] inbound: remote , remote: socks5://remno1:0onmer@0.0.0.0:21658 ,local raw://remno1:0onmer@0.0.0.0:0
[*] console: [tcp://nonenonenonenone:@0.0.0.0:34996]
[*] tcp channel starting with 42.120.103.63
[*] tcp://nonenonenonenone:@42.120.103.63:34996?wrapper=uCDBWU...（完整加密配置）
```

Server 启动后会：
1. 自动生成随机加密 wrapper
2. 输出连接链接（包含加密配置）
3. 默认在 remote（server）端等待 client 连接后提供 socks5 代理

---

## 核心参数说明

### Main Options

| 参数 | 说明 | 示例 |
|-----|------|------|
| `-s, --server <addr>` | Server 监听地址（可重复） | `-s tcp://0.0.0.0:34996` |
| `-c, --client <addr>` | Client 连接地址（可重复） | `-c tcp://server:34996?wrapper=...` |
| `-l, --local <addr>` | Local 地址（client 端，可重复） | `-l socks5://:1080` |
| `-r, --remote <addr>` | Remote 地址（server 端，可重复） | `-r socks5://:10086` |
| `-a, --alias <name>` | Agent 别名 | `-a mynode` |
| `-d, --destination <id>` | 目标 agent ID（桥接） | `-d internal` |
| `-b, --bind` | Bind 单机模式 | `-b -l socks5://:1080` |
| `-n, --connect-only` | 仅连接，不提供服务 | `-n` |

**重要变更**：
- ⚠️ `-m/--mode` 已废弃（legacy flag，被忽略）
- ✅ 使用 `-b/--bind` 替代原 `-m bind`
- ✅ `-s` 和 `-c` 区分 server/client 模式

---

## 代理模式

### 反向代理（默认）

**场景**：Server 端提供 socks5，Client 连接后用户通过 Server 访问 Client 内网

```bash
# Server 启动
./rem -s tcp://0.0.0.0:34996

# Client 连接（默认反向代理）
./rem -c [link]

# 或显式指定 server 端端口
./rem -c [link] -r socks5://:10086
```

**实测输出**（Client 端）：
```
[*] inbound: remote , remote: socks5://remno1:0onmer@0.0.0.0:22451 ,local raw://remno1:0onmer@0.0.0.0:0
[*] [agent.outbound] relay serving
```

- ✅ `inbound: remote` 表示 server 端提供服务
- ✅ Server 监听随机端口（这里是 22451）提供 socks5

---

### 正向代理

**场景**：Client 端提供 socks5，用户通过 Client 访问 Server 网络

```bash
# Client 连接并在本地监听
./rem -c [link] -l socks5://:1080
```

**实测输出**：
```
[*] inbound: local , remote: raw://...:0 ,local socks5://...:1080
[*] [agent.inbound] Socks5 serving: socks5 1080 remno1 0onmer
```

- ✅ `inbound: local` 表示 client 端提供服务
- ✅ Client 监听指定端口 1080

---

### Bind 单机模式

**场景**：不连接 server，本地直接提供代理

```bash
./rem -b -l socks5://:10088
```

**实测输出**：
```
[*] inbound: local , remote: raw://...:0 ,local socks5://...:10088
[*] [agent.outbound] Socks5 serving: socks5 42.120.103.63 10088 remno1 0onmer
```

- ✅ 无需 server，单机运行
- ✅ 适用于本地代理需求

---

## 端口转发

### ⚠️ 重要说明：端口转发语义

经实测确认：
- **`-l port://:8080`** → Client 监听 8080，流量转到 Server
- **`-r port://:8080`** → Server 监听 8080，流量转到 Client

**命名对应**：
- `-l` = Local（Client 端）
- `-r` = Remote（Server 端）

---

### 本地端口转发（Client 监听）

**场景**：Client 监听端口，流量转发到 Server

```bash
./rem -c [link] -l port://:8001
```

**实测输出**：
```
[*] inbound: local , remote: raw://...:0 ,local port://...:8001
[*] [agent.inbound] portforward serving: 0.0.0.0:8001 -> 0.0.0.0:0
```

- ✅ Client 监听 8001
- ✅ 访问 Client:8001 的流量转到 Server

**指定目标端口**：
```bash
./rem -c [link] -l port://:8001 -r :9001
```
→ Client 监听 8001，流量转到 Server:9001

---

### 远程端口转发（Server 监听）

**场景**：Server 监听端口，流量转发到 Client

```bash
./rem -c [link] -r port://:8002
```

**实测输出**：
```
[*] inbound: remote , remote: port://...:8002 ,local raw://...:0
[*] [agent.outbound] relay serving
```

- ✅ Server 监听 8002
- ✅ 访问 Server:8002 的流量转到 Client

**指定目标端口**：
```bash
./rem -c [link] -r port://:8002 -l :9002
```
→ Server 监听 8002，流量转到 Client:9002

---

## 高级功能

### 多服务同时启动（Extra Serves）

**新功能**：支持多个 `-l` 或 `-r` 参数，自动 fork 多个服务

```bash
./rem -c [link] -l socks5://:1080 -l port://:8080
```

**实测输出**：
```
[*] [agent.inbound] Socks5 serving: socks5 1080 remno1 0onmer
[*] [agent.inbound] portforward serving: 0.0.0.0:8080 -> 0.0.0.0:0
```

- ✅ 同时启动 socks5（1080）和 port forward（8080）
- ✅ 无需多次运行 rem

---

### Connect-Only 模式

**场景**：仅连接到 server，不提供任何服务（用于桥接/中继）

```bash
./rem -c [link] -a mynode -n
```

**实测输出**：
```
[*] inbound:  , remote: default://...:0 ,local default://...:0
```

- ✅ `inbound: (空)` 表示不提供服务
- ✅ 可用于建立桥接连接

---

### 别名（Alias）

**场景**：为 agent 设置可识别的名称（用于桥接/多级网络）

```bash
# Server 1 上
./rem -s tcp://0.0.0.0:34996

# Client A 连接并设置别名
./rem -c [link] -a internal

# Client B 通过别名桥接到 A
./rem -c [link] -d internal
```

---

## 查看已注册组件

```bash
./rem --list
```

**实测输出**：
```
=== Registered Components ===

Tunnels (Dialers):
  - memory
  - simplex [onedrive, oss, azureblob, sharepoint]
  - tcp

Tunnels (Listeners):
  - memory
  - simplex [oss, onedrive, azureblob, sharepoint]
  - tcp

Services (Inbound):
  - forward
  - http
  - raw
  - socks5

Services (Outbound):
  - forward
  - http
  - raw
  - socks5

Wrappers:
  - cryptor
  - padding
```

---

## URL Query 参数

### Console URL 支持的参数

| Query | 功能 | 示例 |
|-------|------|------|
| `wrapper=<base64>` | 指定加密混淆配置 | `?wrapper=uCDBWU...` |
| `compress=true` | 启用流量压缩 | `?compress=true` |
| `tls=true` | 启用 TLS | `?tls=true` |
| `tlsintls=true` | TLS-in-TLS | `?tlsintls=true` |
| `retry=<num>` | 重试次数（0=无限） | `?retry=10` |
| `retry-interval=<sec>` | 重试间隔 | `?retry-interval=10` |
| `retry-max-interval=<sec>` | 最大重试间隔 | `?retry-max-interval=300` |
| `lb=<algorithm>` | 负载均衡算法 | `?lb=random` |

**Pro 版本专属**（需 `advance` build tag）：
- `age=true`: Age 加密
- `utls=true`: uTLS 指纹伪装
- `shadowtls=<addr>&shadowtls-password=<pass>`: ShadowTLS
- `reality-dest=<addr>&reality-key=<hex>`: REALITY 协议

---

## Config Options（新增）

| 参数 | 功能 | 示例 |
|-----|------|------|
| `--lb <algorithm>` | 负载均衡算法 | `--lb random` |
| `--sub <url>` | Clash 订阅地址 | `--sub http://0.0.0.0:29999` |
| `--no-sub` | 禁用订阅服务 | `--no-sub` |
| `--fetchproxy-mitm` | 启用服务端 HTTPS MITM | `--fetchproxy-mitm` |
| `--fetchproxy-ca <path>` | MITM CA 证书 | `--fetchproxy-ca ca.crt` |
| `--fetchproxy-key <path>` | MITM CA 私钥 | `--fetchproxy-key ca.key` |

**负载均衡算法**：
- `random`: 随机选择
- `fallback`: 故障转移（默认）
- `round-robin`: 轮询

---

## 常见场景示例

### 场景 1：简单反向代理

```bash
# Server（公网）
./rem -s tcp://0.0.0.0:34996

# Client（内网）
./rem -c tcp://server_ip:34996?wrapper=...

# 用户通过 Server 的 socks5（随机端口）访问 Client 内网
```

---

### 场景 2：指定固定端口

```bash
# Server
./rem -s tcp://0.0.0.0:34996

# Client（指定 server 端 socks5 端口为 10086）
./rem -c [link] -r socks5://:10086
```

---

### 场景 3：Client 端代理（正向）

```bash
# Server
./rem -s tcp://0.0.0.0:34996

# Client（本地监听 1080）
./rem -c [link] -l socks5://:1080

# 用户通过 Client:1080 访问 Server 网络
```

---

### 场景 4：端口转发 - Web 服务暴露

```bash
# Server
./rem -s tcp://0.0.0.0:34996

# Client（将 Client 本地 80 端口暴露到 Server 8080）
./rem -c [link] -r port://:8080 -l :80

# 访问 Server:8080 → Client:80
```

---

### 场景 5：多服务混合

```bash
# Client 同时提供 socks5 和端口转发
./rem -c [link] -l socks5://:1080 -l port://:8080 -l port://:3389
```

---

## 已知差异与变更

### ⚠️ 与旧版本的重大变更

1. **参数变更**：
   - `-c` 原意为 console，现在是 client
   - 新增 `-s` 表示 server
   - `-m mode` 已废弃，使用 `-b` 替代 bind 模式

2. **端口转发语义**：
   - `-l` = Client 监听（本地端口转发）
   - `-r` = Server 监听（远程端口转发）
   - ⚠️ 旧文档中的描述是反的！

3. **默认行为**：
   - 默认 inbound 在 remote（server）端
   - 自动生成随机 wrapper 加密
   - 自动分配随机端口（除非显式指定）

---

## 测试环境

- **版本**：rem v0.3.0（从源码编译）
- **平台**：Windows amd64
- **Go**：1.26.1
- **测试日期**：2026-07-22
- **编译配置**：默认（tcp, udp, http, icmp, memory, simplex）

---

## 相关文档

- [概念说明](concept.md) - rem 架构和核心概念
- [设计文档](design.md) - 技术设计细节
- [更新日志](changelog.md) - 版本变更历史
- [文档审计报告](v0.3.0-doc-audit.md) - 文档与代码差异分析
