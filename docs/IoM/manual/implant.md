# Implant

考虑到红队人员的使用习惯， 本 `Implant` 所支持的命令将大量沿用 `CS` 工具的命令及使用习惯

欢迎各位对想要的功能和使用中遇到的问题提 `issues` 🙋

### Compile

rust在编译上是个很复杂的语言.  malefic更是依赖了一些`nightly`的特性, 导致无法在所有rust版本上编译通过. 需要指定特定日期版本的toolchain, target才能编译通过. 

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

#### build

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

#### 编译独立模块  (🛠️)



## Config

`Implant` 同样拥有一个 `config.yaml` 以对生成的 `implant` 进行配置：

* `Server` 字段包含了以下连接配置:

	* `urls`: `implant` 所需要建立连接的目标 `ip:port` 或 `url:port` 列表
	
	* `protocol` : `implant` 所使用的传输协议
	
	* `tls` : `implant` 是否需要使用 `tls`
	
	* `interval` :  每次建立连接的时间间隔(单位为 `milliseconds`)
	
	* `jitter`: 每次建立连接时的时间间隔抖动(单位为 `milliseconds`)
	
	* `ca` : 所使用的证书路径

`Implant` 字段包含以下可选生成物配置：

* `modules`: 生成物所需要包含的功能模块， 如默认提供的 `base` 基础模块及 `full` 全功能模块， 或自行组装所需功能模块, 详见章节 `Extension` 部分

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

* apis: 🔒
    * `level` : 使用上层api还是nt api, `"sys_apis"` , `"nt_apis`
    * `priority`:
        * `normal` : 直接调用 
        * `dynamic` : 动态调用
            * `type`: 如自定义获取函数地址方法 `user_defined_dynamic`, 系统方法`sys_dynamic` (`LoadLibraryA/GetProcAddress`)
        * `syscall`: 通过 `syscall`调用
            * `type`: 生成方式, 函数式 `func_syscall`, inline 调用 `inline_syscall`
* allactor: 🔒
    * `inprocess`: 进程内分配函数, `VirtualAlloc`, `VirtualAllocEx`, `HeapAlloc`, `NtAllocateVirtualMemory`, `VirtualAllocExNuma`, `NtMapViewOfSection`
    * `crossprocess`: 进程间分配函数, `VirtualAllocEx`, `NtAllocateVirtualMemory`,
    `VirtualAllocExNuma`, `NtMapViewOfSection`

`sleep_mask`: 睡眠混淆是否开启 👤

`sacriface_process`: 是否需要牺牲进程功能

`fork_and_run`: 是否需要使用 `fork and run` 机制

`hook_exit`: 是否需要对退出函数进行 `hook` 以防止误操作导致的退出

`thread_task_spoofer`: 是否需要自定义线程调用堆栈 👤

## APIs

在 `EDR` 的对抗分析中， 我们支持在组装 `Implant` 时由用户自行选择使用各级别的 `API`， 如直接调用系统 `API`, 动态获取并调用， 通过 `sysall` 调用，这可以有效减少程序 `Import` 表所引入的的特征

在 `syscall` 调用中， 我们支持使用各类门技术来调用系统调用而非直接调用用户层 `API`， 以防止 `EDR` 对常用红队使用的 `API` 进行监控， 如何配置可见 `Implant Config File` 对应 `apis` 部分

## Extension

Implant 支持多种方式动态加载及调用各类插件及功能, 支持架构/位数及功能详见如下表

1. 隐藏部分

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

1. 功能部分

