---
title: 更新日志
description: '- [refactor] 从单体 implant 重构为可组装框架，拆分为 6 个独立组件： - malefic-pulse — 极简
  stager (4KB) - malefic-starship — 全功能 loader 框架 - malefic-reactor — 独立模块引擎 (cdylib)
  - mal...'
edition: community
generated: false
source: wiki:changelog.md
---

# IoM Changelog

## v0.3.0

### Implant

#### Architecture

- [refactor] 从单体 implant 重构为可组装框架，拆分为 6 个独立组件：
  - `malefic-pulse` — 极简 stager (~4KB)
  - `malefic-starship` — 全功能 loader 框架
  - `malefic-reactor` — 独立模块引擎 (cdylib)
  - `malefic-3rd-template` — 多语言模块开发模板
  - `malefic-gateway` — 统一混淆入口
  - `malefic-features` — 统一 feature hub
- [refactor] 适配任意版本的 Rust，不再被 toolchain 版本限制
- [refactor] prost 去掉静态特性，proto 编解码更灵活
- [refactor] wmi 内化，不再依赖外部 wmi 库

#### Starship (新组件)

- [feat] 64 种 shellcode 执行技术，覆盖主流注入手法：
  - 自注入 (6种): `func_ptr`, `fiber_exec`, `tls_callback`, `threadpool_work` 等
  - Syscall (10种): `direct_syscall`, `indirect_syscall`, `halos_gate`, `ninja_syscall` 等
  - 远程注入 (7种): `nt_api_remote`, `remote_mockingjay`, `thread_hijack` 等
  - APC (9种): `apc_nttestalert`, `apc_dll_overload`, `threadless_apc`, `phantom_dll_apc` 等
  - DLL (5种): `dll_overload`, `dll_entrypoint_hijack`, `dll_notification` 等
  - Callback (5种): `enum_fonts`, `uuid_enum_locales` 等
  - VEH/异常 (7种): `veh_rop`, `veh_debug_reg`, `hwbp_exec`, `hwbp_xor` 等
  - Hook/Trampoline (7种): `rop_trampoline`, `vmt_hook`, `vt_ptr_redirect` 等
  - PoolParty (8种): ThreadPool 注入变体 V1-V8 (Black Hat EU 2023)
- [feat] 每种技术独立 feature-gated，编译时只包含所选技术
- [feat] `random_loader()` 随机选择加载器
- [feat] 12 种编码算法：XOR, RC4, AES, DES, ChaCha, Base64, Base45, Base58, UUID, MAC, IPv4 等
- [feat] 8 种规避技术（集成 `malefic-evader`）：
  - 反沙箱检测（10 项环境检查）
  - ntdll 脱钩（从磁盘读取干净 ntdll .text 段覆盖内存）
  - ETW bypass（多种 patch 方式）
  - Sleep 加密（休眠时 XOR 加密栈内存）
  - 反取证（清理注册表痕迹和 prefetch 文件）
- [feat] 4 种编译时混淆：
  - `obf_strings`：编译时 AES 加密所有字符串字面量，运行时解密
  - `obf_junk`：注入垃圾代码和虚假控制流
  - `obf_memory`：shellcode 使用后安全清零
  - `obf_flow`：控制流平坦化
- [feat] 基础 loader 经 `opt-level = "z"` + LTO + strip 优化后仅 30-50KB

#### Transport

- [refactor] 协议无关的 transport 接口，统一到泛型 trait：
```rust
pub trait TransportImpl: AsyncRead + AsyncWrite + Unpin + Send {}
```
  TCP、TLS、REM、Graph 均为该 trait 的不同实现
- [refactor] 异步运行时解耦，不再绑定 tokio，支持 tokio/async-std/smol 三种运行时
- [feat] 双工支持：半双工 (beacon 请求-响应) 和全双工 (keepalive 双向并发)，运行时可互转
- [feat] ServerManager 多目标轮转：主目标不可达时自动切换备用，全部失败后指数退避重连
- [feat] Switch internal module，支持运行时动态切换连接目标：
  - `REPLACE`：替换所有目标列表
  - `ADD`：添加新目标
  - `SWITCH`：立即切换到指定目标
  - 切换前 `verify_target` 预连接检查，确保目标可达
  - 支持运行时更新传输密钥
- [feat] REM transport：通过 FFI 接口实现 `REMTransport`，经 5 轮重构 (blocking → channel → zero-thread → TryRead) 实现零额外线程非阻塞 I/O 桥接
- [feat] socks5/http 代理出网
- [fix] TLS 改为运行时动态判断（不再编译时固定）
- [refactor] Session 统一为单一 deadline 超时模型
- [refactor] 自适应 duplex 退避（1ms/10ms/50ms 三级）
- [fix] 修复大量边界条件下 implant 假死的 bug

