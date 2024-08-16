# Implant

考虑到红队人员的使用习惯， 本 `Implant` 所支持的命令将大量沿用 `CS` 工具的命令及使用习惯

欢迎各位对想要的功能和使用中遇到的问题提 `issues` 🙋

### Compile

为便于社区尝鲜使用， 我们选用 `docker` 配合 `gnu` 套件进行编译， `msvc`支持随后便到


### build

除了 `docker`, 我们也推荐您使用自行组装的工具链进行编译
(比如社区版本我们未提供gnu套件的清理工具, 这会导致 `implant` 生成时体积膨胀的问题， 如您使用windows在`msvc`套件中进行编译， 这种情况将会得到缓解， `msvc` 库正在路上~~)

`rust` 工具链安装， 由于我们使用了 `nightly` 版本进行开发， 而 `nightly` 往往是不稳定的， 因此需要特殊版本 `rust` 套件进行编译， 具体安装如下:

```bash
rustup install nightly
rustup toolchain install nightly-2023-12-12
rustup default nightly-2023-12-12-x86_64-pc-windows-msvc
```

如需多个架构，添加支持命令如下:

```bash
rustup target add i686-pc-windows-msvc
```

可以使用如下命令进行列出所有支持的 `target`

```bash
rustup target list
```

安装后您就可以自行发挥了， 具体可参照 `Makefile` 进行


!!! important "rust编译时间"
	由于 `rust` 的特殊性， 首次编译速度将会十分缓慢， 请耐心等待， 在没有特殊情况下不要轻易 `make clean` 或 `cargo clean` ：）

### docker build
因为rust环境安装与编译的复杂性, 我们提供了 `Docker` 环境来进行编译, 通过提前配置好的环境一键交叉编译implant.

```bash
docker-compose up -d --build
```
随后使用
```bash
docker exec -it implant-builder /bin/bash
```
在其中使用 `make` 命令进行对应环境的编译
```bash
make community_win64
make community_win32
make community_linux32
make community_linux64
make community_darwin_arm64
make community_darwin64
```

生成的文件将在对应 `target\arch\release\` 中

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

* apis: **Private** 🔒
    * `level` : 使用上层api还是nt api, `"sys_apis"` , `"nt_apis`
    * `priority`:
        * `normal` : 直接调用 
        * `dynamic` : 动态调用
            * `type`: 如自定义获取函数地址方法 `user_defined_dynamic`, 系统方法`sys_dynamic` (`LoadLibraryA/GetProcAddress`)
        * `syscall`: 通过 `syscall`调用
            * `type`: 生成方式, 函数式 `func_syscall`, inline 调用 `inline_syscall`
* allactor: **Private** 🔒
    * `inprocess`: 进程内分配函数, `VirtualAlloc`, `VirtualAllocEx`, `HeapAlloc`, `NtAllocateVirtualMemory`, `VirtualAllocExNuma`, `NtMapViewOfSection`
    * `crossprocess`: 进程间分配函数, `VirtualAllocEx`, `NtAllocateVirtualMemory`,
    `VirtualAllocExNuma`, `NtMapViewOfSection`

`sleep_mask`: 睡眠混淆是否开启 **Professional** 👤

`sacriface_process`: 是否需要牺牲进程功能

`fork_and_run`: 是否需要使用 `fork and run` 机制

`hook_exit`: 是否需要对退出函数进行 `hook` 以防止误操作导致的退出

`thread_task_spoofer`: 是否需要自定义线程调用堆栈 **Professional** 👤

## APIs

在 `EDR` 的对抗分析中， 我们支持在组装 `Implant` 时由用户自行选择使用各级别的 `API`， 如直接调用系统 `API`, 动态获取并调用， 通过 `sysall` 调用，这可以有效减少程序 `Import` 表所引入的的特征

在 `syscall` 调用中， 我们支持使用各类门技术来调用系统调用而非直接调用用户层 `API`， 以防止 `EDR` 对常用红队使用的 `API` 进行监控， 如何配置可见 `Implant Config File` 对应 `apis` 部分

### Process

#### Process hollow

在用户有调用 `PE/Shellcode` 各类格式的需求时， `Implant` 支持 `Process Hollow` 技术， 以伪装用户的调用需求

#### **WIP** 🛠️ Process Ghost

#### **WIP** 🛠️ Transacted Hollowing

#### Sacrifice Process

Fork&Run 虽然已经不是 opsec 的选择， 但是某些情况下还是避不开使用这个技术。

为便于理解， 您可以将所有需要产生新进程的行为均理解为生成了一个 `牺牲进程`， 即包含下面将阐述的所有概念及功能

