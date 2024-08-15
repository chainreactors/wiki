

## 背景

有一个笑话，"中国人的网络水平特别好". 事实上也确实如此, 绝大部分代理相关的工具都和中国开发者有关.

* [frp](https://github.com/fatedier/frp) 最常使用, 最稳定的反向代理工具. 配置相对麻烦, 有一些强特征已被主流防护设备识别, 类似的还有nps, ngrok, rathole, spp. 不支持反向端口转发
* [gost](https://github.com/go-gost/gost) 一款强大的正向代理工具, v2版本不支持反向代理, v3开始支持更多种多样的流量操作方式, 未来可期.
* [iox](https://github.com/EddieIvan01/iox) 轻量但稳定的端口转发工具, 但是通讯不加密
* [stowaway](https://github.com/ph4ntonn/Stowaway) 多级代理工具, 支持正反向代理， 但是进支持TCP/HTTP/WS协议通讯. 类似的工具还有lcx,termite,earthworm.


## 设计

### 基本功能

从开源世界的工具大致能总结出一款能适配所有场景的代理工具应该具备的能力. 

* 端口转发, 包括正向端口转发与反向端口转发. 正向代理与反向代理也是基于此实现
* 多代理协议支持, 需要支持原本就存在的代理协议以保证与其他协议的联动
* 多信道支持, 尽可能多的支持网络世界中已经存在的传输层协议
* 级联, 级联实际上是代理工具的自举
* 流量加密与混淆, 这是代理工具安全性的保证

一个工具实现了这五项基本的功能, 那么就终于可以开始讨论下一代代理工具应该是什么样子的.

### 设计理念

在背景中提到过的工具中，最接近设计目标的是gost_v3, 所以我们先看看它的架构.

*具体的代码分析如果有人愿意看, 就单独写一篇，这里只讲架构*

> 一个GOST服务或节点被分为两层，数据通道层和数据处理层. 数据通道层对应的是拨号器和监听器，数据处理层对应的是连接器，处理器和转发器，这里又根据是否使用转发器来区分是代理还是转发。

这个架构对应的是go的net包中的架构, 与go本身的设计理念非常契合. golang的网络设计非常符合直觉.

golang 包中的几个重要概念。
**Listener 监听器**

```
type Listener interface {
    // Accept 等待并返回下一个连接到此监听器的连接。
    Accept() (Conn, error)
    
    // Close 关闭监听器。任何阻塞中的 Accept 操作都会不再阻塞并返回错误。
    Close() error
    
    // Addr 返回监听器的网络地址。
    Addr() Addr
}
```

**Dialer 拨号器**

```
type Dialer interface {
    Dial(network, address string) (net.Conn, error)
}
```

**Conn 连接**, Accept与Dial都将返回Conn

```
type Conn interface {
    // Read 从连接中读取数据。
    Read(b []byte) (n int, err error)
    
    // Write 向连接中写入数据。
    Write(b []byte) (n int, err error)
    
    // Close 关闭连接。
    Close() error
    
    // LocalAddr 返回本地网络地址。
    LocalAddr() Addr
    
    // RemoteAddr 返回远程网络地址。
    RemoteAddr() Addr
    
    // SetDeadline 设置读写操作的截止时间。
    SetDeadline(t time.Time) error
    
    // SetReadDeadline 设置读操作的截止时间。
    SetReadDeadline(t time.Time) error
    
    // SetWriteDeadline 设置写操作的截止时间。
    SetWriteDeadline(t time.Time) error
}
```


golang将tcp,udp,icmp的各种用法都封装成了这些用法。如果熟悉golang各种网络相关的库，更是会发现，各种复杂的协议实现几乎都最终对外暴露这些interface。是接口与组合这个设计理念的教科书。

在gost中，在二进制文件中并没有server与client的区别，这是个非常优雅设计，意味着server与client可以随时互相转化。通过gost搭建的代理可以是网状的，而不只是树状的。这是节点间互通的必备设计之一。

gost的server与client是通过组合Listener，Dialer，Conn，Proxy实现的。启用Listener的就是server，使用Dialer的就是client。但也可以既打开Listener，也使用Dialer，这即是又是的应该叫做agent。rem也是这个设计，如果不考虑逻辑上的划分server与client时，所有的rem都是平等的agent，数据可以在这些agent直接通过各种方式交互。在gost中，级联是不言自明的，不需要特意强调的。

从这个角度看来，gost是个非常完美的代理工具，它支持非常多的传输层协议，也支持对流量传输的任意揉搓。gost比frp自由得多，比有着比iox更加丰富与强大的特性，更是能实现stoyaway能实现的一切功能。并且gost拥有一个略有门槛，但极其优雅的命令行设计。
缺点就是，它不太适合高强度对抗的渗透环境。gost和frp一样，是为了解决网络问题的，不是为了对抗而生的。它们内嵌了web/grpc，有一系列准入，限流，认证，可观察性功能，导致了客户端较为臃肿。最关键的是，他们对数据加密的实现只限于tls/mtls, 这在很多情况下反而成为了特征。

而rem项目开始之初还只有gost v2和frp。gost不支持反向代理，frp不支持正向代理。到了2024年，gost与frp都补全自己功能上弱点，基本实现了对流量走向的自由组合。那rem只需要在继承他们优点的同时实现对流量本身的任意揉搓。

gost作为一个代理工具， 已经能覆盖绝大部分需求。 但对于攻防场景来说, 还是有不少特殊的需求

### 基本概念

基本概念也是代理工具中的基本功能, 通过组合这些基本功能能够覆盖绝大部分的使用场景. 

这些功能其他代理工具基本能达到同样的效果. 区别只在于性能与安全性.

用法:

* 正向端口转发, 将端口从本机转发到远程
* 反向端口转发,  将端口从远程转发到本机
* 正向代理, 搭建socks5/http代理
* 反向代理, 通过服务器, 将流量代理至客户端. (rem中实际上并不一定有服务端与客户端之分, rem中可以将流量代理至任意节点)
* 代理, 通过其他服务提供的代理协议, 例如socks5/http代理, 转发rem协议本身的流量
* 转发, 通过其他服务提供的代理协议, 将出方向的流量转发到指定目标
* 级联, 能通过rem自身的协议, 形成多级的节点的连接关系
* 多级端口转发,  将端口从本机通过rem转发到任意rem网络中的节点
* 多级代理转发, 将流量通过rem转发到任意rem网络中的节点
* RPORTFWD_LOCAL, (多级端口转发的特例), 将本机的的端口通过rem转发至
* PORTFWD_LOCAL,  (多级端口转发的特例), 将rem节点的端口转发至本机

特性:

* 传输层, 支持TCP, UDP, ICMP, WIREGUARD等各种场景传输层协议
* 加密层, TLS/MTLS或者任意自定义的加密协议
* 混淆层, 模拟特定协议
* 连接复用

### 高级特性

#### webshell代理

例如所有协议都不出网的场景，红队通常会构建webshell代理的方式实现，如neoreg或suo5，然后红队通过webshell代理访问内网。neoreg实际上是半双工的信道，需要通过轮询读取数据，因此不管是延迟还是性能都并不是特别出色，而suo5采用了websocket全双工信道。 gost无法在这种场景下使用。但实际上可以实现neoreg与suo5代理协议, 通过webshell代理与内网的agent联通，以实现更复杂的流量隧道操作。

#### 无损代理

各种代理工具为了保证最大兼容度, 通常最终对外暴露的都是socks5或者更高级一些使用clash. 但这种方式进行的转换其实是有非常大的性能损失的.  特别是在进行扫描时通常会有很多目标, 因此会在本地建立大量的连接. 这种场景下代理的性能会极大的衰减.

要解决这个问题, 代理工具就应该提供直接交互的SDK, 让第三方工具能够直接使用代理工具的信道，而不需要将其先转为socks或者其他协议.

#### 用户体验

rem的所有操作都只需要一行命令, 用过frp, nps之类的工具后, 我不想要有配置文件, 也不想要有server和client两端. 只想要一个简洁而优雅的命令行工具, 所有的操作都通过一行命令实现. 