#### Module Runtime

- [refactor] 纯 C ABI 模块协议，解决跨 Rust 版本 ABI 不兼容问题。模块 DLL 只需导出 7 个 C 函数：
```c
rt_abi_version()                    // ABI 版本协商
rt_module_count()                   // 模块数量
rt_module_name(index)               // 模块名称
rt_module_create(name_ptr, len)     // 创建模块实例
rt_module_destroy(handle)           // 销毁模块实例
rt_module_run(handle, task_id, ...) // 执行模块
rt_free(buf)                        // 释放内存（模块侧分配器）
```
- [feat] 模块和宿主各自使用独立内存分配器，保证跨版本编译无 UB
- [feat] `register_rt_modules!` 宏：一行代码生成全部 7 个 C 导出
```rust
register_rt_modules!(MyModule1, MyModule2);
```
- [feat] RtBridge：同步到异步桥接层，通过 `spawn_blocking` 将模块统一到阻塞线程池执行
```
async ModuleImpl::run()
    ↓ #[module_impl] 宏生成 rt_run()（noop_waker poll loop）
RtBridge::run()
    ↓ spawn_blocking
阻塞线程池
```
- [feat] `#[module_impl]` 过程宏自动生成同步桥接代码
- [feat] PluginLoader：模块 DLL 通过 PE loader 从内存加载，不落盘，支持动态加载和卸载

#### Reactor (新组件, Pro)

- [feat] `malefic-reactor` — headless malefic，剥离网络/beacon/transport，保留纯模块加载与执行能力
- [feat] 编译为标准动态库 (cdylib)：Windows `malefic_reactor.dll` / Linux `libmalefic_reactor.so`
- [feat] 4 个 C FFI 导出即可使用全部模块能力：
```c
rt_host_init()      // 初始化引擎
rt_host_execute()   // 执行模块（输入/输出均为 protobuf 编码的 Spite）
rt_host_shutdown()  // 关闭引擎
rt_host_free()      // 释放内存
```
- [feat] 支持 `--features base/full/extend` 静态链接 malefic-modules
- [feat] `cbindgen` 自动生成 `include/malefic_reactor.h` C 头文件
- [feat] 纯 native 层 webshell 能力：可被 ASP.NET native module / Java JNI / PHP extension 加载到 Web 服务器进程
  - 运行在 native 层，脱离脚本引擎的 RASP 监控
  - 单个 DLL 提供完整后渗透工具集（BOF/Assembly/.NET/Shellcode）
  - 支持 `load_module` 运行时热加载扩展模块
- [feat] internal module 调度：ping, init, list_module, refresh_module, load_module, unload_module, clear, task 管理
- [feat] 拒绝 beacon-only 模块（sleep/suicide/switch/keepalive/key_exchange），返回明确错误
- [feat] 通过 `malefic-mutant build reactor -m <feature>` 一键编译
- [feat] 跨平台 C 测试套件：7 个 test case (Windows LoadLibrary + Linux dlopen)

#### 3rd Template (新组件)

- [feat] 多语言模块开发模板，支持 5 种语言：Rust, Go (cgo), C (nanopb), Zig, Nim
- [feat] 项目结构：
```
malefic-3rd-template/
├── malefic-3rd-ffi/    # 共享 FFI 类型定义
├── malefic-3rd-rust/   # Rust 模块示例
├── malefic-3rd-go/     # Go 模块示例
├── malefic-3rd-c/      # C 模块示例
├── malefic-3rd-zig/    # Zig 模块示例
└── malefic-3rd-nim/    # Nim 模块示例
```

#### Pulse

- [refactor] 完全 `no_std`，零外部依赖
- [feat] 通过 `global_asm!` 实现 RIP 相对寻址 (x64/x86)，位置无关
- [feat] 双入口点：`entry()` 直接调用 + `DllMain()` DLL 加载
- [feat] 运行时 hash 解析 ntdll/kernel32 API，无导入表
- [feat] 可选 shellcode 模式：自定义 linker script 合并所有段到 `.text`

#### Mutant

- [feat] BDF (Binary Backdoor Factory)：PE 文件后处理
  - Code Cave 查找
  - 8 种执行技术：Direct, CreateThread, Fiber, APC, EnumFonts, EnumLocales, Threadpool, NtCreateThread
  - 3 层规避：A 层 (Hash: ror13/djb2/fnv1a)、B 层 (多态: 寄存器重分配/指令替换)、C 层 (Stub 加密)
- [feat] `rebuild_srdi` feature：编译时从源码构建 `malefic-srdi` (no_std 反射加载器)，通过 goblin 提取 `.text` 段生成 shellcode
- [refactor] bitcode prebuild：malefic-win-kit 使用 bitcode 预编译替代符号 hack

