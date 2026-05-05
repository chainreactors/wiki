---
title: SigForge — PE 签名操作
description: malefic-mutant tool sigforge 对 PE 文件的数字签名进行操作：提取、复制、注入、移除和伪造。
edition: community
generated: false
source: imp:mutant/sigforge.md
---

# SigForge

`malefic-mutant tool sigforge` 对 PE 文件的数字签名进行操作：提取、复制、注入、移除和伪造。

## 用法

```bash
malefic-mutant tool sigforge <SUBCOMMAND> [OPTIONS]
```

## 子命令

### Extract — 提取签名

从已签名的 PE 文件中提取原始签名数据。

```bash
malefic-mutant tool sigforge extract -i signed.exe -o sig.bin
```

### Copy — 复制签名

将签名从已签名 PE 复制到目标 PE。

```bash
malefic-mutant tool sigforge copy -s signed.exe -t target.exe -o output.exe
```

### Inject — 注入签名

将之前提取的签名文件注入目标 PE。

```bash
malefic-mutant tool sigforge inject -s sig.bin -t target.exe -o output.exe
```

### Remove — 移除签名

清除 PE 文件中的签名数据。

```bash
malefic-mutant tool sigforge remove -i signed.exe -o unsigned.exe
```

### Check — 检查嵌入证书表

检查 PE 文件结构中是否包含嵌入的 Authenticode certificate table。

```bash
malefic-mutant tool sigforge check -i target.exe
# 输出: File target.exe has an embedded Authenticode certificate table
```

`check` 是结构检查，不验证摘要匹配、证书链、时间戳或 Windows 信任策略。

### Carbon-Copy — 克隆 TLS 证书

从远程主机克隆 TLS 证书并注入 PE 文件，实现"签名伪造"。

```bash
# 从远程主机克隆
malefic-mutant tool sigforge carbon-copy --host www.microsoft.com -t target.exe -o output.exe

# 从本地证书文件
malefic-mutant tool sigforge carbon-copy --cert-file cert.der -t target.exe -o output.exe
```

---

## 组合工作流

```bash
# 完整签名伪造流程
# 1. 从合法 PE 提取签名
malefic-mutant tool sigforge extract -i legitimate.exe -o sig.bin

# 2. 注入到目标 PE
malefic-mutant tool sigforge inject -s sig.bin -t malefic.exe -o signed.exe

# 3. 验证
malefic-mutant tool sigforge check -i signed.exe

# 或使用 carbon-copy（更隐蔽）
malefic-mutant tool sigforge carbon-copy --host www.microsoft.com \
    -t malefic.exe -o final.exe
```
