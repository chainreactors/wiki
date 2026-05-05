---
title: Obfuscate — 源码级混淆
description: malefic-mutant tool obf 对 Rust 源码进行自动化混淆，注入 malefic-obfuscate 宏并支持变量重命名。
edition: community
generated: false
source: imp:mutant/obfuscate.md
---

# Obfuscate

`malefic-mutant tool obf` 对 Rust 源码进行自动化混淆，注入 `malefic-obfuscate` 宏并支持变量重命名。

## 用法

```bash
malefic-mutant tool obf -i <INPUT> -o <OUTPUT> [OPTIONS]
```

## 基本用法

```bash
# 混淆目录下所有 Rust 文件
malefic-mutant tool obf -i src/ -o obfuscated/

# 混淆单个文件
malefic-mutant tool obf -i src/main.rs -o out/

# 仅混淆字符串，跳过整数和控制流
malefic-mutant tool obf -i src/ -o out/ --no-integers --no-flow

# 启用变量重命名，密度 5
malefic-mutant tool obf -i src/ -o out/ --rename -d 5

# 50% 字符串加密率
malefic-mutant tool obf -i src/ -o out/ -p 50
```

## 混淆能力

| 功能 | 宏/属性 | 说明 |
|------|---------|------|
| 字符串加密 | `obfstr!("text")` | 编译期 AES 加密字符串字面量 |
| 整数混淆 | `obf_int!(42)` | 混淆整数字面量 |
| 控制流混淆 | `#[junk]` | 注入垃圾代码 |
| 变量重命名 | `--rename` | 局部变量与函数随机命名 |

## 参数

| 参数 | 说明 |
|------|------|
| `-i, --input` | 输入文件或目录 |
| `-o, --output` | 输出目录（默认: `obfuscated_code`） |
| `--no-strings` | 禁用字符串混淆 |
| `--no-integers` | 禁用整数混淆 |
| `--no-flow` | 禁用控制流混淆 |
| `--rename` | 启用变量重命名 |
| `-p, --percentage` | 字符串加密率 0-100（默认 100） |
| `-d, --density` | 垃圾代码密度 1-8（默认 3） |
