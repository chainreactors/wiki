---
title: Pulse
description: Pulse 是 IoM 的轻量级 Shellcode Stager，负责从服务器下载并执行主要的 Beacon 载荷。
edition: community
generated: false
source: imp:getting-started/components/pulse.md
---

# Pulse

Pulse 是 IoM 的轻量级 Shellcode Stager，负责从服务器下载并执行主要的 Beacon 载荷。

## 概述

Pulse 是一个最小化的 shellcode 模板，对应 Cobalt Strike 的 artifact，能编译出只有约 4KB 的上线马。其核心特性：

- **极小体积** ：编译后约 4KB，适合各种 loader 加载
- **位置无关** ：生成的 shellcode 完全位置无关（position-independent）
- **多输出格式** ：支持 `staticlib`、`cdylib` 和 `rlib` 输出
- **协议支持** ：支持 TCP、HTTP 和 HTTPS 拉取 beacon
- **API 可选** ：HTTP/HTTPS 可选择 raw socket、WinHTTP 或 WinInet 实现
- **加密传输** ：支持 XOR/AES 等加密方式

## 工作原理

Pulse 作为第一阶段 stager，其工作流程如下：

1. **初始化连接** ：根据配置连接到 C2 服务器
2. **请求载荷** ：发送带有 `artifact_id` 的请求
3. **接收数据** ：下载加密的 beacon 载荷
4. **解密执行** ：使用配置的密钥解密并执行 beacon

## 配置说明

Pulse 的配置位于 `implant.yaml` 文件的 `pulse` 模块：

```yaml
pulse:
  flags:
    start: 0x41             # 交互 body 的开始标志
    end: 0x42               # 交互 body 的结束标志
    magic: "beautiful"      # 随机校验字符串
    artifact_id: 0          # 用于控制所拉取的阶段
  encryption: xor           # body 加密方式 (xor/aes)
  key: "maliceofinternal"   # 加密密钥
  target: 127.0.0.1:80      # 目标服务器地址
  protocol: "http"          # 通信协议 (tcp/http/https)
  api_type: "raw"           # HTTP API 类型 (raw/winhttp/wininet)
  http:                     # HTTP(S) 协议配置
    method: "POST"
    path: "/pulse"
    host: "127.0.0.1"
    version: "1.1"
    headers:
      User-Agent: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0"
```

### 配置字段说明

#### flags 部分

- **start/end** : 数据包边界标记字节，用于定位有效载荷
- **magic** : 魔术字符串，用于验证数据包完整性
- **artifact_id** : 构建产物标识，服务器根据此 ID 返回对应的 beacon

#### 加密配置

- **encryption** : 加密算法，可选 `xor`（轻量）或 `aes`（安全）
- **key** : 加密密钥，需与服务器端配置一致

#### 网络配置

- **target** : C2 服务器地址，格式为 `IP:端口`
- **protocol** : 通信协议
  - `http`: 使用 HTTP 协议（更隐蔽）
  - `https`: 使用 HTTPS 协议（仅支持 WinHTTP/WinInet）
  - `tcp`: 使用原始 TCP 连接（更快速）
- **api_type** : HTTP API 类型
  - `raw`: 原始 socket 手动拼 HTTP 包，默认值
  - `winhttp`: 使用 `winhttp.dll` 宽字符 API
  - `wininet`: 使用 `wininet.dll` ANSI API

#### HTTP 配置

当 `protocol` 为 `http` 或 `https` 时，需配置以下字段：

- **method** : HTTP 方法（通常为 `POST`）
- **path** : 请求路径
- **host** : Host 头字段
- **version** : HTTP 版本（"1.1" 或 "2.0"）
- **headers** : 自定义 HTTP 头，建议配置真实的 User-Agent

### 协议与 API 路由

`generate pulse` 会根据 `protocol` 和 `api_type` 选择生成器：

| protocol | api_type | 实现 | TLS |
|----------|----------|------|-----|
| `tcp` | 任意值 | raw socket (`ws2_32`) | 否 |
| `http` | 空 / `raw` | raw socket + HTTP 手动拼包 | 否 |
| `http` | `winhttp` | WinHTTP | 否 |
| `http` | `wininet` | WinInet | 否 |
| `https` | `winhttp` | WinHTTP + secure flag | 是 |
| `https` | `wininet` | WinInet + secure flag | 是 |
| `https` | `raw` | 不支持 | - |

