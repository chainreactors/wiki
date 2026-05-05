---
title: Win-Kit FFI
description: malefic-win-kit DLL 的跨语言 FFI 接口，提供多语言调用 Windows 攻击性功能的基础设施。
edition: community
generated: false
source: imp:develop/ffi.md
---

# Win-Kit FFI

malefic-win-kit DLL 的跨语言 FFI 接口，提供多语言调用 Windows 攻击性功能的基础设施。

## 概述

Malefic Win-Kit FFI 将复杂的底层 Windows 能力（进程注入、内存执行、反射加载等）封装为标准 C ABI 导出的 DLL API，允许任何支持 FFI 的语言直接调用这些功能。

**核心理念** ：一次实现，多处使用。专注于业务逻辑，底层操作由基础设施处理。

## 编译 DLL

```bash
# 完整功能 DLL
cargo build --release -p malefic-win-kit --features "ffi, default_apis"
```

编译产物：`target/release/malefic_win_kit.dll`

头文件：`examples/ffi/malefic-win-kit.h`

## API 参考

基于 `malefic-win-kit.h`，覆盖常见攻击性操作。

### PE Loading & Execution

| API | 描述 |
|-----|------|
| **RunPE** | 进程镂空注入，支持参数传递、PID 指定、DLL 阻止、输出捕获 |
| **InlinePE** | 在当前进程内执行 PE，支持 EXE/DLL、Magic/Signature 修改、超时控制 |
| **PELoader** | 底层 PE 加载器，手动映射 PE 到内存，支持签名修改 |
| **UnloadPE** | 卸载已加载的 PE 模块 |
| **RunSacrifice** | 创建牺牲进程并劫持命令行，支持 PPID 欺骗、DLL 阻止 |
| **HijackCommandLine** | 劫持当前进程命令行参数 |

### Reflective Loading

| API | 描述 |
|-----|------|
| **ReflectiveLoader** | 反射式 DLL 加载器，支持自定义导出函数、牺牲进程、PPID 欺骗 |
| **MaleficLoadLibrary** | 自定义 LoadLibrary 实现，支持从内存加载 DLL |

### Code Injection

| API | 描述 |
|-----|------|
| **ApcLoaderInline** | 内联 APC 注入（Early Bird），在当前进程执行 shellcode |
| **ApcLoaderSacriface** | 牺牲进程 APC 注入，创建新进程后通过 APC 执行 shellcode |
| **InjectRemoteThread** | 经典远程线程注入，向目标进程注入 shellcode |

### Advanced Execution

| API | 描述 |
|-----|------|
| **MaleficBofLoader** | Beacon Object File (BOF) 加载器，执行 Cobalt Strike BOF |
| **MaleficExecAssembleInMemory** | .NET Assembly 内存执行，无落地加载托管程序集 |
| **MaleficPwshExecCommand** | PowerShell 内存执行，通过 CLR 宿主执行 PowerShell 命令 |

### Utility Functions

| API | 描述 |
|-----|------|
| **MaleficGetFuncAddrWithModuleBaseDefault** | 获取模块基址中的函数地址（手动 GetProcAddress） |
| **SafeFreePipeData** | 安全释放 Rust 分配的内存（必须用此函数释放返回的 RawString） |

## RawString 结构体

返回字符串或二进制数据的 API 使用此结构体：

```c
typedef struct {
    uint8_t *data;      // 数据指针
    uintptr_t len;      // 数据长度
    uintptr_t capacity; // 容量（内部使用）
} RawString;
```

**重要** ：使用完 `RawString` 后，必须调用 `SafeFreePipeData(result.data)` 释放内存，否则会造成内存泄漏。

### 使用示例

```c
// 调用 API
RawString result = InlinePE(bin, bin_size, NULL, NULL,
    commandline, commandline_len,
    NULL, 0, false, true, 30000, 0);

// 使用数据
if (result.data != NULL && result.len > 0) {
    printf("Output: %.*s\n", (int)result.len, result.data);
}

// 释放内存（必须）
SafeFreePipeData(result.data);
```

## 调用流程

所有语言的调用流程一致，分为 5 步：

### Load DLL

动态加载 `malefic_win_kit.dll`：

```c
// C/C++
HMODULE hModule = LoadLibraryA("malefic_win_kit.dll");
```

### Resolve Functions

