---
title: Internal of Malice · implant 编译
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
- i686-pc-windows-gnu
- x86_64-pc-windows-gnu

## 基础环境配置

### git clone

因为 malefic 需要用到代码生成, 并鼓励用户修改代码, 因此我们没有将代码打包到 docker 中.

```
git clone --recurse-submodules https://github.com/chainreactors/malefic
```

!!! important "注意 clone 子项目"
需要添加`--recurse-submodules`递归克隆子项目. 如果已经 clone 也不必担心,`git submodule update --init` 即可

### 下载 resources

[下载对应的版本 resources.zip](https://github.com/chainreactors/malefic/releases/download/v0.0.3/resources.zip), 包含了编译需要用到的预编译的 malefic-win-kit lib/a 库文件.

community 的 resources 随着版本发布时的 release 发布: https://github.com/chainreactors/malefic/releases/lasest:

解压到源码目录下的 resrouces 文件夹下: 最终结果应该类似这样:

![](/wiki/IoM/assets/Pasted%20image%2020241122223133.png)

## Docker 编译(推荐)

!!! info "docker 自动化编译"
rust 很复杂，不通过交叉编译的方式几乎无法实现所有架构的适配，所以我们参考了[cross-rs/cross](https://github.com/cross-rs/cross)的方案，但它并不完美的符合我们的需求：

    1. cross需要宿主机存在一个rust开发环境，编译环境不够干净，虽然这可以通过虚拟机、github action等方式解决
    2. cross对很多操作进行了封装，不够灵活，比如一些动态的变量引入、一些复杂的操作无法方便的实现

    因此，我们参考了cross创建了用于维护malefic(即implant)编译的仓库[chainreactors/cross-rust](https://github.com/chainreactors/cross-rust).
    这个项目提供了一些主流架构的编译环境。

使用前需要先安装 docker

在 docker 中编译特征会更干净，通过 volume 映射源码，编译完成会在`target`目录下生成对应的二进制文件。

### docker install

可参考[官网介绍](https://www.docker.com/)

```bash
curl -fsSL https://get.docker.com | sudo bash -s docker
```

??? info "国内安装 docker"
`
	curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
	`

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

!!! tips "如果不了解原理, 请选择对应target的镜像"
	ghcr.io/chainreactors/x86_64-pc-windows-gnu:nightly-2023-09-18-latest 能编译绝大多数target. 如果了解rust的编译操作, 可以使用这个镜像实现大多数编译场景
### 编译

!!! important "请注意已完成了基础环境配置"

以`x86_64-unknown-linux-musl`举例, **在 malefic 的代码目录下执行**

你可以通过一行命令执行 build

```bash
# cd /user/path/malefic/
docker run -v "$(pwd)/cache/registry:/root/cargo/registry" -v "$(pwd)/cache/git:/root/cargo/git" -v "$(pwd):/root/src" --rm -it ghcr.io/chainreactors/x86_64-unknown-linux-musl:nightly-2023-09-18-latest bash -c "(./target/release/malefic-mutant generate beacon  || cargo run -p malefic-mutant --release -- generate beacon) && cargo build --release -p malefic --target x86_64-unknown-linux-musl"
```

或者你也可分步执行

```bash
# cd /user/path/malefic/
# 进入docker的bash
docker run -v "$(pwd):/root/src" --rm -it ghcr.io/chainreactors/x86_64-unknown-linux-musl:nightly-2023-09-20-latest bash
# 通过mutant生成对应的配置
(./target/release/malefic-mutant generate beacon  || cargo run -p malefic-mutant --release -- generate beacon)
# build对应的bin
cargo build -p malefic --release --target x86_64-unknown-linux-musl
```


## 本机编译环境配置

由于本地环境的编译更为复杂，如果需要交叉编译建议使用`Docker`编译. 以`x86_64-pc-windows-msvc`为例，

### 配置环境

安装 rust

```
curl https://sh.rustup.rs -sSf | sh
```

安装 toolchain

```bash
rustup default nightly-2023-09-18
```

添加 target, [经过的测试的 target 推荐](/wiki/IoM/manual/implant/build/#_1)

```
rustup target add x86_64-pc-windows-msvc
```

??? "windows 配置 gnu 环境(非必要)"
本地手动编译时，我们推荐 windows 用户使用[msys2](https://www.msys2.org/)管理 GNU 工具链环境, 可通过官网二进制文件直接安装。
在 msys2 的 terminal 下执行如下安装可以保证 64、32 位 GNU 工具链的正常编译
`
	pacman -Syy # 更新包列表
	pacman -S --needed mingw-w64-x86_64-gcc
	pacman -S --needed mingw-w64-i686-gcc
	`
你可自行把 msys64 添加到环境变量中， 也可通过`notepad $PROFILE`将如下内容添加到 powershell 配置中，实现在 powershell 中快速切换`mingw64/32`.
`powershell
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
	`
切换用法参考下图:
![switch mingw](/wiki/IoM/assets/switch-mingw-in-powershell.png)

## 编译命令

对应的编译命令通用于 docker 与本机.

### 生成配置与代码

通过 mutant 生成对应的配置

```bash
cargo run -p malefic-mutant -- generate beacon
```

也可以使用预编译的 malefic-mutant 在对应目录下执行相同的命令

```bash
malefic-mutant generate beacon
```

[mutant 完整文档](/wiki/IoM/manual/implant/mutant)

### 编译 malefic

项目的配置(config.toml、cargo.toml、makefile.toml..)中提供了一些预设和编译优化选项. 熟悉 rust 的使用者也可以手动编译，malefic 目前使用的 rust 版本是`nightly-2023-09-18`.

在进行手动编译前， 请更改 `beacon` 对应的配置项, 关于配置项， 请参考 [beacon 配置说明](/wiki/IoM/manual/implant/mutant/#beacon)

添加对应的目标编译架构,以`x86_64-pc-windows-gnu`为例

```bash
rustup target add x86_64-pc-windows-gnu
```

指定 `target` 编译

```bash
# mg 64
cargo build --release -p malefic --target x86_64-pc-windows-gnu
# mg 32
cargo build --release -p malefic --target i686-pc-windows-gnu
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

与手动编译 `malefic` 相似， 但目前 pulse 需要开启 `lto` 优化， 因此需要使用开启了 `lto` 的配置选项， 当然， 如果熟悉 rust 的使用者也可以自行更改

在进行手动编译前， 请更改 `pulse` 对应的配置项, 关于配置项， 请参考 [pulse 配置说明](/wiki/IoM/manual/implant/mutant/#pulse)

```bash
malefic-mutant generate pulse
```

指定 `target ` 编译

```bash
# mg 64
cargo build --profile release-lto -p malefic-pulse --target x86_64-pc-windows-gnu
# mg 32
cargo build --profile release-lto -p malefic-pulse --target i686-pc-windows-gnu
```

生成对应的 `malefic-pulse.exe` 文件后，您可以使用 `objcopy` 来进行 `shellcode` 的转化

```bash
objcopy -O binary malefic-pulse.exe malefic-pulse.bin
```

### 编译独立 modules

malefic 的 windows 平台目前支持动态加载 module, 因此可以编译单个或者一组 module, 然后通过`load_module`给已上线的 implant 添加新的功能.

[load_module 使用文档](/wiki/IoM/manual/implant/#load_module)

相关命令如下:

生成对应配置

```bash
malefic_mutant generate modules "execute_powershell execute_assembly"
```

编译 modules

```bash
cargo build --release --features "execute_powershell execute_assembly" -p malefic-modules --target x86_64-pc-windows-gnu
```

!!! info "当前支持的 modules"
请见: https://chainreactors.github.io/wiki/IoM/manual/implant/modules/#modules

编译结果为`target\[arch]\release\modules.dll`

可以使用`load_module`热加载这个 dll

!!! important "module 动态加载目前只支持 windows"
linux 与 mac 在理论上也可以实现

常见的使用场景:

1.  编译一个不带任何 modules 的 malefic, 保持静态文件最小特征与最小体积. 通过`load_module modules.dll` 动态加载模块
2.  根据场景快速开发 module, 然后动态加载到 malefic 中.
3.  长时间保持静默的场景可以卸载所有的 modules, 并进入到 sleepmask 的堆加密状态. 等需要操作时重新加载 modules
