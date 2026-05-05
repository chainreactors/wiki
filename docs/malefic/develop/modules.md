---
title: 模块系统
description: malefic 的功能以模块（Module）为基本单元组织。每个用户操作对应一个 module，由调度器分发执行。
edition: community
generated: false
source: imp:develop/modules.md
---

# 模块系统

malefic 的功能以模块（Module）为基本单元组织。每个用户操作对应一个 module，由调度器分发执行。

模块系统分为三层：

| 层次 | 位置 | 说明 |
|------|------|------|
| **InternalModule** | malefic-core | 基础管理：sleep、module/addon/task 管理 |
| **Module** | malefic-modules | 功能模块：文件、进程、执行、网络 |
| **3rd Module** | malefic-3rd / malefic-3rd-template | 第三方扩展：rem、curl、pty、自定义多语言模块 |

三层共享同一套 trait 和协议，区别在于编译方式和依赖范围。

---

## 模块执行模型

一个模块从用户发起操作到返回结果，经过以下路径：

```
用户操作 → Server 构造 Spite → Transport 传输 → Stub 分发
  → Manager 查找 Module → 创建 Input/Output channel
  → 调用 Module::run(id, receiver, sender) → 返回 TaskResult
  → 封装为 Spite 回传 → Server 解析展示
```

关键点：

1. **每个操作是一个 Task** ，有唯一 `task_id`，可查询、可取消
2. **Module 是无状态的** ，每次执行创建新实例（`new_instance()`）
3. **通信是双向的** ：`receiver` 接收输入，`sender` 发送中间结果，`return` 返回最终结果
4. **模块可以是流式的** ：upload/download/exec 等模块通过多次 recv/send 实现分块传输或实时输出

---

## Module Trait

所有模块实现两个 trait（`malefic-crates/module/src/lib.rs`）：

```rust
#[async_trait]
pub trait Module: ModuleImpl {
    fn name() -> &'static str where Self: Sized;
    fn new() -> Self where Self: Sized;
    fn new_instance(&self) -> Box<MaleficModule>;

    // 同步桥接，由 #[module_impl] 宏自动生成
    fn rt_run(&mut self, id: u32, recv: &mut Input, send: &mut Output) -> ModuleResult;
}

#[async_trait]
pub trait ModuleImpl {
    async fn run(&mut self, id: u32, recv: &mut Input, send: &mut Output) -> ModuleResult;
}
```

开发者只需实现 `ModuleImpl::run()`。`#[module_impl("name")]` 过程宏自动生成 `Module` 的全部方法，包括：

- `name()` — 返回混淆后的模块名字符串
- `new()` / `new_instance()` — 构造函数
- `rt_run()` — 同步桥接，用 noop_waker poll 循环驱动异步 future

`rt_run()` 的作用：当模块被编译为独立 DLL 热加载时，运行时的 `RtBridge` 在 `spawn_blocking` 线程中调用此方法，将异步模块适配为同步 C ABI。静态链接的模块直接走 async `run()`，不经过此路径。

### run 函数参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | `u32` | Task ID，每个用户任务的唯一标识 |
| `receiver` | `&mut Input` | 接收输入。大部分场景调用一次；流式/分块场景可多次调用 |
| `sender` | `&mut Output` | 发送中间结果。任务结束时通过 return 返回最终结果 |

### TaskResult

```rust
pub struct TaskResult {
    pub task_id: u32,
    pub body: Body,       // protobuf Body（LsResponse, ExecResponse, Response 等）
    pub status: Status,   // 成功/失败/错误原因
}
```

| 构造方法 | 用途 |
|---------|------|
| `TaskResult::new(id)` | 空成功结果 |
| `TaskResult::new_with_body(id, body)` | 带数据的成功结果 |
| `TaskResult::new_with_ack(id, block_id)` | 确认消息（分块传输） |
| `TaskResult::new_with_error(id, error)` | 错误结果 |

### TaskError

