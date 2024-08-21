# Implant

考虑到红队人员的使用习惯， 本 `Implant` 所支持的命令将大量沿用 `CS` 工具的命令及使用习惯

欢迎各位对想要的功能和使用中遇到的问题提 `issues` 🙋

## Build

rust在编译上是个很复杂的语言.  malefic更是依赖了一些`nightly`的特性, 导致无法在所有rust版本上编译通过.  **需要指定特定日期版本的toolchain, target才能编译通过** . 

为此, 我们将准备多个编译方案, 有rust使用经验的用户可以[尝试使用本地环境编译](#build) , 初次使用rust的用户建议使用[docker提供的预配好的环境](#docker-build)进行. 

后续还将提供基于github action的自动化编译方案, 尽可能在编译上减少困难. 
### 环境准备

clone malefic 项目

```
git clone --recurse-submodules https://github.com/chainreactors/malefic
```

!!! tips "注意clone子项目"
	需要添加`--recurse-submodules`递归克隆子项目. 如果已经clone也不必担心,`git submodule update --init` 即可


#### 本机

!!! danger "toolchain架构"
	因为自动化编译出现了一些问题, 暂时只提供了GNU套件的库文件, MSVC预计在8月内可以提供. 手动编译时请注意, toolchain也需要为GNU

`rust` 工具链安装， 由于我们使用了 `nightly` 的一些特性， 因此需要特殊版本 `rust` 套件进行编译， 具体安装如下:

```bash
rustup default nightly-2024-08-16
```

!!! danger "rust toolchain需要指定版本"
	经过测试`nightly-2024-08-16` 能稳定编译, 其他版本未经过测试, 可能会有报错. 

添加对应的目标编译架构

```bash
rustup target add x86_64-pc-windows-gnu
```

!!! danger "rust编译时间"
	由于 `rust` 的特殊性， 首次编译速度将会十分缓慢， 请耐心等待， 在没有特殊情况下不要轻易 `make clean` 或 `cargo clean` ：）
	
#### docker

因为rust环境安装与编译的复杂性, 我们提供了 `Docker` 环境来进行编译, 通过提前配置好的环境一键交叉编译implant.

```bash
docker-compose up -d --build
```

#### github action (🛠️)

### 编译melafic

当前支持的全部架构, 理论上支持各种IoT常用的架构, 还需要后续测试(欢迎提供这方面的反馈):

```
make community_win64
make community_win32
make community_linux32 (编译暂时有bug, 修复中)
make community_linux64
make community_darwin_arm64 (编译暂时有bug, 修复中)
make community_darwin64 (编译暂时有bug, 修复中)
```

生成的文件将在对应 `target\[arch]\release\` 中

#### 本机编译

使用 `make` 命令进行对应环境的编译

```bash
make community_win64
```

!!! tips "windows安装make"
	windows中可以使用`scoop install make`或者`winget install make`安装Make工具

如果不想安装make, 可以手动指定命令:
```
cargo build --release -p malefic --target x86_64-pc-windows-gnu
```

#### docker编译

docker 环境映射了本机的代码路径

```bash
docker exec -it implant-builder /bin/bash
```

```
make community_win64
```

等待自动下载完依赖并编译即可, 如果docker环境遇到报错, 请提供[issue](https://github.com/chainreactors/malefic/issues)

### 编译独立模块 

独立模块暂时没提供makefile, 后续会提供各种预设.

编译独立模块

```
cargo build --release --features "sys_execute_shellcode sys_execute_assembly" -p malefic-modules --target x86_64-pc-windows-gnu
```

??? info "所有支持的feautres"
	请见 https://github.com/chainreactors/malefic/blob/master/malefic-modules/Cargo.toml
	
	fs_ls = ["fs"]  
	fs_cd = ["fs"]  
	fs_rm = ["fs"]  
	fs_cp = ["fs"]  
	fs_mv = ["fs"]  
	fs_pwd = ["fs"]  
	fs_mem = ["fs"]  
	fs_mkdir = ["fs"]  
	fs_chmod = ["fs"]  
	fs_cat = ["fs"]  
	  
	sys_info = ["sys"]  
	sys_ps = ["sys"]  
	sys_id = ["sys"]  
	sys_env = ["sys"]  
	sys_whoami = ["sys"]  
	sys_exec = ["sys"]  
	sys_kill = ["sys"]  
	sys_execute_shellcode = ["sys"]  
	sys_execute_assembly = ["sys"]  
	sys_execute_bof = ["sys"]  
	sys_execute_pe = ["sys"]  
	sys_execute_powershell = ["sys"]  
	sys_netstat = ["sys"]  
	  
	net_upload = ["net"]  
	net_download = ["net"]


编译结果为`target\[arch]\release\modules.dll`

可以使用`load_module`热加载这个dll 

!!! important "module动态加载目前只支持windows"
	linux与mac在理论上也可以实现

常见的使用场景:

1.  编译一个不带任何modules的malefic, 保持静态文件最小特征与最小体积. 通过`load_module modules.dll` 动态加载模块
2. 根据场景快速开发module, 然后动态加载到malefic中. 
3. 长时间保持静默的场景可以卸载所有的modules, 并进入到sleepmask的堆加密状态.  等需要操作时重新加载modules
## Config

`Implant` 同样拥有一个 `config.yaml` 以对生成的 `implant` 进行配置：

会在编译时通过`malefic-config` 自动解析各种feature与参数配置. 

### Server

与server通讯相关的配置. 

* `Server` 字段包含了以下连接配置:

	* `urls`: `implant` 所需要建立连接的目标 `ip:port` 或 `url:port` 列表
	
	* `protocol` : `implant` 所使用的传输协议
	
	* `tls` : `implant` 是否需要使用 `tls`
	
	* `interval` :  每次建立连接的时间间隔(单位为 `milliseconds`)
	
	* `jitter`: 每次建立连接时的时间间隔抖动(单位为 `milliseconds`)
	
	* `ca` : 所使用的证书路径

### implants

implant端各种opsec与高级特性的配置.  在community中带🔒表示配置不生效. 

`Implant` 字段包含以下可选生成物配置：

* `modules`: 生成物所需要包含的功能模块， 如默认提供的 `base` 基础模块及 `full` 全功能模块， 或自行组装所需功能模块, 详见章节 `Extension` 部分

#### metadata
* `metadata`: 生成物元特征：
    * `remap_path`: 编译绝对路径信息
    * `icon`
    * `file_version` 
    * `product_version`
    * `company_name`
    * `product_name`
    * `original_filename`
    * `file_description`
    * `internal_name`

#### apis 🔒

在 `EDR` 的对抗分析中， 我们支持在组装 `Implant` 时由用户自行选择使用各级别的 `API`， 如直接调用系统 `API`, 动态获取并调用， 通过 `sysall` 调用，这可以有效减少程序 `Import` 表所引入的的特征

在 `syscall` 调用中， 我们支持使用各类门技术来调用系统调用而非直接调用用户层 `API`， 以防止 `EDR` 对常用红队使用的 `API` 进行监控， 如何配置可见 `Implant Config File` 对应 `apis` 部分

* apis: 
    * `level` : 使用上层api还是nt api, `"sys_apis"` , `"nt_apis`
    * `priority`:
        * `normal` : 直接调用 
        * `dynamic` : 动态调用
            * `type`: 如自定义获取函数地址方法 `user_defined_dynamic`, 系统方法`sys_dynamic` (`LoadLibraryA/GetProcAddress`)
        * `syscall`: 通过 `syscall`调用
            * `type`: 生成方式, 函数式 `func_syscall`, inline 调用 `inline_syscall


#### alloctor 🔒
* allactor: 
    * `inprocess`: 进程内分配函数, `VirtualAlloc`, `VirtualAllocEx`, `HeapAlloc`, `NtAllocateVirtualMemory`, `VirtualAllocExNuma`, `NtMapViewOfSection`
    * `crossprocess`: 进程间分配函数, `VirtualAllocEx`, `NtAllocateVirtualMemory`,
    `VirtualAllocExNuma`, `NtMapViewOfSection`

#### advance feautres 🔒

`sleep_mask`: 睡眠混淆是否开启 👤

`sacriface_process`: 是否需要牺牲进程功能

`fork_and_run`: 是否需要使用 `fork and run` 机制

`hook_exit`: 是否需要对退出函数进行 `hook` 以防止误操作导致的退出

`thread_task_spoofer`: 是否需要自定义线程调用堆栈 👤

## Module

module是implant中功能的基本单元, 各种拓展能力(bof,pe,dll)的执行也依赖于module实现. 

### 已实现modules

不同操作系统与架构支持的module不同. 具体支持下表:

| 功能                | windows-x86 | windows-x86_64 | windows-arm* | linux-x86_64 | linux-arm | linux-aarch64 | macOS-intel | macOS-arm |
| ----------------- | ----------- | -------------- | ------------ | ------------ | --------- | ------------- | ----------- | --------- |
| ls                | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| cd                | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| mv                | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| pwd               | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| mem               | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| mkdir             | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| chomd             | ✗           | ✗              | ✗            | ✓            | ✓         | ✓             | ✓           | ✓         |
| chown             | ✗           | ✗              | ✗            | ✓            | ✓         | ✓             | ✓           | ✓         |
| cat               | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| upload            | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| download          | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| env               | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| kill              | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| whoami            | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| ps                | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| netstat           | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| exec              | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| command           | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| execute_shellcode | ✓           | ✓              | ✓            | ✓            | ✓         | ✓             | ✓           | ✓         |
| execute_assembly  | ✓           | ✓              | ✓            | ✗            | ✗         | ✗             | ✗           | ✗         |
| powershell        | ✓           | ✓              | ✓            | ✗            | ✗         | ✗             | ✗           | ✗         |
| execute_pe        | ✓           | ✓              | ✓            | ✗            | ✗         | ✗             | ✗           | ✗         |
| execute_bof       | ✓           | ✓              | ✓            | ✗            | ✗         | ✗             | ✗           | ✗         |
| hot_module_load   | ✓           | ✓              | ✓            | ✗            | ✗         | ✗             | ✗           | ✗         |


### Professional Features 🔒

部分module需要依赖各类kits中的高级特性, 在community中只提供了默认特征的版本.

| 目标系统 | 目标架构    | sleep_mask | obfstr | fork&run | thread_stack_spoof | syscall | dynamic_api |
| -------- | ----------- | ---------- | ------ | -------- | ------------------ | ------- | ----------- |
| windows  | x86         | ✗         | ✓     | ✓       | ✓                 | ✓      | ✓          |
|          | x86_64      | ✓         | ✓     | ✓       | ✓                 | ✓      | ✓          |
|          | arm/aarch64 | ✗         | ✓     | ✓       | ✓                 | ✗      | ✓          |
| linux    | intel       | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |
|          | arm         | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |
|          | mips        | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |
| macOS    | intel       | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |
|          | arm         | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |

### Dynamic Module

malefic的设计理念之一就是模块化, 自由组装. modules部分的设计也提现了这个理念. 

通过rust自带的`features`相关功能, 可以控制编译过程中的模块组装.  目前提供了三种预设

??? info "modules预设"
```
full = [  
    "fs_ls",  
    "fs_cd",  
    "fs_rm",  
    "fs_cp",  
    "fs_mv",  
    "fs_pwd",  
    "fs_mem",  
    "fs_mkdir",  
    "fs_chmod",  
    "fs_cat",  
    "net_upload",  
    "net_download",  
    "sys_info",  
    "sys_exec",  
    "sys_execute_shellcode",  
    "sys_execute_assembly",  
    "sys_execute_powershell",  
    "sys_execute_bof",  
    "sys_execute_pe",  
    "sys_env",  
    "sys_kill",  
    "sys_whoami",  
    "sys_ps",  
    "sys_netstat",  
]  
  
base = [  
    "fs_ls",  
    "fs_cd",  
    "fs_rm",  
    "fs_cp",  
    "fs_mv",  
    "fs_pwd",  
    "fs_cat",  
    "net_upload",  
    "net_download",  
    "sys_exec",  
    "sys_env",  
]  
  
extend = [  
    "sys_kill",  
    "sys_whoami",  
    "sys_ps",  
    "sys_netstat",  
    "sys_execute_bof",  
    "sys_execute_shellcode",  
    "sys_execute_assembly",  
    "fs_mkdir",  
    "fs_chmod",  
]
```


当然也可以根据喜好自行组装功能模块， 当然， 由于我们提供了动态加载及卸载模块的功能， 您可以随时添加新模块.


!!! danger "编译时组装的模块无法被卸载" 
	这里有一个好消息与一个坏消息.
	坏消息是编译时组装的模块无法被卸载, 因此请根据自己的使用场景选择合适的预设.
	好消息是虽然无法卸载, 但加载新模块时如您选用了同样名称的模块, 新模块将覆盖本体的模块.(在内存中原本的模块依旧会存在)


#### module管理

就像开始所说的那样， `malefic` 支持您生成时组装所需功能模块， 同时也支持启动后动态的加载和卸载所需的功能模块. 我们提供了一组api用来管理模块.  具体的使用请见[使用文档module部分](IoM/manual/help/#_2)

- `list_modules` 命令允许您列举当前 `Implant` 所持有的模块
- `load_modules` 命令则支持您动态加载本地新组装的模块， 只需要 `load_modules --name xxx --path module.dll` 即可动态加载新的模块， 请注意， 如本体已经含有的模块（生成时组装的模块）， 再次加载将会覆盖该模块的功能， 是的， `load_modules` 允许您修改本体功能以满足您的需求
- `unload_modules` 🛠️ 命令则会卸载您使用 `load_modules` 命令所加载的对应 `name` 的模块， 请注意， 生成时确定的模块是无法卸载的， 但这些模块可以被您加载的新模块所覆盖
- `refresh_modules` 🛠️ 命令将会卸载所有动态加载的模块， 包括您覆盖掉的本体模块， 一切模块将恢复成您生成时的初始状态

在[模块开发文档](IoM/manual/develop)中可以找到如何快速编写自定义模块的文档. 

## Windows Kit

关于 `Windows` 平台特有功能， 可以查阅 [win_kit](./implant_win_kit.md)