获取函数地址：

```c
// C/C++
typedef RawString (*RunPEFunc)(...);
RunPEFunc pRunPE = (RunPEFunc)GetProcAddress(hModule, "RunPE");
```

### Declare Signatures

根据 `malefic-win-kit.h` 声明函数签名：

```c
// 声明与头文件匹配的函数指针类型
typedef RawString (*InlinePEFunc)(
    const uint8_t *bin, uintptr_t bin_size,
    const uint16_t *magic, const uint32_t *signature,
    const uint8_t *commandline, uintptr_t commandline_len,
    const uint8_t *entrypoint, uintptr_t entrypoint_len,
    bool is_dll, bool is_need_output,
    uint32_t timeout, uint32_t delay
);
```

### Invoke

按标准 C 调用约定（cdecl）调用函数：

```c
RawString result = pInlinePE(bin, bin_size, NULL, NULL,
    cmd, cmd_len, NULL, 0, false, true, 30000, 0);
```

### Free Memory

使用 `SafeFreePipeData` 释放分配的内存：

```c
SafeFreePipeData(result.data);
```

## 多语言支持

任何支持 FFI 的语言都可以调用 malefic-win-kit API。以下是各语言的要点。

### C/C++

直接使用 `LoadLibrary` + `GetProcAddress`：

```c
#include <windows.h>
#include "malefic-win-kit.h"

int main() {
    HMODULE hDll = LoadLibraryA("malefic_win_kit.dll");
    if (!hDll) return 1;

    typedef RawString (*RunPEFunc)(...);
    RunPEFunc pRunPE = (RunPEFunc)GetProcAddress(hDll, "RunPE");

    // 调用...
    RawString result = pRunPE(...);

    // 释放
    typedef void (*FreeFunc)(const uint8_t*);
    FreeFunc pFree = (FreeFunc)GetProcAddress(hDll, "SafeFreePipeData");
    pFree(result.data);

    FreeLibrary(hDll);
    return 0;
}
```

示例代码：`examples/ffi/c/`

### Go

使用 `syscall.SyscallN` + `unsafe.Pointer`：

```go
package main

import (
    "syscall"
    "unsafe"
)

func main() {
    dll := syscall.MustLoadDLL("malefic_win_kit.dll")
    defer dll.Release()

    proc := dll.MustFindProc("RunPE")

    // 调用
    r1, _, _ := proc.Call(
        uintptr(unsafe.Pointer(&cmdline[0])),
        uintptr(len(cmdline)),
        // ...
    )

    // 解析 RawString
    type RawString struct {
        Data     uintptr
        Len      uintptr
        Capacity uintptr
    }
    result := (*RawString)(unsafe.Pointer(r1))

    // 释放
    freeProc := dll.MustFindProc("SafeFreePipeData")
    freeProc.Call(result.Data)
}
```

示例代码：`examples/ffi/go/`

### Rust

使用 `libloading` 或手动 `LoadLibraryA`：

```rust
use libloading::{Library, Symbol};
use std::ffi::CStr;

fn main() {
    unsafe {
        let lib = Library::new("malefic_win_kit.dll").unwrap();

        let run_pe: Symbol<unsafe extern "C" fn(...) -> RawString> =
            lib.get(b"RunPE").unwrap();

        let result = run_pe(...);

        // 使用结果
        let data = std::slice::from_raw_parts(result.data, result.len);
        println!("Output: {:?}", std::str::from_utf8(data));

        // 释放
        let free: Symbol<unsafe extern "C" fn(*const u8)> =
            lib.get(b"SafeFreePipeData").unwrap();
        free(result.data);
    }
}
```

示例代码：`examples/ffi/rust/`

### Python

使用 `ctypes` 封装：

