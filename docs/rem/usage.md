
## Usage

```
Usage:
  rem

Miscellaneous Options:
  -k, --key=            key for encrypt
  -a, --alias=          alias
      --version         show version
      --debug           debug mode
      --detail          show detail
      --quiet           quiet mode

Main Options:
  -c, --console=        console address (default: tcp://0.0.0.0:34996)
  -l, --local=          local address
  -r, --remote=         remote address
  -d, --destination=    destination agent id
  -x, --proxy=          outbound proxy chain
  -f, --forward=        proxy chain for connect to console
  -m, --mod=            rem mod, reverse/proxy/bind (default: default)

Config Options:
  -i, --ip=             console external ip address
      --tls             enable tls
      --retry=          retry times (default: 10)
      --retry-interval= retry interval (default: 10)
      --sub=            subscribe address (default: http://0.0.0.0:29999)

Help Options:
  -h, --help            Show this help message
```

## QuickStart
  
命令行设计能简则简, `{}`中的内容为可省略的参数
  
rem需要在被client与user都能访问到的一台机器上搭建一个对外暴露的中心服务器.  
  
值得一提的是, 这个console并非实际意义上的server, 而只是代理链路中平等的一环.   
  
不需要任何参数启动的rem会自动生成连接链接与订阅链接  
  
```  
./rem   
```  
  
![image-20241216182132544](assets/image-20241216182132544.png)  
  
(这里的-i可不填, 会自动尝试通过ipip获取外网ip)  
  
每次启动都会生成随机的密钥以及各种加密混淆配置, 所以需要复制这里生成的配置连接, 用来在对端连接使用  
  
### 反向代理  
  
rem 默认的模式即为反向代理, 并会在server上启动socks5代理 
  
```  
./rem -c [link] {-r socks5://user:pass@0.0.0.0:12345}
```  

!!! tips "极简参数"
	`{}`中的内容为可省略的参数
	
	这行命令可以缩写为
	
	```
	./rem -c [link]
	```

![image-20241216182737400](assets/image-20241216182737400.png)  

这个场景类似frp的socks5插件
  
client通过rem支持的任意一种信道能连接到外网即可建立连接, 并在server端建立socks5服务.  
  
user位于外网, 通过socks5服务即可访问client所在的网络. 