| 错误 | 状态码 | 说明 |
|------|--------|------|
| `OperatorError` | 2 | 模块内部错误（包裹 `anyhow::Error`） |
| `NotExpectBody` | 3 | body 类型不匹配 |
| `FieldRequired` | 4 | 缺少必要参数 |
| `FieldLengthMismatch` | 5 | 参数长度不匹配 |
| `FieldInvalid` | 6 | 参数无效 |
| `NotImpl` | 99 | 未实现 |

### 辅助宏

通过 `use crate::prelude::*` 导入：

| 宏 | 用途 |
|----|------|
| `check_request!(receiver, Body::Xxx)` | 从 receiver 提取指定类型请求 |
| `check_field!(field)` | 校验字段非空 |
| `check_field!(field, len)` | 校验字段长度 |
| `check_optional!(field)` | 校验 Option 非 None |
| `register_module!(map, feature, Type)` | 注册模块（带 feature 条件编译） |
| `to_error!(expr)` | 转为 anyhow::Error |
| `debug!(...)` | 调试输出（仅 debug 编译） |

---

## 开发一个 Module

### 最小示例

在 `malefic-modules/src/sys/` 下创建 `your_module.rs`：

```rust
use crate::prelude::*;

pub struct YourModule {}

#[async_trait]
#[module_impl("your_module")]
impl Module for YourModule {}

#[async_trait]
impl ModuleImpl for YourModule {
    async fn run(
        &mut self,
        id: u32,
        receiver: &mut malefic_module::Input,
        sender: &mut malefic_module::Output,
    ) -> ModuleResult {
        let request = check_request!(receiver, Body::Request)?;
        let input = check_field!(request.input)?;

        let mut response = Response::default();
        response.output = format!("received: {}", input);
        Ok(TaskResult::new_with_body(id, Body::Response(response)))
    }
}
```

这就是一个完整的模块。`#[module_impl("your_module")]` 会自动生成 `name()`、`new()`、`new_instance()`、`rt_run()` 四个方法，模块名会经过编译期混淆（`obfstr!`）。

### 流式输出示例

需要多次返回结果时，通过 `sender` 发送中间结果：

```rust
// 循环接收数据块
loop {
    let block = check_request!(receiver, Body::Block)?;
    file.write_all(&block.content)?;
    if block.end {
        return Ok(TaskResult::new_with_ack(id, block.block_id));
    }
    let _ = sender.send(TaskResult::new_with_ack(id, block.block_id)).await?;
}
```

### 集成步骤

**1. 添加 feature** （`malefic-modules/Cargo.toml`）：

```toml
[features]
your_module = []
# 如果有外部依赖
your_module = ["malefic-os-win/some_feature"]
# 可选：加入预设
sys_full = [..., "your_module"]
```

**2. 声明模块** （`malefic-modules/src/sys/mod.rs`）：

```rust
#[cfg(feature = "your_module")]
pub mod your_module;
```

平台限定：

```rust
#[cfg(all(feature = "your_module", target_family = "windows"))]
pub mod your_module;
```

**3. 注册模块** （`malefic-modules/src/lib.rs`）：

在 `register_modules()` 函数中添加：

```rust
register_module!(map, "your_module", sys::your_module::YourModule);
```

Windows-only 注册需要包在 `#[cfg(target_os = "windows")]` 块中。

同时在 `register_rt_modules!` 宏调用中添加（用于独立 DLL 编译）：

```rust
#[cfg(feature = "your_module")]
sys::your_module::YourModule,
```

### 编译验证

```bash
# 编译完整 beacon（包含你的模块）
malefic-mutant generate beacon
cargo build --release -p malefic --target x86_64-pc-windows-gnu

# 或编译为独立模块 DLL
malefic-mutant build modules --target x86_64-pc-windows-gnu -m as_module_dll,your_module
```

---

## 模块注册与加载机制

malefic 的模块有两条注册路径，对应两种使用方式：

### 静态链接：register_modules()