```python
import ctypes
from ctypes import (
    Structure, POINTER, c_uint8, c_size_t,
    c_uint32, c_bool, c_void_p
)

class RawString(Structure):
    _fields_ = [
        ("data", POINTER(c_uint8)),
        ("len", c_size_t),
        ("capacity", c_size_t),
    ]

# 加载 DLL
dll = ctypes.CDLL("malefic_win_kit.dll")

# 声明函数签名
dll.RunPE.restype = RawString
dll.RunPE.argtypes = [
    POINTER(c_uint8), c_size_t,  # start_commandline
    POINTER(c_uint8), c_size_t,  # hijack_commandline
    POINTER(c_uint8), c_size_t,  # data
    POINTER(c_uint8), c_size_t,  # entrypoint
    POINTER(c_uint8), c_size_t,  # args
    c_bool,                       # is_x86
    c_uint32,                     # pid
    c_bool,                       # block_dll
    c_bool,                       # need_output
]

# 调用
result = dll.RunPE(...)

# 读取结果
if result.data and result.len > 0:
    output = bytes(result.data[:result.len])
    print(output.decode("utf-8", errors="replace"))

# 释放
dll.SafeFreePipeData(result.data)
```

示例代码：`examples/ffi/python/`

### C\#

使用 `DllImport` P/Invoke：

```csharp
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential)]
public struct RawString
{
    public IntPtr Data;
    public UIntPtr Len;
    public UIntPtr Capacity;
}

public static class MaleficWinKit
{
    [DllImport("malefic_win_kit.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern RawString RunPE(
        byte[] startCommandline, UIntPtr startCommandlineLen,
        byte[] hijackCommandline, UIntPtr hijackCommandlineLen,
        byte[] data, UIntPtr dataSize,
        byte[] entrypoint, UIntPtr entrypointLen,
        byte[] args, UIntPtr argsLen,
        bool isX86, uint pid,
        bool blockDll, bool needOutput
    );

    [DllImport("malefic_win_kit.dll", CallingConvention = CallingConvention.Cdecl)]
    public static extern void SafeFreePipeData(IntPtr data);
}

// 使用
var result = MaleficWinKit.RunPE(...);
if (result.Data != IntPtr.Zero)
{
    byte[] output = new byte[(int)result.Len];
    Marshal.Copy(result.Data, output, 0, output.Length);
    Console.WriteLine(System.Text.Encoding.UTF8.GetString(output));
    MaleficWinKit.SafeFreePipeData(result.Data);
}
```

示例代码：`examples/ffi/csharp/`

### 其他语言

以下语言也可以通过各自的 FFI 机制调用 malefic-win-kit：

| 语言 | FFI 机制 | 说明 |
|------|----------|------|
| **C++** | 与 C 相同的调用约定 | 直接使用 C 方式 |
| **Java** | JNA 或 JNI | 推荐使用 JNA |
| **Node.js** | node-ffi-napi | 适合脚本化工具 |
| **Ruby** | Fiddle 或 FFI gem | 标准库支持 |
| **Lua** | LuaJIT FFI | 高性能调用 |
| **Nim** | importc pragma | 原生 C 互操作 |
| **Zig** | @cImport | 直接导入 C 头文件 |
| **Delphi** | external 声明 | 传统 Windows 开发 |
| **Swift** | C interop | Apple 平台 |

## API 详细签名

完整的 C 函数签名（来自 `malefic-win-kit.h`）：

### RunPE

```c
RawString RunPE(
    const uint8_t *start_commandline,       // 启动命令行
    uintptr_t start_commandline_len,        // 命令行长度
    const uint8_t *hijack_commandline,      // 劫持命令行
    uintptr_t hijack_commandline_len,       // 劫持命令行长度
    const uint8_t *data,                    // PE 数据
    uintptr_t data_size,                    // PE 数据大小
    const uint8_t *entrypoint,              // 入口点名称
    uintptr_t entrypoint_len,              // 入口点名称长度
    const uint8_t *args,                    // 参数
    uintptr_t args_len,                     // 参数长度
    bool is_x86,                            // 是否为 x86
    uint32_t pid,                           // 目标 PID
    bool block_dll,                         // 是否阻止 DLL
    bool need_output                        // 是否需要输出
);
```

### InlinePE

```c
RawString InlinePE(
    const uint8_t *bin,                     // PE 二进制数据
    uintptr_t bin_size,                     // PE 大小
    const uint16_t *magic,                  // Magic 值（可为 NULL）
    const uint32_t *signature,              // Signature 值（可为 NULL）
    const uint8_t *commandline,             // 命令行参数
    uintptr_t commandline_len,             // 命令行长度
    const uint8_t *entrypoint,              // 入口点名称
    uintptr_t entrypoint_len,              // 入口点名称长度
    bool is_dll,                            // 是否为 DLL
    bool is_need_output,                    // 是否需要输出
    uint32_t timeout,                       // 超时（毫秒）
    uint32_t delay                          // 延迟（毫秒）
);
```

