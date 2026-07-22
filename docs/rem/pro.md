---
title: rem · Pro
---

# rem Pro 版本功能

> rem Pro 为 `advance` build tag 编译版本，包含若干社区版没有的高级信道、混淆和加密能力。本文仅描述能力范围，不含使用方法。

---

## 信道能力

rem 将传输信道抽象为三层：传输层（tunnel）、表示层（wrapper）、会话层（mux）。Pro 版在传输层和表示层分别扩展了社区版不具备的能力。

### Simplex 单工信道

社区版支持 tcp/udp/icmp/http 等主动发起的双工信道。Pro 版额外支持基于**云存储和云服务**的单工信道（Simplex），将存储操作模拟为通信信道。

Simplex 信道的特点：

- 上行和下行流量走不同的传输路径（可分离）
- 借助云服务的公信力，流量特征合法
- 天然穿透几乎所有防火墙（访问的是正规云服务域名）
- 基于 KCP ARQ 协议保证可靠性

**支持的 Simplex 后端**（各需对应 build tag）：

| 后端 | Build tag | 传输载体 | 适用场景 |
|-----|-----------|---------|---------|
| Aliyun OSS | `oss` | 对象存储文件 | 国内云环境 |
| Azure Blob | `azureblob` | Azure 存储 | 企业 Azure 环境 |
| OneDrive | `graph` | Microsoft Graph API | Office 365 环境 |
| SharePoint | `graph` | SharePoint 文件库 | 企业 SharePoint |
| DNS | `dns` | DNS TXT/NULL 记录 | 极端限制网络 |

Simplex 信道可与 ConnHub 组合，构造上行走 TCP、下行走 OSS 的非对称信道，彻底分离流量特征。

---

## TLS 能力

社区版支持标准 TLS 和 TLS-in-TLS，均直接使用 Go 标准库实现，TLS 指纹为 Go 默认值，可被指纹识别。

Pro 版在此基础上提供三种更高级的 TLS 能力：

### uTLS — TLS 指纹伪装

社区版 TLS 握手使用 Go 标准库默认 ClientHello，JA3 指纹固定且易被识别。

Pro 版通过 uTLS 库完全自定义 ClientHello：

- 密码套件顺序、TLS 扩展及其参数全部可控
- 内置多种浏览器指纹（Chrome 120、Firefox、Safari 等）
- 支持 uTLS-in-TLS（外层 uTLS + 内层 uTLS）
- 握手过程与真实浏览器行为不可区分

防御目标：JA3/JA3S 指纹检测、TLS 流量分类器。

### ShadowTLS — 握手伪装

ShadowTLS 将真实 TLS 握手前置于隧道流量之前：

- 客户端与指定目标站点完成真实 TLS 握手
- 握手后数据流切换为实际隧道
- 外部观察者看到的是完整合法的 TLS 会话（含服务端真实证书）
- 密码保护，防止主动探测

与 uTLS 的区别：uTLS 修改握手特征，ShadowTLS 借用真实服务的握手。ShadowTLS 防御主动探测（Active Probing），uTLS 防御被动指纹识别。

### REALITY — 无证书 TLS 伪装

REALITY 是最高级别的 TLS 伪装方案，源自 Xray 项目：

- 无需购买域名或证书
- 服务端借用第三方站点（如 Bing）完成 TLS 握手
- 客户端收到的是真实第三方站点的证书
- X25519 密钥交换，ShortID 验证区分合法客户端
- 流量特征与访问对应网站完全一致

防御目标：证书检测、主动探测、基于流量特征的国家级防火墙封锁。

---

## 加密与混淆能力

### Age 密钥交换

社区版使用预共享的对称密钥（通过 wrapper 配置）。Pro 版额外支持 Age 协议进行密钥交换：

- X25519 Diffie-Hellman 密钥协商
- ChaCha20-Poly1305 AEAD 认证加密
- 每次连接派生独立会话密钥
- 前向安全：历史会话密钥不可由当前密钥推算

与对称预共享密钥的对比：

| | 对称预共享（社区版） | Age 密钥交换（Pro） |
|--|----|----|
| 密钥协商 | 无，需带外分发 | 自动，运行时协商 |
| 前向安全 | 无 | 有 |
| 密钥泄露影响 | 历史流量全部暴露 | 仅当前会话 |
| 配置复杂度 | 低 | 低（自动） |

### FetchProxy MITM (Pro)

FetchProxy 是 rem 的 HTTP(S) 代理实现，社区版支持基本 HTTP CONNECT 代理。Pro 版额外支持服务端 MITM：

- 服务端解密 HTTPS 流量
- 自定义 CA 证书注入
- 流量审计、修改、重放
- 动态证书生成

此功能需要 `--full` 编译并在客户端安装自定义 CA 证书。

---

## ConnHub 多信道（社区版已支持）

ConnHub 是 rem 的多信道聚合机制，社区版即支持：

- 多个 `-c` URL 同时连接，构成信道池
- 支持 `random / fallback / round-robin` 负载均衡
- 一条信道断开后自动切换到其他信道
- 同一 agent 会话跨多个物理连接透明复用

```
[+] [connhub] attached channel full tcp-1
```

Pro 版在此基础上额外支持**定向信道**（Directional Channel）：

- 上行（upload）和下行（download）走独立的传输连接
- 典型组合：上行走 TCP，下行走 OSS/OneDrive Simplex 信道
- 上下行流量特征完全分离，难以关联

---

## 功能矩阵

| 维度 | 能力 | 社区版 | Pro |
|-----|-----|:------:|:---:|
| **信道** | TCP/UDP/ICMP/HTTP | 是 | 是 |
| | WebSocket | 需编译 | 需编译 |
| | WireGuard | 需编译 | 需编译 |
| | Simplex (OSS/OneDrive/DNS) | 否 | 需 tag |
| | Simplex 定向信道（上下行分离） | 否 | 是 |
| **TLS** | 标准 TLS / TLS-in-TLS | 是 | 是 |
| | uTLS 指纹伪装 | 否 | 是 |
| | ShadowTLS 握手伪装 | 否 | 是 |
| | REALITY | 否 | 是 |
| **加密** | 对称预共享密钥 | 是 | 是 |
| | Age 密钥交换 | 否 | 是 |
| **代理** | SOCKS5/HTTP 代理 | 是 | 是 |
| | FetchProxy HTTPS MITM | 否 | 是 |
| | Shadowsocks/Trojan | 需 `--full` | 需 `--full` |
| **ConnHub** | 多信道负载均衡 | 是 | 是 |
| | 定向信道（上下行分离） | 否 | 是 |

---

## 编译参数

```bash
# Community
./build.sh --full -o windows/amd64

# Pro
./build.sh --full --tags advance -o windows/amd64

# Pro + Simplex 扩展
./build.sh --full --tags advance,oss,graph,dns,azureblob -o windows/amd64

# Pro + 代码混淆（TinyGo + OLLVM）
./build.sh --tinygo --tags advance --ollvm
```