!!! tips "对外暴露不同的协议"
	rem支持socks5,http,trojan,shadowsocks等协议, 可以指定任意协议, 具体请见[文件:应用层](#_6)
	
	`./rem -c [link] -r ss://`
	
  
### 正向代理  
  
与反向代理相反, 可以在client上搭建socks5服务， 访问server所在的网络  
  
`./rem -c [link] -m proxy`    
![image-20241216183149941](assets/image-20241216183149941.png)  

!!! tips "工作模式"
	`-m` 表示工作模式, 请见 [文档:传输层](##transport)
	
	`-m reverse` 表示inbound位于server端
	
	`-m proxy` 表示inbound位于client端 
  
这个场景中user位于内网, client通过rem支持的任意一种信道能连接到外网即可建立连接, 并在client端打开socks5服务.  
  
user可以通过client上监听的socks5服务实现出网, 访问server能访问到的网络. 在一些有各种限制的不出网场景中常用.  
  
### 远程端口转发  
  
server会监听一个端口, 访问该端口的流量都会转发到client的指定端口
  
`./rem -c [link] -l port://:8000 `     
![image-20241217004325283](assets/image-20241217004325283.png)  

!!! tips "-l与-r" 
	一般来说, 这两个参数会在client端使用, 用来描述用户层协议. 
	`-r` 表示remote, 即server端.
	`-l` 表示local, 即client(自身)端
	通过这两个参数的组合, 可以构造出任意想要的应用层功能

默认情况下, 未描述`-r` 会使用随机生成的端口.  也可以手动指定server的端口

```
./rem -c [link] -r :12345 -l port://:8000
```

等价于ssh的`ssh -R 12345:localhost:8000 user@ip` 


`-l` 的host留空表示127.0.0.1. 可以指定client内网ip  
  
```  
./rem -c [link] -l port://[internal_ip]:8000     
```  

### 本地端口转发

与远程端口转发相反, client 监听一个端口, 访问该端口的流量会转发到server的指定端口

`./rem -c [link] -r port://:8000 -m proxy`


## 传输层

当两个rem建立连接, 实际上就虚拟了一个传输层网络. 我们可以在这个网络上实现自由转发数据构造上层应用. 

rem提供了三种工作模式, 分别是:

- reverse(默认) , 建立连接后 inbound在server端, 会在server上监听来自端口接收数据
- proxy, 建立连接后 inbound在client端, 会在client上监听端口接收数据
- bind, 简单工作模式, 不需要两个rem建立连接

每个agent进程在逻辑上行可以承载任意多个隧道, 自动根据rem之间建立的传输层信道链接复用. 为了命令操作方便, 一般情况下, 我们通过一行命令描述一个服务.

### transport

当前支持的传输层

- tcp
- udp (arq协议: kcp)
- icmp (arq协议: kcp)
- unix , windows上基于命名管道实现, 非unix系统基于文件实现
- websocket
- wireguard


### wrapper

- xor
- aes
- padding

### 转发链 forward chain  
  
转发器, 与代理器是相对应的概念. 用作client连接server时需要跨过的流量节点.   
  
例如client连接server的时候可以通过多级代理, 常见于不出网内网但存在一个http/socks5代理让部分应用能够出网.  
  
`./rem -c [link] -f socks5://192.168.1.1:1080 -f http://192.168.2.2:1081   
使用场景：  
  
目标网络环境不出网， 但是给必须出网的应用配置了内部的http代理（192.168.2.2）， 并且限制了白名单ip（192.168.1.1）访问内网出网代理。  
  
先通过192.168.1.1绕过白名单限制， 再通过出网代理建立代理  
  
### 级联 redirecter  
  
user <-> console <-[网络隔离]-> client  
  
rem的级联实现通过 -d/--destination 实现  
  
每个连接对都会有唯一ID, 也可以使用alias(通过-a/--alias 自定义)  
  
console启动rem  
  
`./rem`  
  
client连接到console  
  
`./rem -c [link] -a internal` , 如果不填alias,则是系统分配的ip:port  
  
user通过console访问client.   
  
`./rem -c [link]  -d internal` 将会在client监听一个socks5端口, 通过该端口可以直接访问到user所在的内网.  
  
具体用法与非级联场景完全一致  
  
本地反向代理: `./rem -c [link] -d internal` 将在user监听socks5端口, 通过该端口可以直接访问到client所在的内网.  
  
本地端口转发: `./rem -c [link] -d internal -l port://:12345 ` 将会将client的12345端口转发到user的随机生成的端口  
  
远程端口转发: `./rem -c [link]  -d internal -l :8888 -m proxy` 将会将user的8888端口转发到client的随机生成的端口


## 应用层
### 代理协议

- socks5
- trojan
- shadowsocks
- port forward
- http/https

### 代理链 proxy chain  

代理链，表示对outbound配置的代理  
  
可以将任何信道(一般是应用层代理)封装为proxier, 例如最基本的socks5, http, https之外, 还可以将neoreg(已实现), sou5等  
  
使用-x/--proxy , 当前支持

- socks4, socks4a, socks5
- http, https
- ssh
- shadowsocks
- neoreg(todo)
- suo5(todo)
  
使用场景:  
  
控制了位于边界的192网段内的服务， 需要访问三层代理后的专网内的服务。  
  
`./rem -c [link] -x socks5://192.169.1.1:1080 -x http://172.16.1.1:1081 -x neoreg://10.0.0.1:1082`   
表示在服务器上打开socks5协议的反向代理. 通过这个反向代理对内网访问时，还会经过位于内网的任意层级代理链。  
  
这里配置的表示出口流量先经过192.169.1.1，172.16.1.1， 10.0.0.1 最终访问到位于层层内网之内的目标服务。  
  
todo:  
  
* 当前只支持tcp协议, udp支持开发中  
* 支持正向代理的proxy  
* 云函数代理  