#### 代码架构重组

- [refactor] 将单体 `malefic-core` / `malefic-helper` / `malefic-trait` 拆解为 **27 个职责单一的底层库** ，统一收归 `malefic-crates/`
  - 基础设施：common (运行时抽象)、gateway (混淆门面)、features (构建维度)、proto (协议)
  - 通信：transport、config、crypto、codec、dga、rem
  - 模块系统：module、runtime、manager、scheduler
  - 系统能力：process、loader、os-win、sysinfo、net
  - OPSEC：obfuscate、macro、evader、guardrail
- [refactor] `malefic-common`：运行时解耦，tokio/async-std/smol 通过 feature 一键切换
- [refactor] `malefic-gateway`：混淆统一入口，community (no-op) / professional 编译时透明切换
- [refactor] `malefic-features`：集中管理 source/prebuild × community/professional 两个正交维度
- [refactor] workspace 统一依赖版本，`workspace.dependencies` 集中管理
- [refactor] FFI 隔离：`malefic-module/ffi` feature gate，C ABI 导出不污染正常构建

#### OPSEC — 四阶段 × 三维度全链路防护 (Pro)

**通用混淆引擎 (malefic-obfuscate)** — 贯穿 Loader / SRDI / Beacon / Module 所有阶段：

- [feat] `malefic-obfuscate` 编译期混淆引擎 + `malefic-macro` 过程宏引擎
- [feat] 字面量加密：`obf_string!` / `obfstr!` / `obf_bytes!` / `obf_int!` — AES-256-CTR + 双掩码
- [feat] 控制流混淆：`flow!` / `obf_stmts!` — XOR 链状态机 + dummy state
- [feat] 垃圾代码注入：`#[junk(density = N)]` — 5 种模板，`black_box()` 阻止消除
- [feat] 函数级组合：`#[obfuscate(flow, junk = 2)]` — 字面量 + 控制流 + 垃圾一键应用
- [feat] 结构体字段加密：`#[derive(Obfuscate)]` — AES-256-CTR + HMAC-SHA256，RAII guard
- [feat] 加密文件嵌入：`include_encrypted!` — AES 或 XOR 模式
- [feat] `lazy_static!` 替代：自动字面量混淆
- [feat] OLLVM 集成：ollvm16/17 Docker 镜像，编译器级控制流/指令替换/虚假控制流
- [feat] 编译期随机数：每次编译生成不同的密钥/IV/操作链/状态机布局

**① Loader 阶段 (Starship + malefic-evader)** ：

- [feat] BDF 白文件 patch：Code Cave 查找 + section 注入，8 种执行技术 × 3 层规避
- [feat] 上百种技术任意组合：64 loader × 12 编码 × 8 规避 × 4 混淆
- [feat] `malefic-evader` 10 大运行时规避模块（全部 feature-gated）：
  - `anti_emu`：10 项环境检查（文件系统/时序/进程/NUMA/内存/CPU 速度），≥6 项通过
  - `god_speed`：挂起 cmd.exe → 读取干净 ntdll .text → 覆盖本地 hook
  - `api_untangle`：从磁盘 ntdll 恢复被 hook 函数前 8 字节
  - `etw_pass`：patch NtTraceEvent / 硬件断点 Dr0 + VEH / 干净 ntdll 还原
  - `cfg_patch`：扫描 ntdll CFG 校验指令 (`bt r11,r10`) 并替换
  - `sleep_encrypt`：挂起线程 → XOR 栈加密 → KUSER_SHARED_DATA 计时
  - `anti_forensic`：清理注册表 (Run/UserAssist/ShimCache) + Recent + Prefetch
  - `normal_api`：随机良性 API 调用制造行为噪声
- [feat] anti-sandbox 深度检测：
  - 硬件：CPU 核心数、USB 设备历史
  - 系统信息：VM 注册表特征、可疑进程 (wireshark/procmon/debugger)、进程总数
  - 时序：Sleep 加速检测、计时源不一致
  - 虚拟化：CPUID hypervisor bit + vendor string (VBox/VMware/Hyper-V/QEMU/Xen) + 执行周期分析

**② SRDI 阶段** ：

- [feat] 唯一正确处理 Rust 静态 TLS 回调的反射加载器
- [feat] 模块踩踏 (module stomping)：shellcode 写入合法 DLL 内存映射，呈现为 MEM_IMAGE
- [feat] BeaconGate 集成：SRDI 阶段敏感 API 调用动态路由保护

**③ Beacon 阶段** ：