`malefic-modules/src/lib.rs` 中的 `register_modules()` 函数在编译时将模块注册到 `MaleficBundle`（`HashMap<String, Box<dyn Module>>`）。beacon 启动时调用此函数，所有注册的模块立即可用。

```rust
pub extern "C" fn register_modules() -> MaleficBundle {
    let mut map: MaleficBundle = HashMap::new();
    register_module!(map, "ls", fs::ls::Ls);
    register_module!(map, "exec", execute::exec::Exec);
    // ...
    map
}
```

`register_module!` 宏内部带 `#[cfg(feature = ...)]` 条件编译，未启用的 feature 对应的模块不会被编译进二进制。

### 动态加载：register_rt_modules!

当模块需要编译为独立 DLL 热加载时，使用 `register_rt_modules!` 宏生成 C ABI 导出。这个宏定义在 `malefic-crates/module/src/rtmodule.rs`，生成 7 个 `extern "C"` 函数：

| 导出函数 | 作用 |
|---------|------|
| `rt_abi_version()` | ABI 版本号，用于跨版本兼容检查 |
| `rt_module_count()` | 模块数量 |
| `rt_module_name(index)` | 按索引获取模块名 |
| `rt_module_create(name)` | 按名称创建模块实例 |
| `rt_module_destroy(handle)` | 销毁模块实例 |
| `rt_module_run(handle, ...)` | 执行模块（通过 RtChannel 双向通信） |
| `rt_free(buf)` | 释放返回的缓冲区 |

运行时加载 DLL 后，通过这组函数发现、创建、执行模块，无需共享 Rust 类型定义，实现跨版本兼容。

`malefic-modules` 同时包含两种注册：

```rust
// 静态链接路径
pub extern "C" fn register_modules() -> MaleficBundle { ... }

// DLL 热加载路径（仅 as_module_dll feature 启用时编译）
#[cfg(feature = "as_module_dll")]
malefic_module::register_rt_modules!(
    #[cfg(feature = "ls")] fs::ls::Ls,
    #[cfg(feature = "exec")] execute::exec::Exec,
    // ...
);
```

### 编译独立模块 DLL

```bash
# 编译为可热加载 DLL
malefic-mutant build modules --target x86_64-pc-windows-gnu \
  -m as_module_dll,execute_powershell,execute_assembly,execute_bof
```

编译产物：`target/<target_triple>/release/malefic_modules.dll`

热加载到运行中的 implant：

```bash
load_module --path modules.dll
```

典型场景：

1. **最小化初始载荷** ：`nano` 预设编译，按需 `load_module`
2. **快速迭代** ：开发新模块后动态加载测试
3. **静默状态** ：卸载所有模块进入 sleepmask 堆加密，需要时重新加载

---

## InternalModule

InternalModule 在 malefic-core 中定义，用于 implant 自身管理，不可卸载。

### basic

- `sleep` — 调整 sleep 间隔
- `suicide` — 退出 implant 进程
- `ping` — 交换心跳包
- `clear` — 清除所有额外加载的 modules 与 addons
- `init` — 用于 bind 模式下的初始化

### module 管理

!!! danger "编译时添加的模块无法被卸载"
    编译时组装的模块无法被卸载。但加载同名新模块时，新模块将覆盖本体模块。

- `list_module` — 列出当前所有 module
- `load_module` — 动态加载模块：
    - `--path module.dll` 从本地路径加载
    - `--artifact <name>` 使用服务端已编译的 artifact
    - `--modules basic,extend` 指定模块列表，服务端即时编译
    - `--3rd rem` 加载第三方模块
    - `--bundle <name>` 加载模块捆绑包
- `refresh_module` — 卸载所有动态加载的模块，恢复初始状态

!!! warning "module 动态加载限制"
    module 动态加载目前只支持 Windows

### addon 管理

addon 提供将数据临时加密保存在内存中的机制，减少重复传输。

- `list_addon` / `load_addon` / `execute_addon` / `refresh_addon`

### task 管理

- `query_task` — 查询 task 状态
- `cancel_task` — 取消 task（软取消）

