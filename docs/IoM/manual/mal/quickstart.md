## Intro

IoM 基于lua实现了一套复杂但强大的插件系统。

* 一组类似AggressiveScript的简化api
* 一组全量功能的原始grpc api
* 一系列方便的内置lua库

可以在 [mals插件生态](/IoM/manual/mal/) 中找到相关内容的介绍.

mals插件基于lua实现, 目前lua最好用的ide是vscode, 推荐安装[用户量最多的lua插件](https://marketplace.visualstudio.com/items?itemName=sumneko.lua)


## 基本概念

### lua api

mal lua基于lua 5.1 (https://github.com/yuin/gopher-lua)实现. 

lua 是一门非常简单的脚本语言, 上手难度远远低于python, 也低于aggressive script. 如果尝试使用过python或aggressive scirpt 就可以直接上手lua. 通过AI大模型辅助, 更是可以指挥AI去帮你实现绝大部分功能. 

[lua5.1 reference](https://www.lua.org/manual/5.1/)

[lua5.1 maunal](https://www.lua.org/manual/5.1/manual.html)

*我们在实现基于lua的插件时, 几乎没看过任何lua有关的文档, 相信有任意编程语言的经验都能很快掌握lua.* 

#### mal package

目前mal lua 已经实现了数百个api, 为了更好的管理与分类这些api. 我们将这些api分到三个package中. 

* [builtin](/IoM/manual/mal/builtin/), 直接在当前上下文可用, mal相关核心api
* [rpc](/IoM/manual/mal/rpc/), grpc相关api的lua实现
* [beacon](/IoM/manual/mal/builtin/), 对CobaltStrike的兼容层api. 实现了大量与aggressive scirpt中`b`开头函数等价的api

#### lua 标准库

mal lua中同样支持lua标准库, 相关文档可以查阅 lua5.1文档. 
关于异步/并发的文档可以查阅 https://github.com/yuin/gopher-lua 与 http://godoc.org/github.com/yuin/gopher-lua

* package
* table
* io
* os
* string
* math
* debug
* channel
* coroutine

#### lua 拓展库

为了更方便的使用mal lua, 我们将一些常用工具包都导入到 mal lua中.

当前添加的拓展库

- [argparse](https://github.com/vadv/gopher-lua-libs/tree/master/argparse/) argparse CLI parsing [https://github.com/luarocks/argparse](https://github.com/luarocks/argparse)
- [base64](https://github.com/vadv/gopher-lua-libs/tree/master/base64/) [encoding/base64](https://pkg.go.dev/encoding/base64) api
- [cmd](https://github.com/vadv/gopher-lua-libs/tree/master/cmd/) cmd port
- [db](https://github.com/vadv/gopher-lua-libs/tree/master/db/) access to databases
- [filepath](https://github.com/vadv/gopher-lua-libs/tree/master/filepath/) path.filepath port
- [goos](https://github.com/vadv/gopher-lua-libs/tree/master/goos/) os port
- [humanize](https://github.com/vadv/gopher-lua-libs/tree/master/humanize/) humanize [github.com/dustin/go-humanize](https://github.com/dustin/go-humanize) port
- [inspect](https://github.com/vadv/gopher-lua-libs/tree/master/inspect/) pretty print [github.com/kikito/inspect.lua](https://github.com/kikito/inspect.lua)
- [ioutil](https://github.com/vadv/gopher-lua-libs/tree/master/ioutil/) io/ioutil port
- [json](https://github.com/vadv/gopher-lua-libs/tree/master/json/) json implementation
- [log](https://github.com/vadv/gopher-lua-libs/tree/master/log/) log port
- [plugin](https://github.com/vadv/gopher-lua-libs/tree/master/plugin/) run lua code in lua code
- [regexp](https://github.com/vadv/gopher-lua-libs/tree/master/regexp/) regexp port
- [shellescape](https://github.com/vadv/gopher-lua-libs/tree/master/shellescape/) shellescape [https://github.com/alessio/shellescape](https://github.com/alessio/shellescape) port
- [stats](https://github.com/vadv/gopher-lua-libs/tree/master/stats/) stats [https://github.com/montanaflynn/stats](https://github.com/montanaflynn/stats) port
- [storage](https://github.com/vadv/gopher-lua-libs/tree/master/storage/) package for store persist data and share values between lua states
- [strings](https://github.com/vadv/gopher-lua-libs/tree/master/strings/) strings port (utf supported)
- [tcp](https://github.com/vadv/gopher-lua-libs/tree/master/tcp/) raw tcp client lib
- [template](https://github.com/vadv/gopher-lua-libs/tree/master/template/) template engines
- [time](https://github.com/vadv/gopher-lua-libs/tree/master/time/) time port
- [yaml](https://github.com/vadv/gopher-lua-libs/tree/master/yaml/) [gopkg.in/yaml.v2](https://gopkg.in/yaml.v2) port
- [http](https://github.com/cjoudrey/gluahttp) http
- [crypto](https://github.com/tengattack/gluacrypto)  hash(md5, sha1,sha256, HMAC...), base64, aes 

在lua脚本中, 可以通过 require 引入对应的依赖

```
local crypto = require("crypto")
```

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

![](/IoM/assets/Pasted%20image%2020250115001838.png)

!!! important "分发插件"
	[社区仓库](https://github.com/chainreactors/mal-community) 中的插件都通过zip包分发. 

	 也可以将刚刚的`hello.lua` 和 `mal.yaml` 打包成zip, 然后命令安装
	 
	 ```
	 mal install hello.zip 
	```


### register command

通过command函数， 可以将lua的函数注册到IoM client的命令中。

以一个简单的bof为例:

```lua
-- netUserAdd

local function parse_netuseradd_bof(args)
    local size = #args
    if size < 2 then
        error(">=2 arguments are allowed")
    end
    local username = args[1]
    local password = args[2]
    return bof_pack("ZZ", username, password)
end

local function run_netuseradd_bof(args)
    args = parse_netuseradd_bof(args)
    local session = active()
    local arch = session.Os.Arch
    if not isadmin(session) then
        error("You need to be an admin to run this command")
    end
    local bof_file = bof_path("NetUserAdd", arch)
    return bof(session, script_resource(bof_file), args, true)
end

command("common:netuseradd_bof", run_netuseradd_bof, "netuseradd_bof <username> <password>", "T1136")
```

需要注意的是 `"common:netuseradd_bof"`中的`:`表示命令层级. 在这个例子中表示将会注册上级命令common, 然后注册子命令netuseradd_bof。

这个是添加一个命令最小示例。当然也支持让这个命令更加丰富， 就像是原生的命令一样。

- `help("common:netuseradd_bof", "...")` , 添加long helper
- `example("common:netuseradd_bof", "...")` 添加命令行exmaple
- `opsec("common:netuseradd_bof", 9.8)` , 添加OPSEC 评分


添加compleler 自动补全,  我们提供了多组场景的自动补全参数

示例:

```lua
...
...

local rem_socks_cmd = command("rem_community:socks5", run_socks5, "serving socks5 with rem", "T1090")

bind_args_completer(rem_socks_cmd, { rem_completer() })
```

## 高级用法

### beacon package

beacon package 是否按照CobaltStrike的aggressive script的api签名封装的一套接口， 用来提供类似aggressive script 编写的体验。 

```lua
local beacon = require("beacon")

beacon.bexecute(active(), "whoami")
```

目前支持的所有aggressive script 风格的api文档请见: https://chainreactors.github.io/wiki/IoM/manual/mal/beacon/

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

### 动态new protobuf message

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
function load_rem()
    local rpc = require("rpc")

    local task = rpc.LoadRem(active():Context(), ProtobufMessage.New("modulepb.Request", {
        Name = "load_rem",
        Bin = read_resource("chainreactors/rem.dll"),
    }))
    wait(task)
end
```

### 注册为库

mals允许用户自行实现的插件作为类库，成为其他库的依赖。 

只需要将lib设置为ture
```yaml
name: community-lib
type: lua
author: M09Ic
version: v0.0.1
entry: main.lua
lib: true
depend_module: 
```

按照lua lib的写法实现即可在其他库中引用

```lua
local time = require("time")
require("lib.lib")
-- require("modules.noconsolation")
-- require("modules.bofnet")
local lib = {}

function lib.sharpblock(exe_path, exe_args)
    local rpc = require("rpc")
    local session = active()
    local sharpblock_file = "SharpBlock/SharpBlock_Like0x.exe"
    local randomname = random_string(16)
    local fullpipename = "\\\\.\\pipe\\" .. randomname
    local sharpblock_args = {
        "-e", fullpipename, "-s", "c:\\windows\\system32\\notepad.exe",
        "--disable-bypass-cmdline", "--disable-bypass-amsi",
        "--disable-bypass-etw", "-a", ""
    }
    if type(exe_args) == "table" then
        sharpblock_args[#sharpblock_args] = table.concat(exe_args, " ")
    elseif type(exe_args) == "string" then
        sharpblock_args[#sharpblock_args] = exe_args
    end
    print(sharpblock_args)
    print("Pipe Name" .. fullpipename)
    local task = rpc.ExecuteAssembly(session:Context(),
                                     ProtobufMessage.New(
                                         "modulepb.ExecuteBinary", {
            Name = "SharpBlock_Like0x.exe",
            Arch = 1,
            Bin = read_resource(sharpblock_file),
            Type = "execute_assembly",
            Args = sharpblock_args,
            Timeout = 600
        }))
    time.sleep(4)
    local hack_browser_data_content = read(exe_path)
    hack_browser_data_content = base64_encode(hack_browser_data_content)
    print(#hack_browser_data_content)
    pipe_upload_raw(session, fullpipename, hack_browser_data_content)
    for i = 1, 5 do
        time.sleep(0.1)
        pipe_upload_raw(session, fullpipename, "ok")
    end
end

return lib
```

```lua
local clib = require("common-lib")
clib.sharpblock(...,...)
```