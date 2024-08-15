---
title: rem · index
---

## overview 

**本文档为预览文档. 预计在2024年内发布**   

rem 是一个解决全场景流量操作的万能工具, 将提供全场景的Tunnel(流量隧道), Proxy(代理), Pivoting(跳板), Forward(转发)解决方案. 

rem将作为所有工具的集中点, 除了最基本的cli外, 还将提供一套SDK以供各种工具交互. 用来打通各种工件([gogo](/wiki/gogo/), [zombie](/wiki/zombie/), [spray](/wiki/spray)), ASM([mapping](/wiki/mapping)), C2([IoM](/wiki/IoM/))直接的通信问题. 

rem可以让工件们不落地, 可以让mapping从EASM接入到内网, 可以让C2使用各种流量规避以及安全的信道传输数据. 



!!! example "Features."

    * 全平台兼容
    * 正向代理与反向代理
    * 正向端口转发与反向端口转发
    * 本地正向端口转发与本地反向端口转发(cobaltstrike中的rportfwd_local)]
    * 多种协议的多级代理支持, socks,http,neoreg等
    * 级联
    * 流量特征自定义与加密方式自定义
    * 多信道支持, udp,tcp,icmp,websocket,wireguard等

## 目录

1. [设计目标](/wiki/rem/design.md)