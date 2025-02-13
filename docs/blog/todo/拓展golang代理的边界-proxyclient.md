## 前言

本文是rem发布前的前菜， 是在实现rem过程中的附带产物，但因其可以被使用在大量其他组件中， 故将其抽象出来作为独立的库使用。 
## golang 代理的背景知识


众所周知， golang上有着远超其他任意语言的网络相关的生态库。 各种应用也层出不穷，从安全领域常用的iox,frp,nps 到网络代理gost, xray, v2ray， 以及相对底层的网络协议实现库如kcp,quic, rawpacket, 还有最重要的标准库提供的密码学库(crypto和tls)及其优雅的抽象。 

越来越多的扫描器也都基于golang实现，这也包括了我在多年前编写的扫描器gogo。 **在gogo开发的早期我对使用代理去扫描是有偏见的**，这源于我对网络协议和golang设计上的了解不够深入，还有一个重要原因是标准库库中的proxy提供了很好的抽象， 但是在具体实现上略显混乱。 这也导致了很长一段时间gogo的代理扫描实际上是误用了，让我一直以为只有socks5协议能代理socket。


![](assets/Pasted%20image%2020250208165213.png)

当然这个误区不止存在于gogo上， 我可以宣布，目前所有的扫描器都没有完全发挥代理的功能。

如果搜索网上的文章， 最常见配置代理的方式是这样：
```go
func main() {
    proxyUrl, _ := url.Parse("http://127.0.0.1:8080")
    client := &http.Client{
        Transport: &http.Transport{
	        Proxy: http.ProxyURL(proxyUrl),
	    },
    }
    
    resp, err := client.Get("http://example.com")
    if err != nil {
        panic(err)
    }
}
```

如果你是这样使用golang代理，说明你也被复制来复制去的文章误导了。 

相对正确的用法应该是这样, 只要实现了Dial接口， 任意数据交换都能作为代理信道。 

```go
func main() {
    proxyURL, _ := url.Parse("socks5://127.0.0.1:1080")
    dialer, _ := proxy.FromURL(proxyURL, proxy.Direct)
    
    transport := &http.Transport{
        Dial: dialer.Dial,
    }
    client := &http.Client{Transport: transport}

    resp, _ := client.Get("https://example.com")
    defer resp.Body.Close()
}
```

跟踪到proxy.FromURL

```go
switch u.Scheme {  
case "socks5", "socks5h":  
    addr := u.Hostname()  
    port := u.Port()  
    if port == "" {  
       port = "1080"  
    }  
    return SOCKS5("tcp", net.JoinHostPort(addr, port), auth, forward)  
}
```

但golang官方只实现了socks5协议，因此这也不能完全怪我对其的误解。 

想支持socks5，socks4，socks4a, http, https，甚至shadowsocks, trojan, ssh。 更甚至neoreg，suo5这些协议作为proxyclient. 那应该怎么做?

## 实现

我在出现这个需求的时候，搜了下是否有这样的库. 答案是有的

最早实现这个需求的库是 https://github.com/zhuhaow/ProxyClient  但是不得不说，代码质量和风格都不是特别优雅。 

后来有人基于这个库重构了一个 https://github.com/zhuhaow/ProxyClient ，这个库更加抽象， 可能是作者藏拙， 我在亲自测试后，发现其除了抽象比较优雅之外， 所有的功能都无法使用， 在每个协议里都留了坑。 


而rem又有此需求， 因此只好在前人的工作上重新实现， 并添加了更多的功能。 


新的库: https://github.com/chainreactors/proxyclient . 继承了zhuhaow的代码风格， 并修复了其留下的各种bug~~(我感觉是原作者故意留下的)~~。

现在， 我们可以基于proxyclient库使用任意信道作为tcp,udp,http的前置代理， 以及链式代理。

示例:

```go
func main() {
	proxy, _ := url.Parse("http://localhost:8080")
	dial, _ := proxyclient.NewClient(proxy)
	client := &http.Client{
		Transport: &http.Transport{
			DialContext: dial.Context,
		},
	}
	request, err := client.Get("http://www.example.com")
	if err != nil {
		panic(err)
	}
	content, err := ioutil.ReadAll(request.Body)
	if err != nil {
		panic(err)
	}
	fmt.Println(string(content))
}
```

新的proxyclient中已经实现了以下协议:

- Direct
- Reject
- Blackhole
- HTTP (fixed)
- HTTPS (fixed)
- SOCKS5 (fixed)
- ShadowSocks (fixed)
- SSH  (fixed)

需要注意的是， 这是一个给golang开发者提供的的代理库，当然经过简单的封装之后也能变为类似proxychain这样的代理客户端。 

现在gogo已经将proxyclient作为其代理的实现， 并且对原本代码的侵入性极小：

gogo中的使用:
```go
	if len(r.Proxy) != 0 {
		var proxies []*url.URL
		for _, u := range r.Proxy {
			uri, err := url.Parse(u)
			if err != nil {
				logs.Log.Warnf("parse proxy error %s, skip proxy!", err.Error())
			} else {
				proxies = append(proxies, uri)
			}
		}
		dialer, err := proxyclient.NewClientChain(proxies)
		if err != nil {
			logs.Log.Warnf("parse proxy error %s, skip proxy!", err.Error())
		}
		neuhttp.DefaultTransport.DialContext = dialer.DialContext
		DefaultTransport.DialContext = dialer.DialContext
		ProxyDialTimeout = func(network, address string, duration time.Duration) (net.Conn, error) {
			ctx, _ := context.WithTimeout(context.Background(), duration)
			return dialer.DialContext(ctx, network, address)
		}
	}
```

