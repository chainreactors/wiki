
# IoM 用法: Implant Config

本文档详细介绍 IoM 植入体的配置选项，涵盖从基础通信设置到高级对抗技术的完整配置指南。

## 配置文件概述

IoM 植入体配置主要分为三个部分：

- **basic**: 基础通信配置（连接、加密、重试等）

- **implants**: 植入体高级配置（模块、对抗、API等） 

- **build**: 编译构建配置（混淆、元数据、工具链等）

---

## basic - 基础通信配置

### 1. 基本标识与网络配置

```yaml
basic:
  name: "malefic"                    # 植入体标识名称
  proxy: "http://127.0.0.1:8080"     # 代理服务器地址（可选）
```

**字段说明：**
- **name**: 植入体的唯一标识符，用于服务端识别和管理
- **proxy**: HTTP/SOCKS 代理地址，支持 `http://`、`https://`、`socks5://` 协议

### 2. 时序控制配置

```yaml
  schedule: "*/5 * * * * * *"  # Cron 表达式：每5秒回连一次
  jitter: 0.2                  # 时间抖动系数（20%随机偏移）
```

**字段说明：**

- **schedule**: 使用 Cron 表达式定义回连间隔，格式为 `秒 分 时 日 月 周 年`

- **jitter**: 抖动范围 (0.0-1.0)，避免规律性流量特征被检测

**常见 schedule 配置示例：**
```yaml
schedule: "*/30 * * * * * *"   # 每30秒
schedule: "0 */5 * * * * *"    # 每5分钟整点
schedule: "0 0 */2 * * * *"    # 每2小时整点
```

### 3. 重试策略配置

```yaml
  init_retry: 10        # 初始注册最大重试次数
  server_retry: 10      # 单服务器每轮最大重试次数  
  global_retry: 1000000 # 全局累计最大重试次数
```

**字段说明：**

- **init_retry**: 植入体首次向服务器注册时的重试次数

- **server_retry**: 多服务器环境下，每个服务器的重试次数

- **global_retry**: 防止无限重试的全局上限

### 4. 通信加密配置

```yaml
  encryption: aes              # 加密算法选择
  key: "maliceofinternal"      # 加密密钥
```

**支持的加密算法：**

- **aes**: AES 对称加密，平衡安全性和性能

- **xor**: XOR 异或加密，最轻量但安全性较低

- **chacha20**: ChaCha20 流密码，高安全性

### 5. DGA（域名生成算法）配置

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

### 6. 目标服务器配置

#### HTTP 连接配置

```yaml
targets:
  - address: "127.0.0.1:80"              # 服务器地址 (IP:端口)
    http:
      method: "POST"                     # HTTP 方法
      path: "/"                          # 请求路径
      version: "1.1"                     # HTTP 版本
      headers:                           # 自定义 HTTP 头
        User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        Content-Type: "application/octet-stream"
```

**字段说明：**

- **address**: 目标服务器的 IP 地址和端口

- **method**: HTTP 请求方法，推荐使用 `POST`（数据量大）或 `GET`（更隐蔽）

- **path**: 请求路径，可模拟合法 Web 资源路径如 `/api/v1/data`、`/jquery.min.js`

- **headers**: 自定义 HTTP 头，User-Agent 应匹配目标环境的常见浏览器

#### HTTPS (TLS) 连接配置

```yaml
targets:
  - address: "example.com:443"
    http:
      method: "POST"
      path: "/api/updates"
      version: "1.1" 
      headers:
        User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        Content-Type: "application/json"
    tls:
      enable: true                       # 启用 TLS 加密
      sni: "example.com"                 # Server Name Indication
      skip_verification: false           # 是否跳过证书验证
```

**TLS 字段说明：**

- **enable**: 启用 TLS/SSL 加密传输

- **sni**: 用于 TLS 握手的服务器名称，支持域名前置等技术

- **skip_verification**: 

  - `false`: 验证服务器证书（推荐，更可信）

  - `true`: 跳过验证（适用于自签名证书）

#### mTLS（双向认证）配置

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

#### TCP 连接配置

```yaml
targets:
  - address: "127.0.0.1:5001"            # TCP 服务器地址
    tcp: {}                              # 原始 TCP 连接
```

#### TCP + TLS 配置  

```yaml
targets:
  - address: "secure-tcp.example.com:5001"
    tcp: {}
    tls:
      enable: true
      sni: "secure-tcp.example.com"
      skip_verification: false
```

#### REM 协议配置

```yaml
targets:
  - address: "127.0.0.1:34996"           # REM 服务器地址
    rem:
      link: "tcp://username:password@127.0.0.1:34996?wrapper=demo123"
```

**REM 协议说明：**
- REM 是 IoM 的自定义协议，支持更灵活的流量伪装
- `link` 格式：`protocol://[auth@]host:port[?params]`

#### 多服务器配置

植入体支持多个备用服务器，按照 YAML 列表顺序进行轮换：

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
      
  # DGA 备用域名
  - address: "fallback.example.com:443"
    domain_suffix: "example.com"         # DGA 域名后缀
    http:
      method: "POST"
      path: "/updates"
      version: "1.1"
      headers:
        User-Agent: "Mozilla/5.0 (X11; Linux x86_64)"
    tls:
      enable: true
      sni: "fallback.example.com"
      skip_verification: false
