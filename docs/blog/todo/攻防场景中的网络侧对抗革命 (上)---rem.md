
本文主要内容都来自 https://chainreactors.github.io/wiki/rem/design 

## 前言

有一个笑话，"中国人的网络水平特别好". 事实上也确实如此, 绝大部分代理相关的工具都和中国开发者有关.

我们已经有了很多好用的代理工具，如下面提到的这部分:

* [frp](https://github.com/fatedier/frp) 最常使用, 最稳定的反向代理工具. 配置相对麻烦, 有一些强特征已被主流防护设备识别, 类似的还有nps, ngrok, rathole, spp. 不支持反向端口转发
* [gost](https://github.com/go-gost/gost) 一款强大的正向代理工具, v2版本不支持反向代理, v3开始支持更多种多样的流量操作方式, 未来可期.
* [iox](https://github.com/EddieIvan01/iox) 轻量但稳定的端口转发工具, 但是通讯不加密
* [stowaway](https://github.com/ph4ntonn/Stowaway) 多级代理工具, 支持正反向代理， 但是进支持TCP/HTTP/WS协议通讯. 类似的工具还有lcx,termite,earthworm.

从使用场景覆盖来说， 这些工具加起来确实覆盖了关于 proxy/tunnel 的90%以上场景, 但如frp，gost, iox 这些工具设计上并不是给攻防场景使用的, 现在的NDR设备可以轻松捕获他们的特征. 并且往往是单个工具只解决了部分场景的需求， 不能覆盖所有场景。


## 设计


从开源世界的工具大致能总结出一款能适配所有场景的代理工具应该具备的能力. 

* 端口转发, 包括正向端口转发与反向端口转发. 正向代理与反向代理也是基于此实现
* 多代理协议支持, 需要支持原本就存在的代理协议以保证与其他协议的联动
* 多信道支持, 尽可能多的支持网络世界中已经存在的传输层协议
* 级联, 级联实际上是代理工具的自举
* 流量加密与混淆, 这是代理工具安全性的保证


当然这只是基本功能, 一个工具实现了这些功能, 才有能去讨论下一代代理工具应该是什么样子的.

下面的内容基于已经实现了这些基本功能，进一步探索网络侧的各式各样的玩法。

## 设计理念

在背景中提到过的工具中，最接近设计目标的是gost_v3, 所以我们先看看它的架构.

*具体的代码分析如果有人愿意看, 就单独写一篇，这里只讲架构*

> 一个GOST服务或节点被分为两层，数据通道层和数据处理层. 数据通道层对应的是拨号器和监听器，数据处理层对应的是连接器，处理器和转发器，这里又根据是否使用转发器来区分是代理还是转发。

这个架构对应的是go的net包中的架构, 与go本身的设计理念非常契合. golang的网络设计非常符合直觉.

### golang的net包

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
    
... Others
}
```

golang 将tcp/udp都按照这样的抽象进行封装, 也是传输层的最小抽象。 换句话说，我们只要实现了这三个interface， 就能让任意数据传输的信道作为我们的传输层（当然现实要比这复杂一点，后面会提到）。

更重要的是为什么rem使用golang构建，这也与这个设计有关。 如果对golang的各种网络库熟悉的朋友应该知道，net.Conn这个接口或者其缩略版 io.ReadWriteCloser 接口被广泛用于各种各样有关数据传输/加密/网络/流式传输的场景。

例如http,tls,shadowsocks库中都有ServerConn函数， 用于为实现了net.Conn结构体的结构实现上层应用， 并且ServerConn返回值一般还是net.Conn, 可以被多层嵌套。

假设我们将一个基于某个外部api通讯(例如telegram)的信道作为传输层，只需实现Dial和Listener对应的方法即可让其包装上tls,shadowsocks等各种加密协议。


### gost的设计

golang将tcp,udp,icmp的各种用法都封装成了这些用法。如果熟悉golang各种网络相关的库，更是会发现，各种复杂的协议实现几乎都最终对外暴露这些interface。是接口与组合这个设计理念的教科书。

在gost中，在二进制文件中并没有server与client的区别，这是个非常优雅设计，意味着server与client可以随时互相转化。通过gost搭建的代理可以是网状的，而不只是树状的。这是节点间互通的必备设计之一。

gost的server与client是通过组合Listener，Dialer，Conn，Proxy实现的。启用Listener的就是server，使用Dialer的就是client。但也可以既打开Listener，也使用Dialer，这即是又是的应该叫做agent。rem也是这个设计，如果不考虑逻辑上的划分server与client时，所有的rem都是平等的agent，数据可以在这些agent直接通过各种方式交互。在gost中，级联是不言自明的，不需要特意强调的。

从这个角度看来，gost是个非常完美的代理工具，它支持非常多的传输层协议，也支持对流量传输的任意揉搓。gost比frp自由得多，比有着比iox更加丰富与强大的特性，更是能实现stoyaway能实现的一切功能。并且gost拥有一个略有门槛，但极其优雅的命令行设计。
缺点就是，它不太适合高强度对抗的渗透环境。gost和frp一样，是为了解决网络问题的，不是为了对抗而生的。它们内嵌了web/grpc，有一系列准入，限流，认证，可观察性功能，导致了客户端较为臃肿。最关键的是，他们对数据加密的实现只限于tls/mtls, 这在很多情况下反而成为了特征。

而rem项目开始之初还只有gost v2和frp。gost不支持反向代理，frp不支持正向代理。到了2024年，gost与frp都补全自己功能上弱点，基本实现了对流量走向的自由组合。那rem只需要在继承他们优点的同时实现对流量本身的任意揉搓。

gost作为一个代理工具， 已经能覆盖绝大部分需求。 但对于攻防场景来说, 还是有不少特殊的需求

### rem的设计

而rem的抽象会更加彻底一些。 下面的内容建议结合rem的具体代码实现阅读。

#### 传输层

rem的传输层表示为tunnel。每个tunnel由一个dialer和一个listener组成, 需要注意的是， listener和dialer只在传输层上表示server和client的关系， 当建立起tunnel后，rem之间都是平等的节点。这一点和以往的代理工具有很大不同。

golang已经提供了icmp, udp, tcp, unix四个协议作为传输层，标准库实现了其Dialer和Listener接口， 开箱即用。 

因此tcp也是最容易实现的tunnel， 几乎不需要额外的修改， 就可以将tcp协议作为tunnel使用。 这里是一个删去无关代码的tcp tunnel的实现。

```go
type TCPDialer struct {  
    net.Conn  
    meta core.Metas  
}  
  
func NewTCPDialer(meta core.Metas) *TCPDialer {  
    return &TCPDialer{  
       meta: meta,  
    }  
}  
  
func (c *TCPDialer) Dial(dst string) (net.Conn, error) {  
    u, err := core.NewURL(dst)  
    if err != nil {  
       return nil, err  
    }  
    c.meta["url"] = u  
    return net.Dial("tcp", u.Host)  
}  
  
type TCPListener struct {  
    listener net.Listener  
    meta     core.Metas  
}  
  
func NewTCPListener(meta core.Metas) *TCPListener {  
    return &TCPListener{  
       meta: meta,  
    }  
}  
  
func (c *TCPListener) Listen(dst string) (net.Listener, error) {  
    u, err := core.NewURL(dst)  
    if err != nil {  
       return nil, err  
    }  
    c.meta["url"] = u  
  
    listener, err := net.Listen("tcp", u.Host)  
    if err != nil {  
       return nil, err  
    }  
    c.listener = listener  
    return listener, nil  
}
```

非常简单且清晰。 

但是其他传输层协议就没这么简单了。

#### 传输层之下

golang虽然默认就实现了udp协议的所有的接口， 但默认提供的udp协议是不可靠的， 如果要将其作为可靠的tunnel，那我们就需要自己来做。 通常这个协议叫做 ARQ (**Automatic Repeat-reQuest**), 世界上有非常多的ARQ协议，例如TCP就是最知名的ARQ协议。 

为什么将ARQ协议称为传输层之下， 原因就在于ARQ协议不适用net.Conn， 而是基于net.PacketConn. 

```
type PacketConn interface {  
    ReadFrom(p []byte) (n int, addr Addr, err error)  
  
    WriteTo(p []byte, addr Addr) (n int, err error)
    ...
}
```
与net.Conn最大的区别就是这两个接口。 PacketConn是面向无状态的数据包的， 不同于tcp已经在操作系统层实现了写给谁的问题，UDP/ICMP或者其他无状态数据包(例如基于外部api的传输层)， 都需要处理这个问题。 

我们需要将PacketConn封装为Conn，并且处理其中的各种错误/重传/丢包/顺序等问题， 才能实现一个稳定的传输层。 tunnel是搭建在稳定可靠的Conn之上的，是面向数据流的。

好在golang中已经有非常多成熟的ARQ协议实现， 例如:

- [kcp-go](https://github.com/xtaci/kcp-go) 相对轻量的ARQ协议，原生实现虽然对PacketConn做了一定抽象， 但是只支持UDP
- [quic-go](https://github.com/quic-go/quic-go)， google设计的ARQ协议， 现在已经改名http3， 实现了非常多的特性，但是也相对笨重
- ...

rem选择相对轻量的kcp作为rem的默认ARQ协议（ARQ协议也会引入新的特征）。并且基于kcp-go进行了重构， 将其原本对UDP的耦合解耦， 任意实现了PacketConn接口的数据交换都可以被KCP封装为可靠的Conn。 并交付给上层的tunnel。

通过KCP， 将golang原本就支持的icmp/udp封装为了可靠的tunnel， 但到这里还没完。 

最终的成果位于: https://github.com/chainreactors/rem/tree/master/x/kcp

##### lolc2

![](assets/Pasted%20image%2020250215023640.png)

lolc2与 loldrive , lolbas 类似, 通过可信的服务搭建自己的隧道。

这些服务通常都是通过提供api实现通讯, 也就是http协议. 但这里有个问题, 这些服务的读/写通常是不同的接口, 并且都是单个数据包， 而非流式传输. 

所以对于单工信道（simplex），例如http协议，或者基于各种api的数据交换信道。 还需要一层封装。 

http协议只允许单向发起请求， 因此要让数据能即时从server传输给client， 必须通过client发起轮询。并且轮询的间隔就是连接的最小RTT(往返时间)。我们需要非server和client分别实现不同的ReadFrom和WriteTo才可以实现对应的数据交换， 并交付给上层的tunnel。

这么做性能可能是个很大问题, 用来C2通讯一般是够用, 用来构建各种代理会比较受限.

当然也有不少业务存在流式传输的功能, 例如视频流, 文件流等, 在实现上是类似的. 

如果是单个数据包的api, 通过轮询模拟连接, 流式传输则直接作为ReadWriteClose即可. 

#### 传输层之上

在传输层之上，OSI模型中是会话层， 表示层， 和应用层， 分别对应到rem就是mux(链接复用)层，加密混淆层，应用层。

在golang中， 已经有很多个成熟的多路复用(connection multiplexing)实现， 例如smux和yamux。 但这和arq协议一样，会引入新的特征，并且不是所有的情况都适合多路复用器工作， 例如使用http这类单工协议模拟流时， smux的控制小包会带来额外的传输延迟。 所以rem实现了一个自己的多路复用器。这个多路复用器工作在wrapper(后面会提到)之上。

wrapper则是代替原本OSI模型中的表示层，tunnel传输的数据将会经过wrapper的包装。

wrapper本质上是 io.ReadWriteCloser ，是面向流的数据处理协议。wrapper将会包装tunnel提供的net.Conn接口, 然将被wrapper后的Conn交付给mux， 再由mux交付给应用层。 

一个基于xor实现的wrapper只需要实现简单的Read和Write接口即可将数据进行简单的加密:

```go
func NewXorWrapper(r io.Reader, w io.Writer, opt map[string]string) core.Wrapper {  
    var key []byte  
    if k, ok := opt["key"]; ok {  
       key = []byte(k)  
    } else {  
       key = []byte{} // 使用空字节切片作为默认值  
    }  
  
    var iv []byte  
    if i, ok := opt["iv"]; ok {  
       iv = []byte(i)  
    } else {  
       iv = key // 如果没有提供iv，使用key作为iv  
    }  
  
    encryptor := utils.NewXorEncryptor(key, iv)  
    return &XorWrapper{  
       reader:    &cipher.StreamReader{S: encryptor.GetStream(), R: r},  
       writer:    &cipher.StreamWriter{S: encryptor.GetStream(), W: w},  
       encryptor: encryptor,  
    }  
}  
  
func (w *XorWrapper) Name() string {  
    return consts.XORWrapper  
}  
  
func (w *XorWrapper) Read(p []byte) (n int, err error) {  
    return w.reader.Read(p)  
}  
  
func (w *XorWrapper) Write(p []byte) (n int, err error) {  
    return w.writer.Write(p)  
}  
  
func (w *XorWrapper) Close() error {  
    return w.encryptor.Reset()  
}
```

但对于非流式的加密混淆协议， 会稍微麻烦一点， 我们需要在wrapper中添加缓冲区， 将需要的数据读到缓冲区后进行特定的操作再交付给上层。（这样的实现可能在一定层度上会影响性能）

最终， 还可以将多个wrapper连接在一起， 将数据进行复杂的加密混淆操作。 

在rem中， 会话层和表示层是倒置的。 会话层承载在表示层之上。 

#### 传输层之间

rem是在传输层之上重新构建的一整套网络架构。 对于底层的交换路由设备，rem不会有涉及， 但是原本的网络中， 就有各种各样的应用层代理，例如http，socks5，ssh等各种各样的代理协议， 以及在安全中常用的neoreg，suo5等webshell实现的代理协议。 

为了让rem能与外部的代理协议有交互，我们还需要在各个层面上允许rem通过原本就存在的代理协议搭建信道（通常用在各种不出网或者限制出网场景下）。

rem需要让tunnel，outbound等各种场景都支持上基于原本的代理协议实现数据传输。 

在特别早期版本找到了 https://github.com/zhuhaow/ProxyClient 这个库， 但因为代码之类较低又替换为了 https://github.com/missdeer/ProxyClient 。结果新的这个库在每个协议上都存在bug。 

最后基于 https://github.com/missdeer/ProxyClient 重构并修复了大量的bug, 才能让rem工作在各种代理协议上。 

最终的成果位于: https://github.com/chainreactors/proxyclient

#### 传输层之外

现代的流量检测设备， 除了特征检测之外， 还会有大数据， 统计学， AI之类的对抗维度。 我们刚刚构建的传输层本质上只解决了特征检测和密码学安全的问题。 对于这些新的检测维度， 我们也需要新的手段。 


rem还提供了一组接口， 能让用户对数据进行统计学层面的操作。 

```go
type BeforeHook struct {  
    DialHook   func(ctx context.Context, addr string) context.Context  
    AcceptHook func(ctx context.Context) context.Context  
    ListenHook func(ctx context.Context, addr string) context.Context  
}  
  
type AfterHookFunc func(ctx context.Context, c net.Conn, addr string) (context.Context, net.Conn, error)  
  
type AfterHook struct {  
    Priority   uint  
    DialerHook func(ctx context.Context, c net.Conn, addr string) (context.Context, net.Conn, error)  
    AcceptHook func(ctx context.Context, c net.Conn) (context.Context, net.Conn, error)  
    ListenHook func(ctx context.Context, listener net.Listener) (context.Context, net.Listener, error)  
}
```

after和before hook能在tunnel dial/accept前后实现特定的操作。 例如添加随机的 **延迟/流量控制/压缩/随机填充** 等等操作， 来规避统计学和大数据上的检测。 （顺带一提， wrapper也是基于hook实现的）。甚至更进一步， 我们可以独立控制上下行的数据特征， 去模拟任意数据传输的特性。 

#### 应用层

之前提到过rem之间并不分server和client，只有tunnel有逻辑意义上的server和client， 最终的原因就是我们通过inbound/outbound来控制流量的方向， 而inbound/outbound 既可以搭建在tunnel的server上也可以是client上。 

inbound是数据入口， outbound是数据出口。 用户的数据从inbound经过tunnel到outbound对外发起请求。

大多数场景下， 我们只会用到反向代理，由外网访问到目标内网。

但是我们现在可以做的更多， 我们只需要实现一个符合cobaltstrike的external c2 协议的inbound， 我们就可以让cobaltstrike的流量走到rem构建的网络中。 

再进一步， 我们可以通过tun/tap虚拟网卡，真正意义上将目标和本地的网络连为一体。

更甚至， 通过STUN协议， 实现p2p的网络通讯。

这一切， 都可以在rem的能力覆盖范围之内。 

### 小结


看到这里可以发现,  rem基于传输层之上重新抽象了整个网络交互的流程。

- 传输层, 对应 core/tunnel, 分为 listener 和 dialer, 可以实现自定义的任意传输层信道， 只需要实现对应的 golang 的接口即可。目前实现了，tcp, udp, icmp, websocket.
- 会话层, 实现了链接复用(mux)和agent管理.
- 加密混淆层(对应表示层)，对应 core/wrapper，对应的接口是 ReadWriteCloser, 只需要实现对应的 Read 和 Writer 接口， 即可实现对传输层流程的加密，混淆， 伪装。甚至可以实现上下行流量分别配置不同的 wrapper. 目前实现了 aes, xor, padding.
- 中转/代理层(对应表示层) (可选), 可以通过第三方代理/服务中转流量， 例如通过 ssh, socks5, http, neoreg, suo5 等任意具有流量功能的实现数据转发
- 应用层, 基于上面三层实现的信道, 可以被封装为不同的应用, 目前实现了 socks5, port forward, http 代理, shadowsocks, trojan等

基于这样的抽象层级, 我们可以任意拓展 rem 的能力边界。 我们可以快速添加一个传输层协议， 或是加密混淆算法， 或是代理中转工具， 又或是最终面向用户的协议。

这是前所未有的潜力，我们可以做非常多事情, **之前无法想象的事情**！ 举几个例子:

- 可以实现 cobaltstrike externalC2的应用层协议, 让CS的流量走rem构建的信道中
- 可以作为cobaltstrike的前置Redirector, 让溯源变得困难重重
- 可以单独实现上行与下行协议的特征, 在流量层面上模拟已知协议
- 可以通过tun将目标网络连成一片, 忽略所有形式的网络隔离
* 编译为WASM, 直接通过浏览器提供的XHR接口搭建代理
- ......

## Features

### 基本功能

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
* 支持对外暴露socks5/shadowsocks/trojan/http等多种协议
* 跨语言互操作性与模块化
* ... 

理论上只需要将上述功能交叉组合就能实现一切 proxy/tunnel相关的需求. 

### OPSEC特性

* 加密混淆层互相嵌套任意组合， 并随机生成初始模板
* 支持多信道
* 支持 https://lolc2.github.io/ , 能将任意数据交换的信道作为代理隧道
* 通过注册模式实现按需条件编译, 尽可能降低二进制文件的体积和特征
* 支持跨语言交互性, 能通过动态/静态链接库可以实现在不同的语言中调用rem
* ......

本质上rem只是一个tunnel/proxy 开发框架, 可以基于这个框架对流量进行任何的揉搓, 组装, 隐藏. 但也因如此, 在开源时去掉了不少关于OPSEC的具体实现, 只保留了较为基础的版本, 对于熟悉golang与网络的朋友, 使用ai就能快速实现自己想要的需求. 

### 高级特性

#### webshell代理 (done)

例如所有协议都不出网的场景，红队通常会构建webshell代理的方式实现，如neoreg或suo5，然后红队通过webshell代理访问内网。neoreg实际上是半双工的信道，需要通过轮询读取数据，因此不管是延迟还是性能都并不是特别出色，而suo5采用了websocket全双工信道。 gost无法在这种场景下使用。但实际上可以实现neoreg与suo5代理协议, 通过webshell代理与内网的agent联通，以实现更复杂的流量隧道操作。

#### 无损代理 (done)

各种代理工具为了保证最大兼容度, 通常最终对外暴露的都是socks5或者更高级一些使用clash. 但这种方式进行的转换其实是有非常大的性能损失的.  特别是在进行扫描时通常会有很多目标, 因此会在本地建立大量的连接. 这种场景下代理的性能会极大的衰减.

要解决这个问题, 代理工具就应该提供直接交互的SDK, 让第三方工具能够直接使用代理工具的信道，而不需要将其先转为socks或者其他协议.

#### 用户体验 (done)

rem的所有操作都只需要一行命令, 用过frp, nps之类的工具后, 我不想要有配置文件, 也不想要有server和client两端. 只想要一个简洁而优雅的命令行工具, 所有的操作都通过一行命令实现. 

并且高度复用了url协议的各种功能， 通过url协议完成复杂的参数配置, 将基本参数简化到只需要3个. 
#### Proxy as a SDK (done)

rem默认提供了命令行工具， 但更重要的是rem能作为包被嵌入到各种各样的工具中, 或者通过proxyclient与非golang的工具联动.

已经通过proxyclient实现其代理功能的第三方工具：

- https://github.com/chainreactors/gogo
- https://github.com/chainreactors/zombie
- https://github.com/zema1/suo5

直接嵌入rem的工具:

- https://github.com/chainreactors/malice-network
- https://github.com/chainreactors/malefic

## End

rem 是redboot计划中三大路线之二, 目前只有面向红队的高交互的半自动ASM--- mapping还没有发布， 受限于精力也无法在短期发布。 

rem主要解决的问题就是在各种场景中的tunnel/proxy问题， 并且作为串联其他工具的中间件使用. 

IoM 可以通过rem搭建代理， 也可以直接基于rem构建信道.  更可以搭建基于rem的listener.

mapping可以通过rem将其的能力拓展到内网或者使用rem构建分布式扫描集群. 

rem是整个红队基础设施中重要的一环, 我相信它能承担攻防场景中更多的网络侧功能，给整个生态带来变化。