---

## Feature 预设

通过 Cargo features 控制编译时的模块组装（`malefic-modules/Cargo.toml`）：

| 预设 | 包含模块 | 适用场景 |
|------|---------|---------|
| `nano` | 空 | 最小体积，仅 InternalModule |
| `base` | ls, cd, rm, cp, mv, pwd, cat, upload, download, exec, env, info | 基础操作 |
| `extend` | base + bypass, kill, whoami, ps, netstat, registry, service, taskschd, execute_bof, execute_shellcode, execute_assembly, execute_armory, execute_exe, execute_dll, execute_local, mkdir, touch, chmod | 扩展功能 |
| `full` | fs_full + execute_full + net_full + sys_full | 全部功能 |

分类预设：

| 预设 | 包含模块 |
|------|---------|
| `fs_full` | ls, cd, rm, cp, mv, pwd, mkdir, chown, chmod, cat, touch, pipe, enum_drivers |
| `sys_full` | info, ps, env, whoami, kill, bypass, netstat, service, inject, registry, taskschd, getsystem, runas, privs, rev2self, self_dele, wmi |
| `execute_full` | execute_assembly, execute_powershell, dllspawn, inline_local, exec, open, execute_shellcode, execute_bof, execute_armory, execute_exe, execute_dll, execute_local |
| `net_full` | upload, download |

在 `implant.yaml` 中配置：

```yaml
implants:
  modules:
    - "base"         # 基础预设
    - "execute_bof"  # 额外添加单个模块
    - "inject"
```

当前仓库的 `malefic-modules/Cargo.toml` 默认 feature 是 `execute_shellcode`。Mutant 会在 `generate beacon` 或 `build modules -m ...` 时按配置重写 default features，因此文档中的预设表示可选能力组合，不表示仓库检出后的默认构建结果。

---

## 已实现 Module 列表

### 文件系统 (fs)

| 模块 | 预设 | 说明 | 平台 |
|------|------|------|------|
| `ls` | base | 列出目录内容 | 全平台 |
| `cd` | base | 切换工作目录 | 全平台 |
| `rm` | base | 删除文件或目录 | 全平台 |
| `cp` | base | 复制文件 | 全平台 |
| `mv` | base | 移动/重命名文件 | 全平台 |
| `pwd` | base | 获取当前工作目录 | 全平台 |
| `cat` | base | 读取文件内容 | 全平台 |
| `mkdir` | extend | 创建目录 | 全平台 |
| `touch` | extend | 创建文件或修改时间戳 | 全平台 |
| `chmod` | extend | 修改文件权限 | Unix |
| `chown` | fs_full | 修改文件所有者 | Unix |
| `pipe` | fs_full | 命名管道（PipeRead/PipeUpload/PipeServer） | Windows |
| `enum_drivers` | fs_full | 枚举已加载的系统驱动 | Windows |

### 系统操作 (sys)

| 模块 | 预设 | 说明 | 平台 |
|------|------|------|------|
| `info` | base | 收集系统信息 | 全平台 |
| `ps` | extend | 列出进程列表 | 全平台 |
| `env` | base | 环境变量（Env/Setenv/Unsetenv） | 全平台 |
| `whoami` | extend | 获取当前用户信息 | 全平台 |
| `kill` | extend | 终止进程 | 全平台 |
| `netstat` | extend | 查看网络连接状态 | 全平台 |
| `bypass` | extend | AMSI/ETW 绕过 | Windows |
| `service` | extend | 服务管理（6 个子命令） | Windows |
| `registry` | extend | 注册表操作（5 个子命令） | Windows |
| `taskschd` | extend | 计划任务管理（7 个子命令） | Windows |
| `inject` | sys_full | 进程注入 | Windows |
| `getsystem` | sys_full | 提权到 SYSTEM | Windows |
| `runas` | sys_full | 以其他用户身份运行 | Windows |
| `privs` | sys_full | 获取/调整进程权限 | Windows |
| `rev2self` | sys_full | 恢复原始令牌 | Windows |
| `self_dele` | sys_full | 自删除 | Windows |
| `wmi` | sys_full | WMI 查询与方法执行 | Windows |