所有上述支持使用 `Sacrifice Process` 即 `牺牲进程` 的功能都会可以通过参数 `--sacrifice` 开启， 所有 `牺牲进程` 都是以 `SUSPEND` 及 `NO_WINDOWS` 的形式启动的， 在做完其余处理后再唤醒主线程， 您可以通过 `--param` 参数向 `牺牲进程` 传递启动参数， 如 `notepad.exe` , 并通过 `--output` 参数来决定是否需要捕获输出（如果您不确定执行结果是否有可获取的结果， 请小心使用 `output` 以避免 `Implant` 错误的等待一个可能永远不会得到的结果

支持牺牲进程的功能有:

- execute (默认启动牺牲进程， 无需增加参数）
- execute_pe
- execute_shellcode

我们也为 pe，shellcode 提供了更加 opsec 的 inline 版本(inline_pe/inline_shellcode).

接下来我们将以 `execute_shellcode` 功能来举例说明

```bash
# 命令示例
execute_shellcode --sacrifice --output --param "notepad.exe" ./loader.bin
```

当然， 由于原本意义上的 `Fork&Run` 耗能非常巨大且笨重， 如果确实需要也可以考虑后期添加

#### Alternate Parent Processes

所有上述支持 `牺牲进程` 的功能均可以自定义 `牺牲进程` 的 `ppid`, 只需在调用命令时添加 `--pid` 参数即可

您可以使用 `ps` 命令获取当前所有进程的快照内容

```bash
# 命令示例
execute_shellcode --sacrifice --pid 8888 --output --param "notepad.exe" ./loader.bin
```

#### Spoof Process Arguments

由于所有的牺牲进程都会以 `SUSPEND` 参数启动， 因此在执行命令时， 我们可以对从启动到真正执行时的参数进行替换， 即调用函数进行启动时为假的命令， 真正启动时变为真的命令

您可以使用 `argue` 命令来保存您的假命令， 如

```bash
# 命令示例
argue net fake_net
```

随后在牺牲进程启动时， 如传入参数为 `net` 将会替换为 `fake_net` 命令启动, 在执行命令时以 `net` 正确执行

```bash
# 命令示例
execute --ppid 8888 --output --param "net xxxx xxx"
```

只需如此调用， 启动时将会自动变为 `fakenet xxxx xxx`， 而在真实调用时变为 `net xxxx xxx`

#### Blocking DLLs

使用 `blockdlls start` 命令来使得以后启动的所有牺牲进程均需要验证将要加载的 `DLL` 的签名， 非微软签名的 `DLL` 将会被禁止加载于我们的 `牺牲进程中`, 使用 `blockdlls stop` 命令来结束这一行为

该功能需要在 `Windows 10` 及以上系统中使用

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

### Dll/EXE

`DLL/EXE` 是 `Windows` 中的可执行程序格式

在使用中， 您可能有动态加载调用 `PE` 文件的需求， 这些文件可能是某个 `EXP` 或某个功能模块， 因此

`Implant` 支持动态加载和调用 `DLL/EXE ` 文件， 并可选择是否需要获取标准输出， 如需要将会把输出发布给您

所有执行的 `DLL/EXE` 都无需落地在内存中直接执行， 通过调用参数来控制 `DLL/EXE` 在自身内存中调用或创建一个牺牲进程以调用， 具体请参照 `Post Exploitation` 章节中 `Running Commands` 和 `Sacrifice Process` 这一小节的内容

### Shellcode

常见的 `Shellcode` 为一段用于执行的短小精悍的代码段，其以体积小，可操作性大的方式广为使用， 因此

`Implant` 支持动态加载 `shellcode`, 并可选择在自身进程还是牺牲进程中调用

请注意，由于 `Implant` 无法分辨您的 `shellcode` 是哪个架构的， 请您在使用该功能时，如果不确定架构和其稳定性， 最好使用 `牺牲进程` 来进行调用， 而非在本体中进行， 以免由于误操作失去连接

具体可参照 `Post Exploitation` 章节中 `Running Commands` 这一小节的内容

### .NET CRL

对于前几年的从事安全工作的从业人员来说, 在 `Windows` 系统上使用 `C#` 编写工具程序十分流行，各类检测及反制手段如 `AMSI` 还未添加进安全框架中, 因此市面上留存了大量由 C#编写并用于安全测试的各类利用和工具程序集。

`C#` 程序可以在 `Windows` 的 `.Net` 框架中运行,而 `.Net` 框架也是现代 `Windows` 系统中不可或缺的一部分。其中包含一个被称为 `Common Language Runtime(CLR)` 的运行时,`Windows` 为此提供了大量的接口,以便开发者操作 `系统API`。

因此， `Implant` 支持在内存中加载并调用 `.Net` 程序,并可选择是否需要获取标准输出。使用者可以参照 `Post Exploitation` 章节中 `Running Commands` 小节的内容,进一步了解相关功能的使用方法。

### Unmanaged Powershell

在红队的工作需求中， 命令执行为一个非常核心的功能， 而现代的 `Powershell` 就是一个在 `Windows` 中及其重要且常用的脚本解释器， 有很多功能强大的 Powershell 脚本可以支持红队人员在目标系统上的工作

因此，针对直接调用 `Powershell.exe` 来执行 `powershell` 命令的检测层出不穷，为避免针对此类的安全检查

`Implant` 支持在不依赖系统自身 `Powershell.exe ` 程序的情况下执行 `Powershell cmdlet` 命令, 具体可参照 `Post Exploitation` 章节中 `Running Commands` 小节的内容,进一步了解相关功能的使用方法。

- 使用 `powershell` 命令来唤起 `powershell.exe` 以执行 `powershll` 命令
- 使用 `powerpick` 命令来摆脱 `powershell.exe` 执行 `powershell` 命令
- 使用 `powershell_import` 命令来向 `Implant` 导入 `powershell script`， 系统将在内存中保存该脚本， 以再后续使用时直接调用该脚本的内容

### BOF

常见的， 一个 C 语言源程序被编译成目标程序由四个阶段组成， 即（预处理， 编译， 汇编， 链接）

而我们的 `Beacon Object File(BOF) ` 是代码在经过前三个阶段（预处理， 编译， 汇编）后，未链接产生的 `Obj` 文件（通常被称为可重定位目标文件）

该类型文件由于未进行链接操作， 因此一般体积较小， 较常见 `DLL/EXE` 这类可执行程序更易于传输，被广泛利用于知名 C2 工具 Cobalt Strike(后称 CS)中， 不少红队开发人员为其模块编写了 BOF 版本， 因此 `Implant` 对该功能进行了适配工作， `Implant` 支持大部分 CS 提供的内部 API, 以减少各使用人员的使用及适配成本

请注意， 由于我们的 `BOF` 功能与 `CS` 类似，执行于本进程中， 因此在使用该功能时请确保您使用的 `BOF` 文件可以正确执行， 否则您将丢失当前连接

#### BOF 开发

为减少使用人员的开发成本， 本 `Implant` 的 `BOF` 开发标准与 `CS` 工具相同，您可参照 `CS` 的开发模版进行开发，

其模版如下， 链接为 [https://github.com/Cobalt-Strike/bof_template/blob/main/beacon.h](https://github.com/Cobalt-Strike/bof_template/blob/main/beacon.h)

```c
/*
 * Beacon Object Files (BOF)
 * -------------------------
 * A Beacon Object File is a light-weight post exploitation tool that runs
 * with Beacon's inline-execute command.
 *
 * Additional BOF resources are available here:
 *   - https://github.com/Cobalt-Strike/bof_template
 *
 * Cobalt Strike 4.x
 * ChangeLog:
 *    1/25/2022: updated for 4.5
 *    7/18/2023: Added BeaconInformation API for 4.9
 *    7/31/2023: Added Key/Value store APIs for 4.9
 *                  BeaconAddValue, BeaconGetValue, and BeaconRemoveValue
 *    8/31/2023: Added Data store APIs for 4.9
 *                  BeaconDataStoreGetItem, BeaconDataStoreProtectItem,
 *                  BeaconDataStoreUnprotectItem, and BeaconDataStoreMaxEntries
 *    9/01/2023: Added BeaconGetCustomUserData API for 4.9
 */

/* data API */
typedef struct {
        char * original; /* the original buffer [so we can free it] */
        char * buffer;   /* current pointer into our buffer */
        int    length;   /* remaining length of data */
        int    size;     /* total size of this buffer */
} datap;

DECLSPEC_IMPORT void    BeaconDataParse(datap * parser, char * buffer, int size);
DECLSPEC_IMPORT char *  BeaconDataPtr(datap * parser, int size);
DECLSPEC_IMPORT int     BeaconDataInt(datap * parser);
DECLSPEC_IMPORT short   BeaconDataShort(datap * parser);
DECLSPEC_IMPORT int     BeaconDataLength(datap * parser);
DECLSPEC_IMPORT char *  BeaconDataExtract(datap * parser, int * size);

/* format API */
typedef struct {
        char * original; /* the original buffer [so we can free it] */
        char * buffer;   /* current pointer into our buffer */
        int    length;   /* remaining length of data */
        int    size;     /* total size of this buffer */
} formatp;

DECLSPEC_IMPORT void    BeaconFormatAlloc(formatp * format, int maxsz);
DECLSPEC_IMPORT void    BeaconFormatReset(formatp * format);
DECLSPEC_IMPORT void    BeaconFormatAppend(formatp * format, char * text, int len);
DECLSPEC_IMPORT void    BeaconFormatPrintf(formatp * format, char * fmt, ...);
DECLSPEC_IMPORT char *  BeaconFormatToString(formatp * format, int * size);
DECLSPEC_IMPORT void    BeaconFormatFree(formatp * format);
DECLSPEC_IMPORT void    BeaconFormatInt(formatp * format, int value);

/* Output Functions */
#define CALLBACK_OUTPUT      0x0
#define CALLBACK_OUTPUT_OEM  0x1e
#define CALLBACK_OUTPUT_UTF8 0x20
#define CALLBACK_ERROR       0x0d

DECLSPEC_IMPORT void   BeaconOutput(int type, char * data, int len);
DECLSPEC_IMPORT void   BeaconPrintf(int type, char * fmt, ...);


/* Token Functions */
DECLSPEC_IMPORT BOOL   BeaconUseToken(HANDLE token);
DECLSPEC_IMPORT void   BeaconRevertToken();
DECLSPEC_IMPORT BOOL   BeaconIsAdmin();

/* Spawn+Inject Functions */
DECLSPEC_IMPORT void   BeaconGetSpawnTo(BOOL x86, char * buffer, int length);
DECLSPEC_IMPORT void   BeaconInjectProcess(HANDLE hProc, int pid, char * payload, int p_len, int p_offset, char * arg, int a_len);
DECLSPEC_IMPORT void   BeaconInjectTemporaryProcess(PROCESS_INFORMATION * pInfo, char * payload, int p_len, int p_offset, char * arg, int a_len);
DECLSPEC_IMPORT BOOL   BeaconSpawnTemporaryProcess(BOOL x86, BOOL ignoreToken, STARTUPINFO * si, PROCESS_INFORMATION * pInfo);
DECLSPEC_IMPORT void   BeaconCleanupProcess(PROCESS_INFORMATION * pInfo);

/* Utility Functions */
DECLSPEC_IMPORT BOOL   toWideChar(char * src, wchar_t * dst, int max);

/* Beacon Information */
/*
 *  ptr  - pointer to the base address of the allocated memory.
 *  size - the number of bytes allocated for the ptr.
 */
typedef struct {
        char * ptr;
        size_t size;
} HEAP_RECORD;
#define MASK_SIZE 13

/*
 *  sleep_mask_ptr        - pointer to the sleep mask base address
 *  sleep_mask_text_size  - the sleep mask text section size
 *  sleep_mask_total_size - the sleep mask total memory size
 *
 *  beacon_ptr   - pointer to beacon's base address
 *                 The stage.obfuscate flag affects this value when using CS default loader.
 *                    true:  beacon_ptr = allocated_buffer - 0x1000 (Not a valid address)
 *                    false: beacon_ptr = allocated_buffer (A valid address)
 *                 For a UDRL the beacon_ptr will be set to the 1st argument to DllMain
 *                 when the 2nd argument is set to DLL_PROCESS_ATTACH.
 *  sections     - list of memory sections beacon wants to mask. These are offset values
 *                 from the beacon_ptr and the start value is aligned on 0x1000 boundary.
 *                 A section is denoted by a pair indicating the start and end offset values.
 *                 The list is terminated by the start and end offset values of 0 and 0.
 *  heap_records - list of memory addresses on the heap beacon wants to mask.
 *                 The list is terminated by the HEAP_RECORD.ptr set to NULL.
 *  mask         - the mask that beacon randomly generated to apply
 */
typedef struct {
        char  * sleep_mask_ptr;
        DWORD   sleep_mask_text_size;
        DWORD   sleep_mask_total_size;

        char  * beacon_ptr;
        DWORD * sections;
        HEAP_RECORD * heap_records;
        char    mask[MASK_SIZE];
} BEACON_INFO;

DECLSPEC_IMPORT void   BeaconInformation(BEACON_INFO * info);

/* Key/Value store functions
 *    These functions are used to associate a key to a memory address and save
 *    that information into beacon.  These memory addresses can then be
 *    retrieved in a subsequent execution of a BOF.
 *
 *    key - the key will be converted to a hash which is used to locate the
 *          memory address.
 *
 *    ptr - a memory address to save.
 *
 * Considerations:
 *    - The contents at the memory address is not masked by beacon.
 *    - The contents at the memory address is not released by beacon.
 *
 */
DECLSPEC_IMPORT BOOL BeaconAddValue(const char * key, void * ptr);
DECLSPEC_IMPORT void * BeaconGetValue(const char * key);
DECLSPEC_IMPORT BOOL BeaconRemoveValue(const char * key);

/* Beacon Data Store functions
 *    These functions are used to access items in Beacon's Data Store.
 *    BeaconDataStoreGetItem returns NULL if the index does not exist.
 *
 *    The contents are masked by default, and BOFs must unprotect the entry
 *    before accessing the data buffer. BOFs must also protect the entry
 *    after the data is not used anymore.
 *
 */

#define DATA_STORE_TYPE_EMPTY 0
#define DATA_STORE_TYPE_GENERAL_FILE 1

typedef struct {
        int type;
        DWORD64 hash;
        BOOL masked;
        char* buffer;
        size_t length;
} DATA_STORE_OBJECT, *PDATA_STORE_OBJECT;

DECLSPEC_IMPORT PDATA_STORE_OBJECT BeaconDataStoreGetItem(size_t index);
DECLSPEC_IMPORT void BeaconDataStoreProtectItem(size_t index);
DECLSPEC_IMPORT void BeaconDataStoreUnprotectItem(size_t index);
DECLSPEC_IMPORT size_t BeaconDataStoreMaxEntries();

/* Beacon User Data functions */
DECLSPEC_IMPORT char * BeaconGetCustomUserData();
```

为避免您的 `BOF` 程序由于调用了本 `Implant` 未适配的函数导致您丢失连接， 请注意本 `Implant` 现支持使用的函数列表如下:

```c
BeaconDataExtract
BeaconDataPtr
BeaconDataInt
BeaconDataLength
BeaconDataParse
BeaconDataShort
BeaconPrintf
BeaconOutput

BeaconFormatAlloc
BeaconFormatAppend
BeaconFormatFree
BeaconFormatInt
BeaconFormatPrintf
BeaconFormatReset
BeaconFormatToString

BeaconUseToken
BeaconIsAdmIn

BeaconCleanupProcess
```

!!! 请在编写 `BOF` 文件或使用现有 `BOF` 对应工具包前详细检查是否适配了对应 `API`， 以防止您丢失连接！！！


### Memory

#### **WIP** 🛠 ️ 全局堆加密
#### **WIP** 🛠 ️ 随机分配 `chunk` 加料

### Syscall

虽然是老生常态的技术， 但作为基建设计的框架怎么会少的了它呢 :)

### HOOK

#### **WIP** 🛠️ inline HOOK 

#### **Private** 🔒 Hardware HOOK

### **WIP** 🛠️ Rop Chain

### HIDDEN

#### AMSI & ETW

##### **Private** 🔒 PATCH

##### **Private** 🔒 HARDWARE HOOK

#### **Professional** 👤 SLEEP MASK

#### **Professional** 👤 THREAD TASK SPOOFING

#### **Professional** 👤 LITE VM

### **WIP** 🛠️ Obfuscator LLVM

#### **WIP** 🛠️ Anti Class Dump

#### **WIP** 🛠️ Anti Hooking

#### **WIP** 🛠️ Anti Debug

#### **WIP** 🛠️ Bogus Control Flow

#### **WIP** 🛠️ Control Flow Flattening

#### **WIP** 🛠️ Basic Block Splitting

#### **WIP** 🛠️ Instruction Substitution

#### **WIP** 🛠️ Function CallSite Obf

#### **WIP** 🛠️ String Encryption

#### **WIP** 🛠️ Constant Encryption

#### **WIP** 🛠️ Indirect Branching

#### **WIP** 🛠️ Function Wrapper


最后， 感谢大量优秀的开源项目及开发者们

```
https://github.com/yamakadi/clroxide/
https://github.com/MSxDOS/ntapi
https://github.com/trickster0/EDR_Detector/blob/master/EDR_Detector.rs 
https://github.com/Fropops/Offensive-Rust
https://github.com/wildbook/hwbp-rs
https://github.com/bats3c/DarkLoadLibrary/blob/master/DarkLoadLibrary/ 
https://github.com/b4rtik/metasploit-execute-assembly
https://github.com/lap1nou/CLR_Heap_encryption
https://github.com/med0x2e/ExecuteAssembly/
```