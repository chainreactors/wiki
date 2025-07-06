---
title: Internet of Malice · implant 编译
---

# Build

## 目前支持的架构

malefic 理论上支持 rust 能编译的几乎所有平台, 包括各种冷门架构的 IoT 设备, Android 系统, iOS 系统等等 (有相关需求可以联系我们定制化适配), 当前支持的架构可参考[cross-rust](https://github.com/chainreactors/cross-rust)

经过测试的 target

- x86_64-apple-darwin
- aarch64-apple-darwin
- x86_64-unknown-linux-musl
- i686-unknown-linux-musl
- x86_64-pc-windows-msvc
- i686-pc-windows-msvc
- x86_64-pc-windows-gnu
- i686-pc-windows-gnu
- armv7-unknown-linux-musleabihf
- armv7-unknown-linux-musleabi

## 基础环境配置

### git clone

因为 malefic 需要用到代码生成, 并鼓励用户修改代码, 因此我们没有将代码打包到 docker 中.

```
git clone --recurse-submodules https://github.com/chainreactors/malefic
```

!!! important "注意 clone 子项目"
	需要添加`--recurse-submodules`递归克隆子项目. 如果已经 clone 也不必担心,`git submodule update --init --recursive` 即可

### 下载 resources

!!! tips "使用install.sh会自动下载resources"

[下载对应的版本 resources.zip](https://github.com/chainreactors/malefic/releases/latest), 包含了编译需要用到的预编译的 malefic-win-kit lib/a 库文件.

community 的 resources 随着版本发布时的 release 发布: https://github.com/chainreactors/malefic/releases/latest 

解压到源码目录下的 resrouces 文件夹下: 最终结果应该类似这样:

![](/IoM/assets/Pasted%20image%2020241122223133.png)

## Docker 编译(推荐)

!!! info "docker 自动化编译"
	由于rust需要通过交叉编译实现所有架构的适配，cross[cross-rs/cross](https://github.com/cross-rs/cross)非常强大，但是它会导入一些用户名等信息作为映射，并且空间占用没有做到最小化: 
	    因此，我们参考了cross的代码创建了用于维护malefic(即implant)编译的镜像仓库[chainreactors/cross-rust](https://github.com/chainreactors/cross-rust).
	    这个项目暂时提供了一些主流架构的编译环境的Dockerfile。

使用前需要先安装 docker

在 docker 中编译通过 volume 映射源码，编译完成会在`./target/<target_triple>/`目录下生成对应的二进制文件。

### docker install

可参考[官网介绍](https://www.docker.com/)

```bash
# 国外安装请使用
curl -fsSL https://get.docker.com | sudo bash -s docker
# 国内安装请使用
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
```

目前已经支持的镜像:

- ghcr.io/chainreactors/x86_64-pc-windows-msvc:nightly-2023-09-18-latest
- ghcr.io/chainreactors/i686-pc-windows-msvc:nightly-2023-09-18-latest
- ghcr.io/chainreactors/i686-pc-windows-gnu:nightly-2023-09-18-latest
- ghcr.io/chainreactors/x86_64-pc-windows-gnu:nightly-2023-09-18-latest
- ghcr.io/chainreactors/x86_64-unknown-linux-musl:nightly-2023-09-18-latest
- ghcr.io/chainreactors/i686-unknown-linux-musl:nightly-2023-09-18-latest
- ghcr.io/chainreactors/x86_64-unknown-linux-gnu:nightly-2023-09-18-latest
- ghcr.io/chainreactors/i686-unknown-linux-gnu:nightly-2023-09-18-latest
- ghcr.io/chainreactors/x86_64-apple-darwin:nightly-2023-09-18-latest
- ghcr.io/chainreactors/aarch64-apple-darwin:nightly-2023-09-18-latest
- ...

!!! tips "镜像使用注意"
	ghcr.io/chainreactors/malefic-builder:latest是一个包含了win/linux/mac常用target的镜像. 如果了解rust的编译操作, 可以使用这个镜像实现大多数编译。(具体target有i686-pc-windows-gnu,x86_64-pc-windows-gnu,x86_64-unknown-linux-musl,i686-unknown-linux-musl,x86_64-apple-darwin,aarch64-apple-darwin)

### 编译

!!! important "请注意已完成了基础环境配置"
	使用`install.sh` 安装的会自动配置对应的基础环境. 如果是手动配置请检查[基础环境配置](/IoM/manual/implant/build/#_2)

以`x86_64-unknown-linux-musl`举例, **在 malefic 的代码根目录下执行**

你可以通过一行命令执行 build
```bash
# cd /user/path/malefic/
docker run -v "$(pwd):/root/src" --rm -it ghcr.io/chainreactors/malefic-builder:latest sh -c "malefic-mutant generate beacon && malefic-mutant build malefic --target x86_64-unknown-linux-musl"

# 如果不想每次都下载依赖, 可以把依赖进行本地的缓存，
docker run -v "$(pwd):/root/src" -v "$(pwd)/cache/registry:/root/cargo/registry" -v "$(pwd)/cache/git:/root/cargo/git" --rm -it ghcr.io/chainreactors/malefic-builder:latest sh -c "malefic-mutant generate beacon && malefic-mutant build malefic --target x86_64-unknown-linux-musl"
```

## Github Action编译 (推荐)
目前client+server已经内置了github action编译的命令，可以通过client直接编译，你可通过`action build --help`查看详细用法。 接下来叙述如何手动通过gh编译。

首先, 你需要git clone一份malefic源码，并push到一份到你的仓库(建议设置私人仓库)，并开启github action功能，参考下图:

![](/IoM/assets/enable-github-action.png)

然后, 在本地安装[gh cli](https://docs.github.com/zh/github-cli/github-cli/quickstart)工具，通过设置`GH_TOKEN`环境变量或`gh auth login`登录你的github账号，然后执行如下命令即可编译.

注意: windows用户如果没有base64等函数，建议通过git-bash.exe执行.

1. 编译beacon
```git-bash
gh workflow run generate.yaml -f package="beacon" -f malefic_config_yaml=$(base64 -w 0 </path/to/malefic_src/config.yaml>) -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```

2. 编译bind
```git-bash
gh workflow run generate.yaml -f package="beacon" -f malefic_config_yaml=$(base64 -w 0 </path/to/malefic_src/config.yaml>) -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```

3. 编译 pulse
```git-bash
gh workflow run generate.yaml -f package="pulse" -f malefic_config_yaml=$(base64 -w 0 </path/to/malefic_src/config.yaml>) -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```

4. 编译prelude
```git-bash
gh workflow run generate.yaml -f package="prelude" -f autorun_yaml=$(base64 -w 0 </path/to/malefic_src/autorun.yaml>) -f malefic_config_yaml=$(base64 -w 0 </path/to/malefic_src/config.yaml>) -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```

5. 编译modules
```git-bash
gh workflow run generate.yaml -f package="modules" -f malefic_modules_features="execute_powershell execute_assembl..." -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```
编译完成后你可以通过`gh run list --workflow=generate.yaml -R <username/malefic>`查看编译结果，
通过`gh run download <run_id> -R <username/malefic>`下载对应的二进制文件.
![](/IoM/assets/gh-run-list-download.png)

## 本机编译

!!! danger "由于本地环境的编译更为复杂, 只建议有rust使用经验的用户采用"
	本机编译时交叉编译配置或者不同的target都可能有不同的环境依赖. 例如编译gnu相关需要依赖特定版本的gcc, 编译musl或者darwin也需要安装对应的环境。这些基础环境配置我们在docker里解决了一遍， **对于没有相关经验的使用者会非常劝退**。
	
	如果没有丰富的rust使用经验， 建议使用我们提前准备的docker/github aciton进行编译

### 安装rust
linux安装 rust

```
curl https://sh.rustup.rs -sSf | sh
```

windows安装rust
三种方式选择一种即可:

1. 直接下载安装程序: 
https://www.rust-lang.org/tools/install 或使用包管理工具下载
2. scoop install
```
scoop install rustup
```
3. winget install
```
winget install rustup
```
### 安装 toolchain

```bash
rustup default nightly-2023-09-18
```

### 环境配置

!!! tips "交叉编译小技巧"
	使用手动交叉编译也可以使用[zigbuild](https://github.com/rust-cross/cargo-zigbuild)可以免去坑非常多的环境配置问题
	
	```
	pip install cargo-zigbuild
	```
	
	编译命令如下，以malefic beacon为例:
	
	```
	cargo zigbuild --release -p malefic --target x86_64-pc-windows-gnu
	cargo zigbuild --release -p malefic --target x86_64-unknown-linux-musl
	```

#### linux

```bash
sudo apt install -y openssl libssl-dev libudev-dev cmake llvm clang musl-tools build-essential
```

#### windows 

??? "windows 配置msvc环境(使用x86_64-pc-windows-msvc必须)"
	请参考: https://rust-lang.github.io/rustup/installation/windows-msvc.html

??? "windows 配置 gnu 环境(如果使用x86_64-pc-windows-gnu必须)"
	本地手动编译时，我们推荐 windows 用户使用[msys2](https://www.msys2.org/)管理 GNU 工具链环境, 可通过官网二进制文件直接安装。
	
	在 msys2 的 terminal 执行如下安装可以保证 64、32 位 GNU 工具链的正常编译
	

	```
	pacman -Syy # 更新包列表
	pacman -S --needed mingw-w64-x86_64-gcc
	pacman -S --needed mingw-w64-i686-gcc
	```
	

	你可以把 msys64 添加到环境变量中， 或通过`notepad $PROFILE`将如下内容添加到 powershell 配置中，实现在 powershell 中快速切换`mingw64/32`.
	

	```powershell
	function mg {
		param (
			[ValidateSet("32", "64")]
			[string]$arch = "64"
		)
		
		$basePath = "D:\msys64\mingw" # 此处是你的msys2安装路径
		$env:PATH = "${basePath}${arch}\bin;" + $env:PATH
		Write-Host "Switched to mingw${arch} (bit) toolchain"
	}
	mg 64
	```
	
	用法参考下图:
	
	![switch mingw](/IoM/assets/switch-mingw-in-powershell.png)

## 编译

!!! important "本机安装请注意[下载resources](#resources)并解压到指定目录"

此部分也可以使用make命令进行编译, 与前文Makefile一致

### 编译 malefic

项目的配置(.cargo/config.toml、cargo.toml、Makefile)中提供了一些预设和编译优化选项. 熟悉 rust 的使用者也可以手动编译，malefic 目前使用的 rust 版本是`nightly-2023-09-18`.

在进行手动编译前， 请更改 `beacon/bind` 对应的配置项, 关于配置项， 请参考 [beacon 配置说明](/IoM/manual/implant/mutant/#beacon)

添加对应的目标编译架构,以`x86_64-pc-windows-gnu`为例

```bash
rustup target add x86_64-pc-windows-gnu
```


### 生成配置与代码


编译mutant, 或从malefic release中下载编译好的mutant,[mutant 完整文档](/IoM/manual/implant/mutant)

```bash
cargo build --release -p malefic-mutant
```

通过 mutant 生成对应的配置

```bash
# 生成 beacon 编译所需的配置和代码
./target/release/malefic-mutant generate beacon
# 生成 bind 编译所需的配置和代码
./target/release/malefic-mutant generate bind
```

指定 `target` 编译

```bash
# mg 64
cargo build --release -p malefic --target x86_64-pc-windows-gnu
# mg 32
cargo build --release -p malefic --target i686-pc-windows-gnu

# 如果你需要编译win7的target,请使用如下命令
cargo +nightly build --release -p malefic --target x86_64-win7-windows-msvc -Z build-std=std,panic_abort
```

### 编译 malefic-prelude

生成配置

```bash
malefic-mutant generate prelude autorun.yaml
```

```bash
cargo build --release -p malefic-prelude --target x86_64-pc-windows-gnu
```

### 编译 malefic-pulse

在进行手动编译前， 请更改 `pulse` 对应的配置项, 关于配置项， 请参考 [pulse 配置说明](/IoM/manual/implant/mutant/#pulse)

```bash
malefic-mutant generate pulse
```

指定 `target ` 编译

```bash
# mg 64
cargo build -p malefic-pulse --target x86_64-pc-windows-gnu
# mg 32
cargo build -p malefic-pulse --target i686-pc-windows-gnu
```

生成对应的 `malefic-pulse.exe` 文件后，您可以使用 `objcopy` 来进行 `shellcode` 的转化

```bash
objcopy -O binary malefic-pulse.exe malefic-pulse.bin
```

### 编译独立 modules

malefic 的 windows 平台目前支持动态加载 module, 因此可以编译单个或者一组 module, 然后通过`load_module`给已上线的 implant 添加新的功能.

[load_module 使用文档](/IoM/manual/implant/#load_module)

相关命令如下:

生成对应配置

```bash
malefic_mutant generate modules "execute_powershell execute_assembly"
```

编译 modules

```bash
malefic_mutant build modules --target x86_64-pc-windows-gnu
```

!!! info "当前支持的 modules"
	请见: https://chainreactors.github.io/wiki/IoM/manual/implant/modules/#modules

编译结果为`target\[arch]\release\modules.dll`

可以使用`load_module`热加载这个 dll

!!! important "module 动态加载目前只支持 windows"
	linux 与 mac 在理论上也可以实现, 将会随着对应的kit发布

常见的使用场景:

1.  编译一个不带任何 modules 的 malefic, 保持静态文件最小特征与最小体积. 通过`load_module modules.dll` 动态加载模块
2.  根据场景快速开发 module, 然后动态加载到 malefic 中.
3.  长时间保持静默的场景可以卸载所有的 modules, 并进入到 sleepmask 的堆加密状态. 等需要操作时重新加载 modules


## Mutant

 malefic 在v0.0.3中解耦为多个组件并新增了大量组件，可预见的将会有更多组件和模块出现在项目中， 因此配置生成/管理工具刻不容缓， 之前的 config 已经无法满足当前的需求， 我们新增了 malefic-mutant 代替原有的malefic-config

在设计中， mutant 的定位相当于 MSF venom， 可以动态解析和更改配置以动态生成代码， 也可以通过需求动态生成 shellcode 的 raw 文件.



### Install/Build

malefic-mutant 会随着每个版本自动编译对应的release. 直接下载即可使用

https://github.com/chainreactors/malefic/releases/latest


也支持从源码编译:

```
cargo build --release -p malefic-mutant 
```

!!! tips "编译环境"
	编译环境可以参考build中对应的配置流程: https://chainreactors.github.io/wiki/IoM/manual/implant/build/#_6

### Config

malefic-mutant 目前有三大组件:

* generate： 根据配置动态生成代码
* build：创建可用的 shellcode/PE 文件和编译
* tool: 一些可用的小工具（目前为srdi）

其中 generate 所依赖的配置均在 malefic/config.yaml 文件中

```bash
$ mutant --help
Config malefic beacon and prelude.

Usage: malefic-mutant.exe <COMMAND>

Commands:
  generate  auto generate config
  build     auto build
  tool
  help      Print this message or the help of the given subcommand(s)

Options:
  -h, --help  Print help
```


由于 beacon 是整个功能的结合形态， 因此配置项略微复杂， 这里将其分为三部分来介绍

配置文件模板: https://github.com/chainreactors/malefic/blob/master/config.yaml

#### basic

用于连接参数配置

```yaml
basic:  
  name: "malefic"  
  targets:  
    - "127.0.0.1:5001"  
  protocol: "tcp"  
  tls: false  
  proxy:  
  interval: 5  
  jitter: 0.2  
  ca:  
  encryption: aes  
  key: maliceofinternal  
  rem:  
    link:  
  http:  
    method: "POST"  
    path: "/pulse"  
    host: "127.0.0.1"  
    version: "1.1"  
    headers:  
      User-Agent: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0"
```
#### build 

mutant build 使用的配置

!!! important "ollvm相关配置只支持在IoM提供的malefic-builder中使用"

```yaml
build:
  zigbuild: false
  ollvm:
    enable: false
    bcfobf: false # Bogus Control Flow Obfuscation
    splitobf: false # Split Control Flow Obfuscation
    subobf: false # Instruction Substitution Obfuscation
    fco: false # Function CallSite  Obfuscation
    constenc: false # Constant Encryption Obfuscation
```

#### metadata

基于resources实现的二进制文件基本信息配置
    
```yaml
metadata:  
  remap_path: "C:/Windows/Users/"  
  icon: ""  
  compile_time: "24 Jun 2015 18:03:01"  
  file_version: ""  
  product_version: ""  
  company_name: ""  
  product_name: ""  
  original_filename: "normal.exe"  
  file_description: "normal"  
  internal_name: ""  
  require_admin: false  # whether to require admin privilege  
  require_uac: false    # whether to require uac privilege
```

#### implants
关于implant功能性配置

```yaml
implants:  
  runtime: tokio          # async runtime: smol/tokio/async-std  
  mod: beacon             # malefic mod: beacon/bind  
  register_info: true     # whether collect sysinfo when register  
  hot_load: true          # enable hot load module  
  modules:                # module when malefic compile  
    - "full"  
  enable_3rd: false       # enable 3rd module  
  3rd_modules:            # 3rd module when malefic compile  
    - "full"  
  autorun: ""             # autorun config filename  
  pack:                   # pack  
#    - src: "1.docx"  
#      dst: "1.docs"
```

#### autorun

autorun本质上是将protobuf 转为yaml, 在编译时会重新还原为protobuf并加密保存到二进制文件中。 

因此具体完整的能力implant的能力， 所有能通过各种插件实现的功能都可以通过autorun实现。

yaml示例:

```yaml
-  
  name: bof  
  body: !ExecuteBinary  
    name: service  
    bin: !File "addservice.o"
-
  name: exe
  body: !ExecRequest
    args:
      - net
      - user
      - add
      - ....
  
```

### generate

generate是代码, 配置, 编译条件的生成器, 因此需要在源代码目录下使用.

如果还没有下载对应的源代码, 请先尝试clone malefic.

```
git clone --recurse-submodules https://github.com/chainreactors/malefic
```

generate 模块将会根据配置动态生成一切所需的代码（pulse, prelude, beacon...）

在每次修改完implant的`config.yaml`后， 都需要重新执行 `malefic-mutant generate  ...` 生成对应的配置
#### beacon

```bash
Usage: malefic-mutant.exe generate beacon [OPTIONS]

Options:
  -v, --version <VERSION>  Choice professional or community [default: community] [possible values: community, professional, inner]
  -s, --source             enable build from source code
  -c, --config <CONFIG>    Config file path [default: config.yaml]
  -h, --help               Print help
```

**使用示例**

```bash
malefic-mutant generate beacon 
```

##### beacon prelude

beacon在v0.1.0中也支持[autorun](#autorun)了。 不在需要分阶段上线， 可以通过stageless实现同样的功能。 

可以在编译时编译到beacon中， 在beacon启动时自动执行预编排的任务。 

```yaml
implants:  
  ...
  autorun: "persistence.yaml"
```

persistence.yaml:
```yaml
-
  name: bof
  body: !ExecuteBinary
    name: addservice
    bin: !File "addservice.o"

```


#### pulse

pulse 作为目前的 shellcode 生成器， 由 mutant 通过解析配置来提供生成代码

**配置**

其所依赖的配置位于 malefic/config.yaml 文件的 pulse 模块

```yaml
pulse:
  flags:
    start: 0x41             # 交互 body 的开始标志
    end: 0x42               # 交互 body 的结束标志
    magic: "beautiful"      # 随机校验
    artifact_id: 16         # 用于控制所拉取的阶段
  encryption: xor           # body 加密方式 (目前为 xor)
  key: "maliceofinternal"   # 加密的 `key` 值
  target: 127.0.0.1:5002    
  protocol: "tcp"           # 通信协议 (目前为 tcp)
  http:
    method: "GET"
    path: "/pulse.bin"
    version: "1.1"
    headers:
      user_agent: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0"
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      accept_language: "en-US,en;q=0.5"
      accept_encoding: "gzip, deflate"
```


```bash
Generate pulse

Usage: malefic-mutant.exe generate pulse [OPTIONS] <ARCH> <PLATFORM>

Arguments:
  <ARCH>      Choice arch x86/x64
  <PLATFORM>  platform, win

Options:
  -h, --help               Print help
```

**使用示例**

```bash
malefic-mutant generate pulse x64 win
```

#### prelude

prelude 为可选的用于在上线前进行权限维持, 反沙箱, 反调试等功能的中间阶段

**使用说明**

```bash
Config prelude

Usage: malefic-mutant.exe generate prelude [OPTIONS] <YAML_PATH>

Arguments:
  <YAML_PATH>

Options:
  --resources <RESOURCES>  Custom resources dir, default "./resources/" [default: resources]
  -h, --help                   Print help
```


这个yaml能被自动打包编译成`spite.bin`

```
malefic-mutant generate prelude autorun.yaml


cargo build -p malefic-prelude
```

能生成一个自动按顺序执行autorun.yaml 中配置的二进制程序.
#### modules
#### bind (Unstable)

在当前实际对抗中, 受到网络环境的限制, 很少有人使用 bind 类型的 webshell. 但在一些极端场景下, 例如不出网的webshell 中, 又或者长时间流量静默的场景下. bind 也许有用武之地

bind 作为新增的临时解决方案, 也由 mutant 来进行调配

```bash
Config bind

Usage: malefic-mutant.exe generate bind [OPTIONS]

Options:
  -h, --help               Print help
```
### build
在v0.1.0后， 为了方便ollvm的复杂参数配置， 我们添加了mutant build命令组, 用来通过mutant封装复杂编译参数， 减少用户侧的心智负担。


build 作为二进制文件生成器， 用于生成最终产物

```bash
auto build

Usage: malefic-mutant.exe build [OPTIONS] <COMMAND>

Commands:
  malefic  Build beacon
  prelude  Build prelude
  modules  Build modules
  pulse    Build pulse
  help     Print this message or the help of the given subcommand(s)

Options:
  -c, --config <CONFIG>  Config file path [default: config.yaml]
  -t, --target <TARGET>  [default: x86_64-pc-windows-gnu]
  -h, --help             Print help
```


#### malefic 

编译
```bash
Build beacon

Usage: malefic-mutant.exe build malefic [OPTIONS]

Options:
  -c, --config <CONFIG>  Config file path [default: config.yaml]
  -t, --target <TARGET>  [default: x86_64-pc-windows-gnu]
  -h, --help             Print help
```

示例

```bash
malefic-mutant.exe build malefic --target x86_64-pc-windows-msvc
```

**prelude/pulse/modules使用方法类似**
### tool

```bash
Usage: malefic-mutant.exe tool <COMMAND>

Commands:
  srdi  Generate SRDI
  help  Print this message or the help of the given subcommand(s)

Options:
  -h, --help  Print help

```

#### SRDI

作为 PE2SHELLCODE 的常见解决方案， 该模块可以将我们的 prelude / beacon 转化为 shellcode 以供多段加载

```bash
Generate SRDI

Usage: malefic-mutant.exe tool srdi [OPTIONS]

Options:
  -t, --type <TYPE>                    Srdi type: link(not support TLS)/malefic(support TLS) [default: malefic]
  -i, --input <INPUT>                  Source exec path [default: ]
  -p, --platform <PLATFORM>            platform, win [default: win]
  -a, --arch <ARCH>                    Choice arch x86/x64 [default: x64]
  -o, --output <OUTPUT>                Target shellcode path [default: malefic.bin]
      --function-name <FUNCTION_NAME>  Function name [default: ]
      --userdata-path <USERDATA_PATH>  User data path [default: ]
  -h, --help                           Print help
```

使用示例：

```bash
malefic-mutant tool srdi -i ./beacon.exe

malefic-mutant tool srdi -i ./beacon.exe -a x64 -o ./beacon.bin

malefic-mutant tool srdi -i ./beacon.dll  --function-name "main"
```