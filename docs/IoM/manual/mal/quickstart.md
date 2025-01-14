## Intro

IoM 基于lua实现了一套复杂但强大的插件系统。

* 一组类似AggressiveScript的简化api
* 一组全量功能的原始grpc api
* 一系列方便的内置lua库

可以在 [mals插件生态](/wiki/IoM/manual/mal/) 中找到相关内容的介绍.

mals插件基于lua实现, 目前lua最好用的ide是vscode, 推荐安装[用户量最多的lua插件](https://marketplace.visualstudio.com/items?itemName=sumneko.lua)

## 基础使用
### Hello World

lua的语法比Aggressive Script的Sleep语言更加简单直观， 在大多数用法下， 就像是简化后的python. 不建议也不需要使用者先去学习lua再开始编写插件， **直接上手即可**。

编写hello.lua

```lua
print("hello world") -- 在client的标准输出中打印hello world

broadcast("hello world") -- 在所有的client中打印hello world

notify("hello world") -- 在所有client中打印, 并且如果配置了第三方通知接口(飞书,tg,微信) 则同时会在向第三方发送通知
```

为了让这个插件能被正确加载, 我们还需要编写 mal.yaml 让IoM可以识别.

```yaml
name: hello
type: lua
author: M09Ic
version: v0.0.1
entry: hello.lua
```

将这两个文件都放在插件的默认保存目录下即可

windows: `%USERPROFILE%/.config/malice/mals/hello/`
linux: `~/.config/malice/mals/hello`

```
mal load hello
```

![](/wiki/IoM/assets/Pasted%20image%2020250115001838.png)

!!! important "分发插件"
	[社区仓库](https://github.com/chainreactors/mal-community) 中的插件都通过zip包分发. 

	 也可以将刚刚的`hello.lua` 和 `mal.yaml` 打包成zip, 然后命令安装
	 
	 ```
	 mal install hello.zip 
	```


### register command


### beacon package


## 高级用法

### new protobuf message
在builtin和beacon 包中, 绝大多数api都是高度封装的, 并不需要过多关注底层的GRPC接口调用。

但如果要调用 rpc 包中的接口，就需要手动创建对应的protobuf message.

mals已经将所有的protobuf message都注册到了lua中, 并添加了必要的接口.


```lua
local bin = ExecuteBinary.New()
bin.Name = "execute_assembly"
bin.Args = {"whoami"}
bin.Bin = read_resource("example.exe")
```

或

```lua
local bin = ExecuteBinary.New({
    Name = "execute_assembly",
    Bin = read_resource("example.exe"),
    Type = "example_type",
    Args = {"whoami"}
})
```

### 动态获取 protobuf message

mals添加了ProtobufMessage 作为通用的反射获取package name的
```lua
local msg = ProtobufMessage.New("modulepb.ExecuteBinary", {
    Name = "execute_assembly",
    Bin = read_resource("example.exe"),
    Type = "example_type",
    Args = {"whoami"}
})
```

### 调用rpc命令

```lua
local rpc = require("rpc")

local task = rpc.ExecuteAssembly(active().Context(), ProtobufMessage.New("modulepb.ExecuteBinary", {
    Name = "execute_assembly",
    Bin = read_resource("example.exe"),
    Type = "example_type",
    Args = {"whoami"}
})
```

### 注册为库
