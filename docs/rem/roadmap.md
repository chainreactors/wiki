## stage 0

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
- [ ]  重构proxyclient (working)
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