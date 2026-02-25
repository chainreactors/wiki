
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
- community-domain 域渗透工具包

## mal api
mal 是一个支持多语言的插件系统, 但目前只有lua达到基本可用阶段, 因此仅提供基于lua语言实现的文档.

## 插件管理

### mal 管理命令

| 命令 | 说明 |
|------|------|
| `mal list` | 列出所有已安装的 mal 插件 |
| `mal load [mal]` | 加载指定的 mal 插件 |
| `mal install [mal_file]` | 安装 mal 插件（支持 zip 格式） |
| `mal remove [mal]` | 移除 mal 插件 |
| `mal refresh` | 刷新 mal 插件列表 |
| `mal update [mal]` | 更新指定插件或全部插件（`--all`） |

**示例：**
```bash
# 安装插件
mal install community-common.zip

# 加载插件
mal load hello

# 更新所有插件
mal update --all
```

### Armory（武器库）

Armory 是 IoM 的包管理器，可自动下载和安装 extension 和 alias。

| 命令 | 说明 |
|------|------|
| `armory` | 列出可用的武器库包 |
| `armory install [name]` | 安装指定包 |
| `armory update` | 更新已安装的包 |
| `armory search [name]` | 搜索武器库包 |

**armory 主命令标志：**

| 标志 | 简写 | 说明 |
|------|------|------|
| `--insecure` | `-I` | 跳过 TLS 证书验证 |
| `--proxy` | `-p` | 代理 URL |
| `--ignore-cache` | `-c` | 忽略缓存，强制刷新 |
| `--timeout` | `-t` | 下载超时 |
| `--bundle` | | 安装 bundle |

**armory install 标志：**

| 标志 | 简写 | 说明 |
|------|------|------|
| `--force` | `-f` | 强制安装 |
| `--armory` | `-a` | 指定武器库名称（默认：Default） |

**示例：**
```bash
# 搜索可用包
armory search rubeus

# 安装包
armory install rubeus

# 强制重新安装
armory install rubeus --force

# 通过代理安装
armory --proxy http://localhost:8080 install rubeus
```

### Extension（扩展）

Extension 是基于 manifest 定义的可执行扩展，支持 BOF、.NET 程序集等多种格式。

| 命令 | 说明 |
|------|------|
| `extension list` | 列出所有已加载的扩展 |
| `extension load [path]` | 从目录加载扩展 |
| `extension install [file]` | 安装扩展（tar.gz 格式） |
| `extension remove [name]` | 移除扩展 |

**示例：**
```bash
# 安装扩展
extension install ./credman.tar.gz

# 从目录加载
extension load ./credman/

# 移除扩展
extension remove credman
```

### Alias（别名）

Alias 将可执行文件封装为 IoM 命令，通过 manifest.json 定义命令名称、参数和执行方式。

| 命令 | 说明 |
|------|------|
| `alias list` | 列出所有已加载的别名 |
| `alias load [path]` | 从目录加载别名 |
| `alias install [file]` | 安装别名（可执行文件） |
| `alias remove [name]` | 移除别名 |

**示例：**
```bash
# 安装别名
alias install ./rubeus.exe

# 从目录加载
alias load /tmp/chrome-dump

# 移除别名
alias remove rubeus
```