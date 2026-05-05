---
title: Malefic
description: malefic 是目前IoM提供的默认implant.
edition: community
generated: false
source: imp:index.md
---

# Malefic

malefic 是目前IoM提供的默认implant.

项目地址: https://github.com/chainreactors/malefic

### 架构

rust的crate的结构就是malefic的组成部分

**主体结构:**

- malefic, 主程序, 包含了beacon/bind两种模式的完整功能
- malefic-mutant,  用来实现自动化配置malefic的各种条件编译与特性, 以及生成shellcode, srdi等
- malefic-pulse, 最小化的shellcode模板, 对应CS的artifact, 能编译出只有4kb的上线马, 非常适合被各种loader加载
- malefic-prelude, 多段上线的中间阶段, 可以在这里按需配置权限维持, 反沙箱, 反调试等功能
- malefic-srdi, 最先进的srdi技术, 最大程度减少PE特征
- malefic-starship (Pro), 模块化shellcode加载框架, 支持60+执行技术、12种编码方案、8种运行时规避模块
- malefic-reactor, 独立runtime DLL, 通过C ABI提供模块加载与执行能力 (headless malefic)
- malefic-3rd, 第三方模块集合, 提供rem、curl等扩展模块
- malefic-proxydll, 代理DLL生成器, 支持DLL劫持与代理转发
- malefic-crates/*, 当前真实的基础设施层, 包含 module/manager/stub/transport/scheduler 等 workspace crate

**基础库 (`malefic-crates/`):**

malefic-crates 下包含了22个子crate, 构成了malefic的基础设施层:

| crate | 说明 |
|-------|------|
| `malefic-module` | 模块trait定义与基础接口 |
| `malefic-proto` | 协议库, 定义了implant与server数据交互的协议 |
| `malefic-crypto` | 加密库 (AES, ChaCha20, XOR) |
| `malefic-transport` | 传输协议 (TCP, HTTP, REM, TLS) |
| `malefic-config` | 配置管理 |
| `malefic-scheduler` | 任务调度 |
| `malefic-dga` | 域名生成算法 |
| `malefic-cron` | Cron表达式解析 |
| `malefic-codec` | 编解码 (Base64/45/58, AES2, DES, UUID, MAC, IPv4) |
| `malefic-obfuscate` (Pro) | 编译期混淆运行时 |
| `malefic-macro` (Pro) | 过程宏引擎 |
| `malefic-evader` (Pro) | 规避技术 (anti-emu, etw_pass, cfg_patch, sleep_encrypt等) |
| `malefic-guardrail` | 环境检测护栏 |
| `malefic-loader` | 进程注入/shellcode加载 |
| `malefic-process` | 进程操作 (跨平台) |
| `malefic-net` | 网络工具 |
| `malefic-sysinfo` | 系统信息采集 |
| `malefic-autorun` | 自动运行 |
| `malefic-common` | 通用工具 |
| `malefic-manager` | 模块管理 (addon/hot-load) |
| `malefic-runtime` | 跨版本模块运行时 (C ABI + protobuf), 可编译为独立 DLL |
| `malefic-rem` | REM协议 |
| `malefic-win` | Windows OS特定功能 |

**功能模块:**

- malefic-modules, 各种模块的具体实现, 覆盖文件系统、进程管理、网络操作、执行引擎等功能
- malefic-crates/stub, 默认组合根与 stub 逻辑
- malefic-crates/manager, 模块注册表、热加载与查询接口
- malefic/src/session_loop.rs, beacon/bind 共享的模式驱动

**kits** (二进制开源):

- malefic-win-kit, 实现了loadpe, UDRL, SRDI, CLR, BOF执行, 堆栈混淆, BeaconGate等高级特性的OPSEC实现, 详见 [win_kit文档](/malefic/getting-started/components/win-kit/)
- 在professional版本中还会提供linux与mac的kit ......

IoM计划提供一整套互相解耦的implant解决方案, 实现各个阶段各种需求不同的二进制文件生成.

*在已经实现的内容中还有更多的内容受限于精力没有文档化. 我们暂时编写了关于使用的简单介绍. 后续将随着开发进度逐步补全所有组件的设计与api文档.*

---

## 文档导航

### 核心文档

| 文档 | 说明 |
|------|------|
| [架构设计](/malefic/getting-started/architecture/) | 从 Starship 到 Malefic 的层层组装架构 |
| [编译与配置手册](/malefic/getting-started/) | 编译环境、入口流程与各组件构建索引 |

### 开发文档

| 文档 | 说明 |
|------|------|
| [Develop 入口](/malefic/develop/) | FFI、模块系统与扩展开发索引 |
| [FFI 接口](/malefic/develop/ffi/) | Win-Kit 多语言调用接口（C/Go/Rust/Python/C#） |
| [FFI Library](/malefic/develop/ffi-library/) | FFI 库接口与宿主集成 |
| [模块系统](/malefic/develop/modules/) | Module trait、内置模块与执行模型 |
| [第三方模块](/malefic/develop/3rd-party/) | malefic-3rd 官方扩展模块 |
| [自定义模块开发](/malefic/develop/module-development/) | malefic-3rd-template 多语言模块开发 |

### 入口 Crate 文档

| Crate | 文档 | 说明 |
|-------|------|------|
| **malefic** | [malefic.md](/malefic/getting-started/components/malefic/) | 主程序入口，beacon/bind 模式、运行时编排、命令分发 |
| **malefic-mutant** | [mutant.md](/malefic/getting-started/components/mutant/) | 配置生成、编译构建与 implant.yaml |
| ↳ relink | Relink (Pro) | PE 后链接随机化（anti-YARA） |
| **malefic-pulse** | [pulse.md](/malefic/getting-started/components/pulse/) | 轻量级 shellcode stager（~4KB） |
| **malefic-prelude** | [prelude.md](/malefic/getting-started/components/prelude/) | 多段上线中间阶段加载器 |
| **malefic-3rd** | [3rd-party.md](/malefic/develop/3rd-party/) | 第三方模块（rem、curl、pty 等） |
| **malefic-3rd-template** | [module-development.md](/malefic/develop/module-development/) | 多语言自定义模块开发模板（Rust/Go/C/Zig/Nim） |
| **malefic-proxydll** | [proxydll.md](/malefic/getting-started/components/proxydll/) | DLL 劫持框架 |
| **malefic-modules** | [modules.md](/malefic/develop/modules/) | 功能模块实现 |
| **malefic-reactor** | [reactor.md](/malefic/getting-started/components/reactor/) | Headless runtime DLL, C ABI 模块加载与执行 |
| **malefic-win-kit** | [win-kit.md](/malefic/getting-started/components/win-kit/) | Windows 攻击性工具包 |
| **malefic-starship** (Pro) | Starship (Pro) | Shellcode 加载框架 |

### 高级主题

| 文档 | 说明 |
|------|------|
| [Runtime FFI Host](/malefic/getting-started/components/reactor/) | Runtime DLL 编译与通讯协议（headless malefic） |
| 混淆技术 (Pro) | 源码级混淆与 OLLVM |
| 宏系统 (Pro) | 过程宏与编译期混淆 |

### 快速链接

- **架构总览** : [architecture.md](/malefic/getting-started/architecture/)
- **构建入口** : [build.md](/malefic/getting-started/)
- **Build 文档** : [build/index.md](/malefic/build/)
- **Mutant 工具** : [mutant/index.md](/malefic/mutant/)
- **Malefic 构建** : [build/malefic.md](/malefic/build/malefic/)
- **Pulse 构建** : [build/pulse.md](/malefic/build/pulse/)
- **模块构建** : [build/modules.md](/malefic/build/modules/)