HTTPS 模式会预设证书忽略 flag，用于兼容自签名证书。WinInet 需要额外忽略吊销检查；WinHTTP 默认不检查吊销。

### Magic 校验

Pulse 与 server 使用同一套 DJB2 magic hash：初始值为 `5381`，每个字节执行 `hash = hash * 33 + byte`。这保证 stager 和 server 对 `flags.magic` 的校验结果一致，避免握手阶段出现 `read invalid magic`。

## 编译流程

### 生成配置

使用 `malefic-mutant` 生成 pulse 配置：

```bash
malefic-mutant generate pulse
```

此命令会根据 `implant.yaml` 中的 `pulse` 配置生成必要的代码。

### 编译 Pulse

指定目标平台编译：

```bash
# Windows x64
malefic-mutant build pulse -c implant.yaml -t x86_64-pc-windows-gnu

# Windows x86
malefic-mutant build pulse -c implant.yaml -t i686-pc-windows-gnu
```

编译产物位于 `target/<target_triple>/release/malefic-pulse.exe`。

### 转换为 Shellcode

使用 `--shellcode` 直接输出 shellcode：

```bash
malefic-mutant build pulse --shellcode -c implant.yaml -t x86_64-pc-windows-gnu
```

生成的 `.bin` 文件即为可用的 shellcode。

当前 shellcode 构建流程会启用 `shellcode` feature，先构建 `malefic-pulse` 的 PE executable，再由 `PEObjCopy::extract_binary` 提取 PE 中的可执行 section：

```text
cargo build --release --target <target> -p malefic-pulse --bin malefic-pulse --features shellcode
  -> target/<target>/release/malefic-pulse.exe
  -> PEObjCopy::extract_binary
  -> target/<target>/release/malefic-pulse.bin
```

### 使用 Docker 编译

推荐使用 Docker 进行交叉编译：

```bash
docker run -v "$(pwd):/root/src" --rm -it ghcr.io/chainreactors/malefic-builder:latest sh -c "malefic-mutant generate pulse && cargo build -p malefic-pulse --target x86_64-pc-windows-gnu"
```

### 使用 GitHub Action 编译

```bash
gh workflow run generate.yaml \
  -f package="pulse" \
  -f malefic_config_yaml=$(base64 -w 0 <implant.yaml) \
  -f remark="pulse stager" \
  -f targets="x86_64-pc-windows-gnu" \
  -R <username/malefic>
```

## 与 malefic-srdi 的配合

Pulse 可以与 `malefic-srdi` 配合使用，实现 PE → Shellcode 的转换：

```bash
# 1. 编译 pulse.exe
malefic-mutant build pulse -c implant.yaml -t x86_64-pc-windows-gnu

# 2. 使用 SRDI 转换
malefic-mutant tool srdi -i pulse.exe -o pulse.bin

# 或使用 objcopy
objcopy -O binary pulse.exe pulse.bin
```

## 使用场景

Pulse 适用于以下场景：

1. **分阶段上线** ：先投递小体积的 pulse，再拉取完整 beacon
2. **Loader 集成** ：作为各种 loader 的载荷（体积小，特征少）
3. **内存执行** ：配合 shellcode 执行技术，完全无文件落地
4. **快速迭代** ：修改 beacon 无需重新投递 stager

## 输出格式

Pulse 支持以下输出格式（在 `Cargo.toml` 中定义）：

- **staticlib** ：静态库，可链接到其他程序
- **cdylib** ：动态库，可作为 DLL 使用
- **rlib** ：Rust library target，用于 `--lib` 编译

## 安全建议

1. **修改默认配置** ：务必修改 `magic`、`key` 等默认值
2. **使用 HTTPS** ：生产环境建议使用 TLS 加密传输
3. **定期轮换** ：定期更换 `artifact_id` 和加密密钥
4. **混淆处理** ：对生成的 shellcode 进行编码或加密

## 相关文档

- [Pulse 构建](/malefic/build/pulse/) - generate/build 与 shellcode 输出
- [Mutant 工具](/malefic/getting-started/components/mutant/) - generate/build 与 implant.yaml
- Starship 文档 (Pro) - Shellcode 加载框架