### 执行引擎 (execute)

| 模块 | 预设 | 说明 | 平台 |
|------|------|------|------|
| `exec` | base | 执行系统命令（支持实时输出流） | 全平台 |
| `open` | execute_full | 使用系统默认程序打开文件/URL | 全平台 |
| `execute_shellcode` | extend | 执行 shellcode | 全平台 |
| `execute_bof` | extend | 执行 BOF | Windows |
| `execute_assembly` | extend | .NET Assembly 内存执行 | Windows |
| `execute_powershell` | execute_full | PowerShell 内存执行 | Windows |
| `execute_armory` | extend | Armory 执行 | Windows |
| `execute_exe` | extend | PE/EXE 文件执行 | Windows |
| `execute_dll` | extend | DLL 文件执行 | Windows |
| `execute_local` | extend | 本地文件执行 | Windows |
| `dllspawn` | execute_full | DLL 牺牲进程执行 | Windows |
| `inline_local` | execute_full | 本地内联执行 | Windows |

### 网络操作 (net)

| 模块 | 预设 | 说明 | 平台 |
|------|------|------|------|
| `upload` | base | 文件上传（支持分块传输） | 全平台 |
| `download` | base | 文件/目录下载（分块传输、目录 tar 打包） | 全平台 |

---

## 延伸：3rd Module 与 Template

当模块需要引入第三方依赖（HTTP 库、FFI 绑定、其他语言实现等），应使用 3rd 模块机制，避免污染核心 implant 的依赖树。

### malefic-3rd：官方第三方模块

`malefic-3rd` 是官方维护的第三方模块集合，包含 rem、curl、pty、onedrive、ffmpeg、hook、agent 等模块。它与 `malefic-modules` 使用完全相同的 `Module` + `ModuleImpl` trait，区别仅在于：

- 可以引入任意外部 crate（ureq、portable-pty、ez-ffmpeg 等）
- 可独立编译为 DLL（`as_module_dll` feature）
- 通过 `register_3rd()` 注册，与 `register_modules()` 并行

详见 [3rd-party.md](/malefic/develop/3rd-party/)。

### malefic-3rd-template：多语言自定义模块

`malefic-3rd-template` 是面向用户的模块开发模板，支持 **Rust、Go、C、Zig、Nim** 五种语言。所有语言的模块统一使用 `Module` + `ModuleImpl` trait 编写，与 malefic-modules / malefic-3rd 完全一致。

`#[module_impl]` 宏会自动生成 `impl RtModule`，将异步 Module 桥接为同步 C ABI 接口，这个转换对用户完全无感。

非 Rust 语言（Go/C/Zig/Nim）通过 FFI 协议（`XxxModuleName()` + `XxxModuleHandle()`）与 Rust 桥接层交互，桥接层在 `ModuleImpl::run()` 中调用 `ffi_run_loop()` 完成数据转换。

详见 [module-development.md](/malefic/develop/module-development/)。

### 选择哪种方式？

| 场景 | 推荐方式 |
|------|---------|
| 核心功能，无外部依赖 | 在 `malefic-modules` 中添加 Module |
| Rust 实现，需要外部 crate | 在 `malefic-3rd` 中添加 Module |
| Go/C/Zig/Nim 实现 | 使用 `malefic-3rd-template` |
| 快速原型，不想改主仓库 | 克隆 `malefic-3rd-template` 独立开发 |

---

## 相关文档

- [3rd 模块](/malefic/develop/3rd-party/) — 官方第三方模块（rem、curl、pty 等）
- [3rd Template](/malefic/develop/module-development/) — 多语言自定义模块开发模板
- [编译手册](/malefic/getting-started/) — 完整编译流程与配置说明
- [Win-Kit 文档](/malefic/getting-started/components/win-kit/) — Windows 功能库