- [feat] Guardrail 环境校验：IP/用户名/主机名/域名正则匹配，不满足则立即退出
- [feat] Sleep Obfuscation：Fiber + NtContinue CONTEXT 链 (7 步)
  - RWX 内存：RC4 (SystemFunction040/041) 加密代码页
  - 堆：XOR (rdtsc key) 加密 HypnusHeap（自定义 GlobalAlloc 私有堆）所有分配
  - 三种策略：Timer / Wait / Foliage
- [feat] `SecureBox<T>` 加密容器 + 页锁定 (VirtualLock 防换出) + volatile 擦除 (compiler fence)
- [feat] Win-Kit 全套：
  - 进程镂空 (支持 win11 24H2) + Sacrifice Process + PPID 欺骗 + 参数伪装
  - DLL 加载阻止（强制微软签名）
  - AMSI/ETW/WLDP bypass（.NET/PowerShell 自动 hook，执行后恢复）
  - 内存 PE 加载、Unmanaged PowerShell (CLR hosting)、BOF 执行、.NET Assembly
  - Token 操作（令牌窃取与模拟）

**④ Module 阶段** ：

- [feat] 内存加载不落盘 (PE loader)，BeaconGate 保护，可随时卸载
- [feat] 可选完整 malefic-obfuscate 混淆

#### Bug Fixes

- [fix] PE loader IFT 边界检查修复，解决多 DLL 加载崩溃
- [fix] download 模块 TOCTOU 竞态和 off-by-one
- [fix] 超大任务结果自动分片传输
- [fix] exec 模块错误时正确返回 ExecResponse 而非 panic
- [fix] 指数退避：全部 server 轮转失败后自动退避重连
- [fix] 近 200 个 bug 修复，测试覆盖：transport 32 + session 10 + beacon 11 + runtime 44 + 其他

---

### Server/Client

#### Agent / MCP / LocalRPC (新功能)

- [feat] LocalRPC：client 内置本地 RPC 服务，外部程序可枚举命令、执行命令、查询状态
- [feat] Lite MCP：精简版 MCP 服务端，AI Agent 通过 MCP 协议发现 IoM 能力集
- [feat] Skill 系统：将命令组封装为高层语义动作
- [feat] Tapping：AI 监听 implant 事件流
- [feat] Poison：向 AI 上下文注入领域知识
- [feat] 内置 LLM Provider Proxy，支持本地模型和云端模型

#### CLI / TUI

- [feat] Quickstart 向导：首次运行交互式初始化
- [feat] Starship 风格 Prompt：动态显示当前上下文 (listener/session/状态/OPSEC 评分)
- [refactor] 异步日志系统：不阻塞命令输入
- [feat] Terminal Multiplexer：多窗口支持
- [feat] Inline suggestion：实时命令建议
- [feat] Bracketed paste：正确处理多行粘贴
- [feat] Usage hint：命令输入错误时显示用法提示
- [feat] 表格自适应列宽
- [feat] Profile show：CLI 中预览 profile 配置
- [refactor] 配置子命令统一
- [feat] Daemon mode：client 后台服务运行

#### Listener / Pipeline

- [feat] CustomPipeline：通过配置文件定义完全自定义通信管线
- [feat] 每条 Pipeline 独立 packet_length 配置
- [feat] REM 动态轮询间隔
- [feat] TCP listener 支持 mTLS 双向认证
- [feat] Website 支持 HTTP Basic Auth
- [feat] 按 agent-id 自动解析 pipeline
- [feat] Keepalive module 细粒度连接保活策略

#### Build / Profile / Plugin

- [feat] Patch Build Mode：在已有二进制上直接 patch 配置
- [feat] Profile 持久化到磁盘，重启自动恢复
- [feat] 可配置 Malefic Root 路径
- [refactor] 模块命令整合 (load_module/list_module/unload_module)
- [feat] `execute_request` 直接向动态加载模块发送请求
- [feat] 多 embedded plugin 支持
- [feat] MAL zip 安装
- [feat] 可选 EvilClaw 集成
- [refactor] Redacted 文件下载改为 Lua mal 插件实现

#### 安全 / 认证 / 运维

- [refactor] 认证系统简化为 fingerprint auth (HMAC-SHA256 密钥交换)
- [feat] 空 PSK 冷启动（首个 client 自动成为管理员）
- [refactor] ACME 证书申请从 HTTP-01 切换到 DNS-01 challenge
- [feat] PostgreSQL 支持（之前仅 SQLite）
- [feat] 日志按天轮转 + gzip 压缩 + 保留策略
- [feat] Lark webhook 签名校验
- [feat] 用户 reset 和认证备份机制

#### 测试与稳定性

- [test] 大量新增 unit / integration / E2E / race test
- [test] 覆盖：Server 并发 deadlock/race、Listener 边界条件、下载断点续传、Runtime panic/nil guard、Client 命令解析边界
- [ci] 持续运行回归测试
