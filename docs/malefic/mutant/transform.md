---
title: Transform — Payload 编码与二进制转换
description: malefic-mutant tool 中负责 payload 编码、shellcode 转换和二进制提取的工具集合。
edition: community
generated: false
source: imp:mutant/transform.md
---

# Transform

`malefic-mutant tool` 中负责 payload 编码、shellcode 转换和二进制提取的工具集合。

---

## Encode — Payload 编码

对原始二进制数据进行编码转换，支持 12 种算法。用于降低熵值特征或适配特定传输场景。

### 支持的编码

| 编码 | 说明 |
|------|------|
| `xor` | 随机密钥 XOR |
| `aes` | AES-128-CBC |
| `aes2` | AES 变体 |
| `des` | DES-CBC |
| `chacha` | ChaCha20 |
| `rc4` | RC4 流密码 |
| `base64` | Base64 |
| `base45` | Base45 |
| `base58` | Base58 |
| `uuid` | UUID 格式编码 |
| `mac` | MAC 地址格式编码 |
| `ipv4` | IPv4 地址格式编码 |

### 用法

```bash
# 列出所有编码
malefic-mutant tool encode --list

# XOR 编码，输出二进制
malefic-mutant tool encode -i payload.bin -e xor -f bin -o encoded.bin
# 同时生成 .key 文件（密钥）

# AES 编码，输出 C 头文件
malefic-mutant tool encode -i payload.bin -e aes -f c -o encoded.h

# 输出为 Rust 源码
malefic-mutant tool encode -i payload.bin -e chacha -f rust

# 输出所有格式
malefic-mutant tool encode -i payload.bin -e rc4 -f all
```

**注意** ：多级编码链需要 **多次调用** ，每次一种编码：

```bash
# 第一级: XOR
malefic-mutant tool encode -i payload.bin -e xor -f bin -o stage1.bin
# 第二级: AES
malefic-mutant tool encode -i stage1.bin -e aes -f bin -o stage2.bin
# 第三级: Base64
malefic-mutant tool encode -i stage2.bin -e base64 -f bin -o final.bin
```

### 参数

| 参数 | 说明 |
|------|------|
| `-i, --input` | 输入文件 |
| `-e, --encoding` | 编码算法 |
| `-f, --format` | 输出格式: `bin` / `c` / `rust` / `all` |
| `-o, --output` | 输出路径 |
| `-l, --list` | 列出可用编码 |

---

## SRDI — 反射式 DLL 注入

将 PE DLL 转换为位置无关的 shellcode，支持 TLS 回调和自定义入口函数。

### 用法

```bash
# Malefic SRDI（支持 TLS 回调和自定义入口函数）
malefic-mutant tool srdi -i implant.dll -o implant.bin

# 指定入口函数
malefic-mutant tool srdi -i implant.dll -o implant.bin --function-name ReflectiveFunction

# 附带用户数据
malefic-mutant tool srdi -i implant.dll -o implant.bin --userdata-path config.bin
```

### 参数

| 参数 | 说明 |
|------|------|
| `-i, --input` | 源 DLL 文件 |
| `-o, --output` | 输出 shellcode 路径 |
| `-t, --type` | `malefic`（默认，支持 TLS） |
| `-a, --arch` | `x64` / `x86` |
| `--function-name` | 指定入口函数名 |
| `--userdata-path` | 用户数据文件 |

---

## ObjCopy — 二进制段提取

类似 GNU objcopy，提取 PE 文件的指定段为裸二进制。

```bash
# 提取为裸二进制
malefic-mutant tool objcopy -f binary -i input.exe -o output.bin
```

---

## Strip — 路径剥离

移除 PE 文件中嵌入的编译路径字符串，减少溯源特征。

```bash
# 基本用法
malefic-mutant tool strip -i malefic.exe -o stripped.exe

# 附加自定义路径模式
malefic-mutant tool strip -i malefic.exe -o stripped.exe \
    --custom-paths "/home/user,C:\\build"
```

---

## 组合工作流

```bash
# 1. 编译
malefic-mutant build malefic

# 2. 剥离路径
malefic-mutant tool strip -i malefic.exe -o stripped.exe

# 3. 转换为 SRDI shellcode
malefic-mutant tool srdi -i stripped.exe -o implant.bin

# 4. 编码
malefic-mutant tool encode -i implant.bin -e xor -f bin -o final.bin
```
