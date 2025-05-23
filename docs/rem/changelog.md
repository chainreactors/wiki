## roadmap

## stage 0

* [x] 正向端口转发, 将端口从本机转发到远程
* [x] 反向端口转发,  将端口从远程转发到本机
* [x] 正向代理, 搭建socks5/http代理
* [x] 反向代理, 通过服务器, 将流量代理至客户端. (rem中实际上并不一定有服务端与客户端之分, rem中可以将流量代理至任意节点)
* [x] 代理, 通过其他服务提供的代理协议, 例如socks5/http代理, 转发rem协议本身的流量
* [x] 转发, 通过其他服务提供的代理协议, 将出方向的流量转发到指定目标
* [x] 级联, 能通过rem自身的协议, 形成多级的节点的连接关系
* [x] 多级端口转发,  将端口从本机通过rem转发到任意rem网络中的节点
* [x] 多级代理转发, 将流量通过rem转发到任意rem网络中的节点
* [x] RPORTFWD_LOCAL, (多级端口转发的特例), 将本机的的端口通过rem转发至
* [x] PORTFWD_LOCAL,  (多级端口转发的特例), 将rem节点的端口转发至本机

特性:

* [x] 传输层, 支持TCP, UDP, ICMP, WIREGUARD等各种场景传输层协议
* [x] 加密层, TLS/MTLS或者任意自定义的加密协议
* [x] 混淆层, 模拟特定协议
* [x] 连接复用

## stage 1

- [x] 调整主体文件结构
- [x] 调整函数,文件,变量命名
- [x] 重构代理逻辑
- [x] 代码解耦
- [x] 重构monitor与流量控制
- [x] 重新设计cli ui
- [x] 支持rportfwd
- [x] 重新设计msg
- [x] 重新设计wrapper
- [x] 支持neoregeorg, 将半双工信道升级为全双工
- [x] 支持云函数, cdn等
- [x] 支持配置任意数量的多级透明socks5/socks4a/socks4/http/https代理
- [x] 支持tls协议 (working)
- [x] 支持级联 (working)
- [ ] 支持端口复用(搁置)
- [ ] 支持端口敲门(搁置)
- [x] RPORTFWD_LOCAL与PORTFWD_LOCAL
- [x] 重构proxyclient
- [x] 支持clash订阅
- [x] 支持shadow-tls
- [x] 支持对外暴露多种类型的协议
  - [x] socks5
  - [x] http/https
  - [x] trojan
  - [x] v2ray

**高级功能**

- [x] Proxy as a service, 提供一套流量协议标准以及多语言跨平台sdk, 无性能损耗的转发流量 (working)
- [ ] 心跳代理, 使用非长连接的方式建立代理, 实现更复杂的流量与统计学特征混淆
- [ ] P2P式的多级代理, 类似STUN协议
- [x] 重载任意C2的listener, 最终目的将listener从C2中解耦出来
- [x] 实现编译期, 自定义templates. 实现随机流量特征与最小文件体积
- [ ] 通过ebpf与raw packet实现更高级的信道建立与隐蔽
## log

### v0.2.2

- [feat] 新增clash config的自动网段配置
- [feat] 新增cobaltstrike external c2 demo
- [feat] 新增流量全局压缩, `-c tcp:///?compress=true`
- [feat] 新增tlsintls , `-c tcp:///?tlsintls=true`
- [feat] 新增build.sh的-t,-a,-o参数
### v0.2.1

- [feat] support cmdline from stdin
- [feat] add rem lib release, dll/so/a
- [fix] unaligned int panic
- [fix] buffer close panic
- [fix] socks5 parse ipv6 error
### v0.2.0

- [feat] add cmd/export as FFI ABI
- [feat] add build.sh
- [feat] add as package api
- [fix] xor/aes wrapper bug
- [fix] cio Read not full
- [improve] refactor metrics and log
- [improve] add connect mod, just connect ,no serving.
### v0.1.1

- [feature] inbound: 支持 tcp+socks5 协议或memory+socks5, 允许inbound协议在不同的传输层上搭建
- [feature] proxyclient: 实现内存代理功能
- [feature] proxyclient:实现 rem proxyclient
- [feature] tunnel: 实现内存通道
- [feature] kcp: 实现 KCP ICMP 传输
- [feature] kcp: 实现 HTTP/ICMP KCP 传输
- [feature] kcp: 实现 HTTP 通道
- [feature] kcp: 解耦 simplex 和 HTTP 传输
- [feature] cmd: 添加 no-sub 标志以禁用订阅功能
- [refactor] kcp: 重构 KCP 替换 kicmp 和 KCP-GO
- [refactor] tunnel: 重构tunnel，拆分为 dialer 和 listener
- [refactor] tunnel: 重构agent ID 和bridge ID 生成
- [enhance] proxyclient: ssh代理连接复用
- [enhance] tunnel: 提升缓冲区性能
- [fix] 大量bug修复

### v0.1.0

彻底重构

-  正向端口转发, 将端口从本机转发到远程
-  反向端口转发,  将端口从远程转发到本机
-  正向代理, 搭建socks5/http代理
-  反向代理, 通过服务器, 将流量代理至客户端. (rem中实际上并不一定有服务端与客户端之分, rem中可以将流量代理至任意节点)
-  代理, 通过其他服务提供的代理协议, 例如socks5/http代理, 转发rem协议本身的流量
-  转发, 通过其他服务提供的代理协议, 将出方向的流量转发到指定目标
-  级联, 能通过rem自身的协议, 形成多级的节点的连接关系
-  多级端口转发,  将端口从本机通过rem转发到任意rem网络中的节点
-  多级代理转发, 将流量通过rem转发到任意rem网络中的节点
-  RPORTFWD_LOCAL, (多级端口转发的特例), 将本机的的端口通过rem转发至
-  PORTFWD_LOCAL,  (多级端口转发的特例), 将rem节点的端口转发至本机

特性:

-  传输层, 支持TCP, UDP, ICMP, WIREGUARD等各种场景传输层协议
-  加密层, TLS/MTLS或者任意自定义的加密协议
-  混淆层, 模拟特定协议
-  连接复用

