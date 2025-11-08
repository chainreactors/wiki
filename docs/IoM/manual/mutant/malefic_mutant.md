# Malefic-mutant用法

mutant 参考了一系列项目提供了一系列用于二进制文件处理和操作的实用工具。

## SRDI

将 PE 文件转换为可反射加载的 shellcode，支持 TLS 回调。

### 用法

```bash
malefic-mutant tool srdi [OPTIONS]
```

### 参数说明

- `-i, --input <INPUT>` - 源可执行文件路径
- `-o, --output <OUTPUT>` - 输出 shellcode 路径（默认：malefic.bin）
- `-a, --arch <ARCH>` - 目标架构 x86/x64（默认：x64）
- `-p, --platform <PLATFORM>` - 目标平台（默认：win）
- `-t, --type <TYPE>` - SRDI 类型：
  - `link` - 不支持 TLS
  - `malefic` - 支持 TLS（默认）
- `--function-name <FUNCTION_NAME>` - 指定函数名
- `--userdata-path <USERDATA_PATH>` - 用户数据路径

### 示例

```bash
# 基本用法：将 PE 文件转换为 x64 shellcode
malefic-mutant tool srdi -i malefic.exe -o malefic.bin

# 生成 x86 架构的 shellcode，支持 TLS
malefic-mutant tool srdi -i payload.exe -o payload.bin -a x86 -t malefic

# 指定入口函数名
malefic-mutant tool srdi -i beacon.dll -o beacon.bin --function-name ReflectiveLoader
```

## Strip

从二进制文件中移除路径信息，减少文件特征。

### 用法

```bash
malefic-mutant tool strip -i <INPUT> -o <OUTPUT> [OPTIONS]
```

### 参数说明

- `-i, --input <INPUT>` - 源二进制文件路径
- `-o, --output <OUTPUT>` - 输出二进制文件路径

### 示例

```bash
# 基本用法：清理二进制文件中的路径信息
malefic-mutant tool strip -i malefic.exe -o malefic_stripped.exe
```

## Objcopy - 对象复制工具

类似于 GNU objcopy 的功能，用于转换二进制文件格式。

### 用法

```bash
malefic-mutant tool objcopy -O <OUTPUT_FORMAT> <INPUT> <OUTPUT>
```

### 参数说明

- `-O <OUTPUT_FORMAT>` - 输出格式（如：binary）
- `<INPUT>` - 输入文件路径
- `<OUTPUT>` - 输出文件路径

### 示例

```bash
# 将 PE 文件转换为纯二进制格式
malefic-mutant tool objcopy -O binary input.exe output.bin
```

## Sigforge - 签名操作工具

用于 PE 文件数字签名的提取、复制、注入、移除和检查。

### Extract - 提取签名

从已签名的 PE 文件中提取数字签名。

```bash
malefic-mutant tool sigforge extract -i <INPUT> [-o <OUTPUT>]
```

**参数：**
- `-i, --input <INPUT>` - 输入的已签名 PE 文件
- `-o, --output <OUTPUT>` - 输出签名文件路径（可选）

**示例：**
```bash
malefic-mutant tool sigforge extract -i signed.exe -o signature.sig
```

### Copy - 复制签名

将一个 PE 文件的签名复制到另一个 PE 文件。

```bash
malefic-mutant tool sigforge copy -s <SOURCE> -t <TARGET> [-o <OUTPUT>]
```

**参数：**
- `-s, --source <SOURCE>` - 源 PE 文件（已签名）
- `-t, --target <TARGET>` - 目标 PE 文件（待签名）
- `-o, --output <OUTPUT>` - 输出文件路径（可选，不指定则覆盖目标文件）

**示例：**
```bash
# 从合法程序复制签名到自定义程序
malefic-mutant tool sigforge copy -s legitimate.exe -t malefic.exe -o malefic_signed.exe

# 直接覆盖目标文件
malefic-mutant tool sigforge copy -s microsoft_signed.exe -t payload.exe
```

### Inject - 注入签名

将签名文件注入到 PE 文件中。

```bash
malefic-mutant tool sigforge inject -s <SIGNATURE> -t <TARGET> [-o <OUTPUT>]
```

**参数：**
- `-s, --signature <SIGNATURE>` - 签名文件路径
- `-t, --target <TARGET>` - 目标 PE 文件
- `-o, --output <OUTPUT>` - 输出文件路径（可选）

**示例：**
```bash
malefic-mutant tool sigforge inject -s signature.sig -t unsigned.exe -o signed.exe
```

### Remove - 移除签名

从 PE 文件中移除数字签名。

```bash
malefic-mutant tool sigforge remove -i <INPUT> [-o <OUTPUT>]
```

**参数：**
- `-i, --input <INPUT>` - 输入的 PE 文件
- `-o, --output <OUTPUT>` - 输出文件路径（可选）

**示例：**
```bash
malefic-mutant tool sigforge remove -i signed.exe -o unsigned.exe
```

### Check

检查 PE 文件的签名状态。

```bash
malefic-mutant tool sigforge check -i <INPUT>
```

**参数：**
- `-i, --input <INPUT>` - 需要检查的 PE 文件

**示例：**
```bash
malefic-mutant tool sigforge check -i malefic.exe
```

## Patch - 二进制补丁

对已编译的二进制文件进行补丁操作，可修改 NAME、KEY 或 SERVER 地址等信息。

### 用法

```bash
malefic-mutant tool patch [OPTIONS]
```

## 使用场景

### 签名伪造工作流

1. 从合法软件提取签名
2. 将签名复制到自定义程序
3. 检查签名是否成功应用

```bash
# 完整工作流示例
malefic-mutant tool sigforge extract -i legitimate.exe -o sig.bin
malefic-mutant tool sigforge inject -s sig.bin -t malefic.exe -o malefic_signed.exe
malefic-mutant tool sigforge check -i malefic_signed.exe
```

### Shellcode 生成工作流

1. 编译 PE 文件
2. 清理路径信息
3. 转换为 SRDI shellcode

```bash
# 完整工作流示例
malefic-mutant tool strip malefic.exe
malefic-mutant tool srdi -i malefic.exe -o malefic.bin -t malefic
```
