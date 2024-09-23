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

- [x]  调整主体文件结构
- [x]  调整函数,文件,变量命名
- [x]  重构代理逻辑
- [x]  代码解耦
- [x]  重构monitor与流量控制
- [x]  重新设计cli ui
- [x]  支持rportfwd
- [x]  重新设计msg
- [x]  重新设计wrapper
- [x]  支持neoregeorg, 将半双工信道升级为全双工
- [x]  支持云函数, cdn等
- [x]  支持配置任意数量的多级透明socks5/socks4a/socks4/http/https代理
- [x]  支持tls协议 (working)
- [x]  支持级联 (working)
- [ ]  支持端口复用(搁置)
- [ ]  支持端口敲门(搁置)
- [x]  RPORTFWD_LOCAL与PORTFWD_LOCAL
- [ ] 重构proxyclient
- [ ] 支持clash订阅
- [ ] 支持shadow-tls
- [ ] 支持对外暴露多种类型的协议
	- [x] socks5
	- [x] http/https
	- [ ] trojan
	- [ ] v2ray

**高级功能**

- [ ]  Proxy as a service, 提供一套流量协议标准以及多语言跨平台sdk, 无性能损耗的转发流量 (working)
- [ ]  心跳代理, 使用非长连接的方式建立代理, 实现更复杂的流量与统计学特征混淆
- [ ]  P2P式的多级代理, 类似STUN协议
- [ ]  重载任意C2的listener, 最终目的将listener从C2中解耦出来
- [ ]  实现编译期, 自定义templates. 实现随机流量特征与最小文件体积
- [ ]  通过ebpf与raw packet实现更高级的信道建立与隐蔽