```

**多服务器轮换逻辑：**

1. 按照配置顺序依次尝试连接

2. 单个服务器失败时，根据 `server_retry` 设置重试

3. 所有服务器都失败时，如果启用了 DGA，将生成新的域名重试

4. 达到 `global_retry` 限制后停止重试

---

## malefic-pulse 配置

Pulse 是 IoM 的轻量级 Stager，负责从服务器下载并执行主要的 Beacon 载荷。

### 1. 载荷标识配置

```yaml
flags:
  start: 0x41                    # 载荷起始标记字节
  end: 0x42                      # 载荷结束标记字节  
  magic: "beautiful"             # 魔术字符串验证
artifact_id: 0                   # 目标 Artifact ID
```

**字段说明：**

- **flags**: 用于在内存中定位和验证载荷数据的边界标记

- **artifact_id**: 指定从服务器拉取的编译产物 ID，`0` 表示拉取默认或最新版本

### 2. 通信配置

```yaml
target: "127.0.0.1:80"           # 目标服务器地址
encryption: xor                  # 加密算法
key: "maliceofinternal"          # 加密密钥
```

### 3. 协议配置

#### HTTP 协议

```yaml
protocol: "http"
http:
  method: "POST"
  path: "/pulse" 
  host: "127.0.0.1"
  version: "1.1"
  headers:
    User-Agent: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0"
    Content-Type: "application/octet-stream"
```

#### TCP 协议

```yaml
protocol: "tcp"
tcp: {}
```

**协议选择建议：**

- **HTTP**: 更好的流量伪装，适合大多数网络环境

- **TCP**: 更直接的连接方式，延迟更低但更容易被检测

---

## build - 编译构建配置

### 1. 编译工具链配置

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

### 2. OLLVM 混淆配置

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

!!! warning "性能影响"
    启用混淆会显著增加编译时间和二进制体积，同时可能影响运行时性能。建议先进行小规模测试。

### 3. 二进制元数据配置

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

**元数据伪装策略：**

1. **系统文件伪装**：
```yaml
company_name: "Microsoft Corporation"
product_name: "Windows Update"
file_description: "Windows Update Service"
original_filename: "WindowsUpdate.exe"
```

2. **第三方软件伪装**：
```yaml
company_name: "Adobe Inc."
product_name: "Adobe Acrobat Reader"
file_description: "Adobe Acrobat Reader DC"
original_filename: "AcroRd32.exe"
```

3. **开源软件伪装**：
```yaml
company_name: "The Mozilla Foundation"
product_name: "Firefox"
file_description: "Firefox Web Browser"
original_filename: "firefox.exe"
```

**权限配置说明：**

- **require_admin + require_uac = false**: asInvoker（推荐，最低暴露）

- **require_admin = false, require_uac = true**: highestAvailable

- **require_admin = true**: requireAdministrator（强制管理员权限）


##  implants配置解释

### 1. 基础运行时配置

```yaml
implants:
  runtime: tokio          # async runtime: smol/tokio/async-std
  mod: beacon             # malefic mod: beacon/bind
  register_info: true     # whether collect sysinfo when register
  hot_load: true          # enable hot load module
```

**字段解释：**

- **runtime**: 异步运行时框架，可选 `smol`/`tokio`/`async-std`。`tokio` 是最成熟的选择，性能和生态最好。

- **mod**: 植入体工作模式，`beacon`（回连模式）或 `bind`（监听模式）。`beacon` 适合穿透防火墙。

- **register_info**: 是否在首次连接时收集目标系统信息（OS版本、硬件等），便于后续决策但会增加初始流量。

- **hot_load**: 是否支持运行时动态加载新模块，提升灵活性但略增复杂度。

### 2. 模块管理配置

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

### 3. 文件打包与标识配置

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

### 4. 反检测与对抗配置

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

### 5. API 调用策略配置

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

### 6. 内存分配与执行配置

```yaml
  alloctor:
    # inprocess: "VirtualAlloc", "VirtualAllocEx",
    #            "VirtualAllocExNuma", "HeapAlloc",
    #            "NtMapViewOfSection", "NtAllocateVirtualMemory"
    inprocess: "NtAllocateVirtualMemory"
    # allocter_ex: "VirtualAllocEx", "NtAllocateVirtualMemory",
    #              "VirtualAllocExNuma", "NtMapViewOfSection"
    crossprocess: "NtAllocateVirtualMemory"
  sleep_mask: true
  stack_spool: true
  sacrifice_process: true
  fork_and_run: false
  hook_exit: true
  thread_stack_spoofer: true
```

**字段解释：**

- **alloctor**: 内存分配器选择

  - **inprocess**: 进程内分配，可选 `VirtualAlloc`/`HeapAlloc`/`NtAllocateVirtualMemory` 等

  - **crossprocess**: 跨进程分配，用于注入等场景

- **sleep_mask**: 休眠时加密内存，防止内存扫描检测

- **stack_spool**: 栈欺骗，伪造调用栈以绕过基于调用栈的检测

- **sacrifice_process**: 使用牺牲进程执行危险操作，保护主进程

- **fork_and_run**: 是否使用 fork 模式执行任务

- **hook_exit**: 钩子退出函数，确保清理工作完成

- **thread_stack_spoofer**: 线程栈欺骗，进一步增强隐蔽性

### 7. PE 文件签名修改配置

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

