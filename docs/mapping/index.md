## overview 

**本文档为预览文档. 预计在2024年内发布**  

mapping 是一个面向红队的攻击面管理平台(ASM). 也是chainreactor计划中的终极目标. 随着工具链的成熟, 终于可以重构两年前的那套demo. 将其变为当之无愧的ASM.

mapping不是不同工具的堆积, 而是达到临界质量的链式反应。



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

1. [设计理念](/wiki/mapping/design.md)