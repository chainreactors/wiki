
mals是IoM的插件仓库, 可以通过lua/go为IoM编写插件脚本

并提供了官方索引仓库: https://github.com/chainreactors/mals 

### mal-community

mal-community 是一组通用插件的合集, 这些插件大多来自为Cobaltstrike实现的aggressive script , 通过将CNA移植到mal, 使其能运行在IoM生态上. 

repo: https://github.com/chainreactors/mal-community

mal-community分为多个细分用途的子目录, 可以独立安装

- community-lib ,工具库, 可以当作库被其他插件使用
	- [sharpblock](https://github.com/CCob/SharpBlock) 
	- [NET.BOF](https://github.com/CCob/BOF.NET) (TODO)
	- [No-Consolation](https://github.com/fortra/No-Consolation)
- community-common, 常用工具包
	- [OperatorsKit](https://github.com/REDMED-X/OperatorsKit)
	- [CS-Remote-OPs-BOF](https://github.com/trustedsec/CS-Remote-OPs-BOF)
	- [CS-Situational-Awareness-BOF](https://github.com/trustedsec/CS-Situational-Awareness-BOF)
	- chainreactor工具
		- [gogo](https://github.com/chainreactors/gogo)
		- [zombie](https://github.com/chainreactors/zombie)
	- misc 未分类的常用工具集合
- community-elevate 提权工具包
	- [ElevateKit](https://github.com/rsmudge/ElevateKit)
	- [UAC-BOF-Bonanza](https://github.com/icyguider/UAC-BOF-Bonanza)
- community-proxy 代理工具包
	- gost
- community-move 横向移动工具包
- community-persistence 权限维持工具包
- community-domain🛠️ 域渗透工具包

## mal api
mal 是一个支持多语言的插件系统, 但目前除了lua之外的语言并没有达到基本可用阶段, 因此目前仅提供基于lua语言实现的文档.

### lua api

mal lua基于lua 5.1 (https://github.com/yuin/gopher-lua)实现. 

lua 是一门非常简单的脚本语言, 上手难度远远低于python, 也低于aggressive script. 如果尝试使用过python或aggressive scirpt 就可以直接上手lua. 通过AI大模型辅助, 更是可以指挥AI去帮你实现绝大部分功能. 

[lua5.1 reference](https://www.lua.org/manual/5.1/)

[lua5.1 maunal](https://www.lua.org/manual/5.1/manual.html)

*我们在实现基于lua的插件时, 几乎没看过任何lua有关的文档, 相信有任意编程语言的经验都能很快掌握lua.* 

#### mal package

目前mal lua 已经实现了数百个api, 为了更好的管理与分类这些api. 我们将这些api分到三个package中. 

* [builtin](/wiki/IoM/manual/mal/builtin/), 直接在当前上下文可用, mal相关核心api
* [rpc](/wiki/IoM/manual/mal/rpc/), grpc相关api的lua实现
* [beacon](/wiki/IoM/manual/mal/builtin/), 对CobaltStrike的兼容层api. 实现了大量与aggressive scirpt中`b`开头函数等价的api

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
