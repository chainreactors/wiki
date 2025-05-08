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


community: https://github.com/chainreactors/rem-community  

**community 在主体功能上与professional完全一致, 仅在对抗上有区别**

professional: https://github.com/chainreactors/rem/ (不对外开放，接受定制化开发)

professinal feature:

!!! example "Features."

    * 密码学前向与后向安全
    * 上行流量与下行流量特征自定义
    * tls特性: shadowtls, utls, reality 
    * lolc2