| 功能                             | windows-x86 | windows-x86_64 | windows-arm* | linux-x86_64 | linux-arm | linux-aarch64 | macOS-intel | macOS-arm |
| -------------------------------- | ----------- | -------------- | ------------ | ------------ | --------- | ------------- | ----------- | --------- |
| fs_ls                            | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| fs_cd                            | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| fs_mv                            | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| fs_pwd                           | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| fs_mem                           | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| fs_mkdir                         | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| fs_chomd                         | ✗          | ✗             | ✗           | ✓           | ✓        | ✓            | ✓          | ✓        |
| fs_chown                         | ✗          | ✗             | ✗           | ✓           | ✓        | ✓            | ✓          | ✓        |
| fs_cat                           | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| net_upload                       | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| net_download                     | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| sys_env                          | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| sys_kill                         | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| sys_whoami                       | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| sys_ps                           | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| sys_netstat                      | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| sys_exec                         | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| sys_command                      | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| sys_execute_shellcode            | ✓          | ✓             | ✓           | ✓           | ✓        | ✓            | ✓          | ✓        |
| sys_execute_assembly             | ✓          | ✓             | ✓           | ✗           | ✗        | ✗            | ✗          | ✗        |
| sys_execute_unmanaged_powershell | ✓          | ✓             | ✓           | ✗           | ✗        | ✗            | ✗          | ✗        |
| sys_execute_pe                   | ✓          | ✓             | ✓           | ✗           | ✗        | ✗            | ✗          | ✗        |
| sys_execute_bof                  | ✓          | ✓             | ✓           | ✗           | ✗        | ✗            | ✗          | ✗        |
| hot_module_load                  | ✓          | ✓             | ✓           | ✗            | ✗         | ✗             | ✗          | ✗        |

### Dynamic Module

`Implant` 的自带功能被称为 `Module`, 所有的 `Module` 均可以在组装 `Implant` 时自行拆卸组装， 随后在运行时使用 Load module 功能即可动态安装功能， 加载成功后， 可使用 `list_module` 功能遍历现有功能模块以使用

如何组装模块可参照 `Implant Config File` 部分及前述功能表， 默认提供两种组装模式:

1. Full 功能表中对应系统及架构支持的全部功能
2. Base  (` "fs_ls", "fs_cd", "fs_rm", "fs_cp","fs_mv", "fs_pwd", "fs_cat",  "net_upload", "net_download", "sys_exec", "sys_env"`)

您也可以根据喜好自行组装功能模块， 当然， 由于我们提供了动态加载及卸载模块的功能， 您可以随时添加新模块

请注意， 生成时组装的模块永远无法被卸载， 因此在极端情况下请斟酌选用， 但虽然无法卸载， 但加载新模块时如您选用了同样名称的模块， 新模块将覆盖本体的模块， 以提供一些灵活性

关于生成后的模块管理， 具体请参考 `Post Exploitation` 章节中 `Modules` 这一小节的内容

#### Implant module manager

就像开始所说的那样， 我们的 `Implant` 支持您生成时组装所需功能模块， 同时也支持您在 `Implant` 启动后动态的加载和卸载所需的功能模块， 因此我们也提供了 `Modules` 管理命令

- `list_modules` 命令允许您列举当前 `Implant` 所持有的模块
- `load_modules` 命令则支持您动态加载本地新组装的模块， 只需要 `load_modules --name xxx --path module.dll` 即可动态加载新的模块， 请注意， 如本体已经含有的模块（生成时组装的模块）， 再次加载将会覆盖该模块的功能， 是的， `load_modules` 允许您修改本体功能以满足您的需求
- `unload_modules` 命令则会卸载您使用 `load_modules` 命令所加载的对应 `name` 的模块， 请注意， 生成时确定的模块是无法卸载的， 但这些模块可以被您加载的新模块所覆盖
- `refresh_modules` 命令将会卸载所有动态加载的模块， 包括您覆盖掉的本体模块， 一切模块将恢复成您生成时的初始状态

#### 模块开发

当然， 您也可以自行编写您自己别具特色的 `Module` ， 我们提供了灵活的编写接口及解析规范

**proto**

对于有 `proto` 编写习惯的开发人员， 您可以在 `implant.proto` 中自行添加自己的 `proto` 规则

而对于没有 `proto` 编写习惯或经验的开发人员， 我们也留好了预设接口， 即使用 `Request` 和 `Response` 块来进行使用

```protobuf
// common empty request
message Request {
  string name = 1;
  string input = 2;
  repeated string args = 3;
  map<string, string> params = 4;
}
// common empty response
message Response {
  string output = 1;
  string error = 2;
  map<string, string> kv = 3;
}
```

**Module**

1. 泛型声明

在选用您的 `proto` 传输规则后， 就可以开始编写您自己的 `Module` 了，您只需要使用如下泛型

