---
title: PE Modify — PE 文件修改工具集
description: malefic-mutant tool 中用于修改 PE 文件结构和元数据的工具集合。
edition: community
generated: false
source: imp:mutant/pe-modify.md
---

# PE Modify

`malefic-mutant tool` 中用于修改 PE 文件结构和元数据的工具集合。

---

## Patch — 运行时配置热补丁

详见独立文档 [Patch](/malefic/mutant/patch/)。`tool patch` 通过 prefix+seed 头部结构性定位 binary 内的 RuntimeConfig blob，用 AES-256-CTR 重写 payload。来源是 `--from-implant` / `--config`，可叠加 `--set` 做 JSON 合并覆盖；不再有 `--name` / `--key` / `--server-address` / `--blob` / `--patch-mode` 这些旧参数。

```bash
malefic-mutant tool patch -i malefic.exe --from-implant implant.yaml
```

---

## Watermark — PE 水印

> **Professional only** — 需要编译时启用 `professional` feature。

在 PE 文件中嵌入/读取隐蔽标识，用于追踪或归属。

### 写入水印

```bash
# DOS stub 区域（最隐蔽）
malefic-mutant tool watermark write -i target.exe -o marked.exe \
    -m dosstub -w "TEAM-001"

# Checksum 字段
malefic-mutant tool watermark write -i target.exe -o marked.exe \
    -m checksum -w "ID42"
```

### 读取水印

```bash
# 从 dosstub 读取（-s 指定大小）
malefic-mutant tool watermark read -i marked.exe -m dosstub -s 8

# 从 checksum 读取
malefic-mutant tool watermark read -i marked.exe -m checksum
```

### 方法

| 方法 | 位置 | 容量 | 持久性 |
|------|------|------|--------|
| `dosstub` | DOS Header 与 PE signature 之间 | ~64-192 bytes | 高（PE loader 忽略） |
| `checksum` | PE Optional Header Checksum 字段 | 4 bytes | 中（relink 会重算） |
| `section` | 自定义 section | 自定义 | 高 |
| `overlay` | PE 文件尾部 | 自定义 | 高 |

---

## Binder — PE 捆绑

将两个 PE 文件绑定在一起，主 PE 运行时自动提取并执行次 PE。

```bash
# 绑定：carrier.exe 作为主程序，payload.exe 嵌入其中
malefic-mutant tool binder bind -p carrier.exe -s payload.exe -o bound.exe

# 检查是否包含嵌入内容
malefic-mutant tool binder check -i bound.exe

# 提取嵌入的 payload
malefic-mutant tool binder extract -i bound.exe -o extracted.exe
```

**注意** ：secondary file 必须是有效的 PE 文件（有 MZ header）。

---

## Icon — 图标操作

替换或提取 PE 文件中的图标资源。

```bash
# 替换图标
malefic-mutant tool icon replace -i target.exe --ico new_icon.ico -o output.exe

# 提取图标
malefic-mutant tool icon extract -i target.exe -o extracted.ico
```

**注意** ：目标 PE 必须包含 `.rsrc` section（有图标资源）。

---

## Entropy — 熵值管理

测量和降低 PE 文件的 Shannon 熵，减少被标记为高熵（加密/压缩）文件的概率。

```bash
# 测量熵值
malefic-mutant tool entropy -i malefic.exe --measure-only

# 降低熵值到 < 6.0
malefic-mutant tool entropy -i malefic.exe -o reduced.exe -t 6.0

# 指定策略
malefic-mutant tool entropy -i malefic.exe -o reduced.exe -t 6.0 -s null_bytes
```

### 策略

| 策略 | 说明 |
|------|------|
| `null_bytes` | 追加空字节 |
| `pokemon` | 嵌入 Pokemon 名称字符串 |
| `random_words` | 嵌入随机英文单词 |

### 参数

| 参数 | 说明 |
|------|------|
| `-i, --input` | 输入 PE |
| `-o, --output` | 输出路径 |
| `-t, --threshold` | 目标熵值阈值（默认 6.0） |
| `-s, --strategy` | 降低策略 |
| `--measure-only` | 只测量，不修改 |

---

## 组合工作流

```bash
# 1. 写入水印
malefic-mutant tool watermark write -i malefic.exe -o marked.exe \
    -m dosstub -w "OP-001"

# 2. 降低熵值
malefic-mutant tool entropy -i marked.exe -o low_entropy.exe -t 6.0

# 3. 替换图标（伪装）
malefic-mutant tool icon replace -i low_entropy.exe --ico app.ico -o final.exe
```