### ReflectiveLoader

```c
RawString ReflectiveLoader(
    const uint8_t *start_commandline,       // 启动命令行
    uintptr_t start_commandline_len,        // 命令行长度
    const uint8_t *reflective_loader_name,  // 反射加载函数名
    uintptr_t reflective_loader_name_len,   // 函数名长度
    const uint8_t *data,                    // DLL 数据
    uintptr_t data_len,                     // DLL 数据长度
    const uint8_t *param,                   // 参数
    uintptr_t param_len,                    // 参数长度
    uint32_t ppid,                          // 父进程 PID
    bool block_dll,                         // 是否阻止 DLL
    uint32_t timeout,                       // 超时（毫秒）
    bool is_need_output                     // 是否需要输出
);
```

### MaleficBofLoader

```c
RawString MaleficBofLoader(
    const uint8_t *buffer,                  // BOF 数据
    uintptr_t buffer_len,                   // BOF 数据长度
    const uint8_t *const *arguments,        // 参数数组
    uintptr_t arguments_size,               // 参数数量
    const uint8_t *entrypoint_name          // 入口点函数名
);
```

### MaleficExecAssembleInMemory

```c
RawString MaleficExecAssembleInMemory(
    const uint8_t *data,                    // Assembly 数据
    uintptr_t data_len,                     // Assembly 数据长度
    const uint8_t *const *arguments,        // 参数数组
    uintptr_t arguments_len                 // 参数数量
);
```

### MaleficPwshExecCommand

```c
RawString MaleficPwshExecCommand(
    const uint8_t *command,                 // PowerShell 命令
    uintptr_t command_len                   // 命令长度
);
```

### ApcLoaderInline

```c
RawString ApcLoaderInline(
    const uint8_t *bin,                     // Shellcode 数据
    uintptr_t bin_len,                      // Shellcode 长度
    bool need_output                        // 是否需要输出
);
```

### ApcLoaderSacriface

```c
RawString ApcLoaderSacriface(
    const uint8_t *bin,                     // Shellcode 数据
    uintptr_t bin_len,                      // Shellcode 长度
    int8_t *sacriface_commandline,          // 牺牲进程命令行
    uint32_t ppid,                          // 父进程 PID
    bool block_dll,                         // 是否阻止 DLL
    bool need_output                        // 是否需要输出
);
```

### InjectRemoteThread

```c
RawString InjectRemoteThread(
    const uint8_t *bin,                     // Shellcode 数据
    uintptr_t bin_len,                      // Shellcode 长度
    uint32_t pid                            // 目标进程 PID
);
```

## 注意事项

### 内存管理

1. **必须释放** ：所有返回 `RawString` 的 API，使用完毕后必须调用 `SafeFreePipeData(result.data)` 释放内存
2. **不要重复释放** ：每个 `RawString` 只能释放一次
3. **不要使用标准 free** ：数据由 Rust 分配，必须使用 `SafeFreePipeData` 释放

### 线程安全

- 大多数 API 不是线程安全的，不建议在多线程中并发调用同一函数
- 如需并发，为每个线程加载独立的 DLL 实例

### 错误处理

- 调用失败时 `RawString.data` 为 NULL，`RawString.len` 为 0
- 调用前检查返回值，避免访问空指针

### 架构匹配

- 调用方和 DLL 必须架构一致（同为 x86 或 x64）
- 32 位程序不能加载 64 位 DLL，反之亦然

## 示例代码位置

完整的多语言示例代码位于 `examples/ffi/` 目录：

| 语言 | 目录 | 示例文件 |
|------|------|----------|
| C | `examples/ffi/c/` | `runpe_test.c` |
| Go | `examples/ffi/go/` | `runpe_example.go` |
| Rust | `examples/ffi/rust/` | `runpe_example.rs` |
| Python | `examples/ffi/python/` | `runpe_test.py` |
| C# | `examples/ffi/csharp/` | `RunPETest.cs` |

## 相关文档

- [Win-Kit 文档](/malefic/getting-started/components/win-kit/) - Win-Kit 功能与 Feature 介绍
- [编译手册](/malefic/getting-started/) - 完整的编译流程
- [Modules 文档](/malefic/develop/modules/) - 可用的模块列表
