---
title: rem · index
---

## overview 


rem 是一个解决全场景流量操作的万能工具, 将提供全场景的 Tunnel(流量隧道), Proxy(代理), Pivoting(跳板), Forward(转发)解决方案.

rem 将作为所有工具的集中点, 除了最基本的 cli 外, 还将提供一套 SDK 以供各种工具交互. 用来打通各种工件([gogo](/gogo/), [zombie](/zombie/), [spray](/spray)), ASM([mapping](/mapping)), C2([IoM](/IoM/))直接的通信问题.

rem 可以让工件们不落地, 可以让 mapping 从 EASM 接入到内网, 可以让 C2 使用各种流量规避以及安全的信道传输数据.

!!! example "Features."

    * 全平台兼容
    * 正向代理与反向代理
    * 正向端口转发与反向端口转发
    * 本地正向端口转发与本地反向端口转发(cobaltstrike中的rportfwd_local)]
    * 多种协议的多级代理支持, socks,http,neoreg等
    * 级联
    * 流量特征自定义与加密方式自定义
    * 多信道支持, udp,tcp,icmp,websocket,wireguard等
    * clash订阅支持

### release


rem : https://github.com/chainreactors/rem


高级特性 :

!!! example "Pro Features 🔒"

    **需要 `advance` build tag 编译**（Pro 版本专属）：
    
    * 🔒 Age 密钥交换 + AEAD 加密
    * 🔒 uTLS 指纹伪装（绕过 TLS 指纹识别）
    * 🔒 ShadowTLS 混淆（伪装 TLS 流量）
    * 🔒 REALITY 协议（Xray REALITY）

**Community 版本包含**：

    * ✅ 标准 TLS/TLS-in-TLS
    * ✅ 流量压缩
    * ✅ 所有基础传输层（tcp, udp, http, icmp）
    * ✅ 完整代理与端口转发功能

**编译 Pro 版本**：
```bash
./build.sh --full --tags advance -o windows/amd64
```