简单修改， 替换了全局连接池中的DialContext函数， 就让gogo支持了链式代理，多协议代理等等特性，已在 https://github.com/chainreactors/gogo/releases/tag/v2.13.6 发布

## 代理的边界


在介绍了基本的功能后， 本文才正式开始。

是否有人想过基于webshell的代理(neoreg, suo5)与http代理是否有本质不同?

**答案是没有区别**， 既然能基于http代理去实现proxyclient， 那么neoreg，suo5 以及任意自定义的代理协议都是可以的。 

那么例如neoreg， 应该如何实现其作为proxyclient.

实际上只需要，将其抽象为neoregClient和neoregConn。

为Client实现Dial接口， 在Dial时基于neoreg的协议建立信道，并返回neoregConn， 然后为neoregConn实现对应协议的Read和Write接口即可。 说起来其实非常简单， 具体的代码实现可见: https://github.com/chainreactors/proxyclient/blob/master/neoreg/neoreg.go

当然实际情况会复杂一些，例如在neoreg中，原本使用了python的随机数生成器，我不得不基于cpython的源码实现了一个等价的golang版本。 

搞定neoreg后，suo5也是同理，又或者是任意第三方的代理协议， 如果想的话，甚至可以实现frp, nps, xray, v2ray等等高级代理的proxyclient. 

最终效果

neoreg: https://github.com/chainreactors/proxyclient/tree/master/neoreg
suo5: https://github.com/chainreactors/proxyclient/tree/master/suo5

(初步实现， 还需要一定时间打磨)

使用时需要手动引入:

```go
import (  
    _ "github.com/chainreactors/proxyclient/neoreg"  
    _ "github.com/chainreactors/proxyclient/suo5"  
)

func main() {
	proxy, _ := url.Parse("neoreg://localhost:8080")
	dial, _ := proxyclient.NewClient(proxy)
}
```


## 性能无损的代理

现在可以回到一开始的误区中了， 之前提到

> 一般情况下无法在代理环境中使用,除非使用-t参数指定较低的速率(默认并发为4000).

我们来分析一下为什么代理环境中扫描会导致大量丢包。 原因有很多:

1. 代理的server端实现参差不齐，有很多单文件的socks5工具，在性能上没做优化
2. 环境限制， 例如webshell代理， 受限于各种语言环境，运行环境， 在并发性能上通常不会很好。如果不能搭建双工信道， 只能通过轮询去模拟长连接，性能瓶颈就更明显了。
3. client限制，通常在搭建隧道后， 我们会使用proxifier, proxychains, clash这类工具去连接，这些工具往往只对带宽做了优化，基本啥都没有对于高并发场景优化。

如果解决了这些问题，就能实现不落地(无文件落地， 也不内存加载)的高并发扫描， 只需要搭建一个高性能的隧道， 就能在本机通过proxyclient像落地一样去扫描。

这个需求略微超出了proxyclient的能力范围， 因为还需要实现对应的proxy server。 这就需要rem出手了。 

通过rem搭建代理信道后, 我们通过内存直接与rem构造的虚拟信道通讯，这免去了在proxy的client与server通讯时， 高并发导致的大量连接与握手浪费， 并能复用rem自身实现链接复用。

也就是说， proxyclient直接与rem在内存中进行数据交换， 没有网络链接， rem server与rem client之间实现了链接复用， 只有极少的连接数，带宽即为性能。 

然后在rem所在的网络中，基于golang的goroutine进行高并发请求， rem事实上就变成了扫描器的agent， 只要带宽通畅，几乎没有额外的性能损耗。 

```go
func newRemProxyClient(proxyURL *url.URL, upstreamDial proxyclient.Dial) (proxyclient.Dial, error) {
	return func(network, address string) (net.Conn, error) {
		memoryPipe := utils.RandomString(8)
		console, err := NewConsoleWithCMD(fmt.Sprintf("-c %s -m proxy -l memory+socks5://:@%s", proxyURL.String(), memoryPipe))
		a, err := console.Dial(&core.URL{URL: proxyURL})
		if err != nil {
			return nil, err
		}
		go func() {
			err := a.Handler()
			if err != nil {
				logs.Log.Error(err)
				return
			}
		}()

		for {
			if a.Init {
				break
			} else {
				time.Sleep(100 * time.Millisecond)
			}
		}
		memURL := &url.URL{
			Scheme: "memory",
			Host:   memoryPipe,
		}
		memClient, err := proxyclient.NewClient(memURL)
		if err != nil {
			return nil, err
		}
		return memClient.Dial(network, address)
	}, nil
}

```


通过proxyclient留下的动态注册的接口， 将rem协议注册进去。 

**这部分代码在rem中实现， 所以需要等rem发布后才能体验到。** 

## End

proxyclient是rem的一角， rem还有非常多独有的先进特性， 其核心设计可以在 https://chainreactors.github.io/wiki/rem/design/  里预览。这也导致了对rem的开源有一定担忧， 担心这些特性会被滥用。 

rem将会以rem-community的形式发布， 保留完整的接口抽象， 但是在一些具体实现上删除了过于有侵略性的特性，使用者可以基于自身需求自行修改。 **删除侵略性后的rem-community也是目前最先进的代理工具**。 预计在本文发布后的两周到三周后发布