```rust
#[async_trait]
pub trait Module {
    fn name() -> &'static str where Self: Sized;
    fn new() -> Self where Self: Sized;
    fn new_instance(&self) -> Box<MaleficModule>;
    async fn run(&mut self,
                 id: u32,
                 recv_channel: &mut Input,
                 send_channel: &mut Output) -> Result;
}
```

由于我们已经实现了一个过程宏 `module_impl`， 因此您无需编写杂余代码， 只需要关注具体功能 `run` 函数即可.

其中参数如下:

`id` : 即为 Task_id， 在前面的段落中我们提到，每一个用户提交的任务都被视为一个 `Task`, 并通过唯一的 `Task_id` 来进行任务状态管理

`recv_channel`: 用于接收您所传入需要解析的数据

`send_channel`: 用于将您所需要传出的数据发送给数据处理模块， 以发送给您

返回值

`Result`: 如果您不需要多次传数据， 只需要将返回的数据放入 `Result` 中即可

1. 示例

接下来我们以 `cat` 功能为例带您编写一个 `Module` :)

首先我们需要定义 `Module` 并继承拓展我们的泛型, 下面为一个使用 `response` 和 `request` 的 `proto` 传输数据的基本模版

```rust
use async_trait::async_trait;
use malefic_trait::module_impl;
use crate::{check_request, Module, Result, check_field, TaskResult};
use crate::protobuf::implantpb::spite::Body;

pub struct ModuleName{}

#[async_trait]
#[module_impl("module_name")]
impl Module for ModuleName {
    #[allow(unused_variables)]
    async fn run(&mut self, id: u32, recviver: &mut crate::Input, sender: &mut crate::Output) -> Result {
        let request = check_request!(recviver, Body::Request)?;
        let mut response = crate::protobuf::implantpb::Response::default();
        Ok(TaskResult::new_with_body(id, Body::Response(response)))
    }
}
```

接下来我们将其修改为 `cat` 的基本框架， 您需要修改的地方有两点（结构体名称，`#[module_impl("")]` 宏中的名称， 该名称即为后续在 `Implant` 中所调用功能的名称）

```rust
use async_trait::async_trait;
use malefic_trait::module_impl;
use crate::{check_request, Module, Result, check_field, TaskResult};
use crate::protobuf::implantpb::spite::Body;

pub struct Cat{}

#[async_trait]
#[module_impl("cat")]
impl Module for Cat {
    #[allow(unused_variables)]
    async fn run(&mut self, id: u32, recviver: &mut crate::Input, sender: &mut crate::Output) -> Result {
        let request = check_request!(recviver, Body::Request)?;
        let mut response = crate::protobuf::implantpb::Response::default();
        Ok(TaskResult::new_with_body(id, Body::Response(response)))
    }
}
```

修改后您可以通过 `check_field!()` 这个宏来尝试获取结构体中的内容, 执行命令后将可能的结果填回 `response` 中

```rust
use async_trait::async_trait;
use malefic_trait::module_impl;
use crate::{check_request, Module, Result, check_field, TaskResult};
use crate::protobuf::implantpb::spite::Body;

pub struct Cat{}

#[async_trait]
#[module_impl("cat")]
impl Module for Cat {
    #[allow(unused_variables)]
    async fn run(&mut self, id: u32, recviver: &mut crate::Input, sender: &mut crate::Output) -> Result {
        let request = check_request!(recviver, Body::Request)?;

        let filename = check_field!(request.input)?;
        let content = std::fs::read_to_string(filename)?;

        let mut response = crate::protobuf::implantpb::Response::default();
        response.output = content;

        Ok(TaskResult::new_with_body(id, Body::Response(response)))
    }
}
```

是的， 由于我们做了很多宏， 因此在正常情况下您可以基本忽略错误处理， 只需要关注您本身的功能即可

同样的， 如果您的任务需要多次数据传输和结果发送， 您可以多次调用 `check_request!(recviver, Body::Request)?;` 来获取数据， 并使用 `sender.send()` 函数来发送一个 `TaskResult` 格式的数据

## Windows Kit

关于 `Windows` 平台特有功能， 您可以查阅 [win_kit](./implant_win_kit.md)