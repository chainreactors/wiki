---
date:
  created: 2025-11-10
slug: IoM_v0.1.2
---

## 前言

离上次更新又过去了四个月。 IoM 在快速演进中。 我们再一次对implant 到 server的全方面调整。 

我们近期的工作主要在 AI、三语言SDK、saas使用体验用户、以及GUI相关（gui不在本次更新中发布），以及大量的用户体验改进与bug修复。 

## Integrate
### FFI integrated --- 任意语言的implant

为了让IoM的能力能够被更多语言和场景使用，我们将Windows端的核心攻击能力封装为[Malefic-Win-Kit](../manual/implant/win_kit.md) DLL。通过标准C ABI接口，支持PE执行、反射加载、代码注入、BOF、EDR绕过等功能的多语言调用。这使得安全研究人员可以使用Python、Go、C#等熟悉的语言快速构建自定义工具，而无需深入Rust底层实现。

```python
# Python调用示例 - 在牺牲进程中执行PE
import ctypes
dll = ctypes.CDLL("malefic_win_kit.dll")
result = dll.RunPE("C:\\Windows\\System32\\notepad.exe", pe_data, len(pe_data), b"--help", 0, True, False)
```

支持语言: C, Go, Rust, Python, C#

**相关文档:**
- [FFI集成指南](../manual/integrate/ffi.md) - 多语言调用方式与API说明
- [Win-Kit完整文档](../manual/implant/win_kit.md) - 所有可用功能与参数详解

### MCP --- 与AI集成


通过[Model Context Protocol](../manual/integrate/ai.md)集成，IoM支持AI代理直接操作的C2框架。AI可以通过自然语言理解渗透测试需求，自动调用IoM的所有客户端功能，实现智能化的渗透测试和自动化响应。支持Claude Desktop等MCP客户端，只需简单配置即可让AI成为你的渗透测试助手。

```bash
# 启动MCP服务器
./client --mcp 127.0.0.1:4999
```

![MCP配置](/IoM/assets/Pasted image 20251102194506.png)

![MCP集成示例](/IoM/assets/Pasted image 20251102194513.png)

![MCP操作演示](/IoM/assets/Pasted image 20251102190801.png)

![MCP自动化响应](/IoM/assets/Pasted image 20251102190816.png)

**相关文档:**
- [AI集成完整指南](../manual/integrate/ai.md) - MCP服务器配置、客户端对接与使用场景

### SDK ---  client的多语言SDK

为了让IoM能够被更广泛的场景集成，我们提供了[三语言SDK](../manual/integrate/sdk/index.md)（Python/Go/TypeScript），将一百多个gRPC方法封装为符合各语言习惯的原生API。[Python SDK](../manual/integrate/sdk/python.md)提供完整的async/await支持和类型提示，适合自动化脚本和AI集成；[Go SDK](https://github.com/chainreactors/IoM-go)提供事件钩子和任务回调机制，适合构建高性能工具；[TypeScript SDK](https://github.com/chainreactors/IoM-typescript)为VSCode扩展和Web UI提供类型安全的客户端。

### 3rd module --- module开发模板

为了保持implant主体的最小化依赖和灵活性，我们将所有需要第三方依赖的功能模块独立为3rd module。本次更新提供了[第三方模块开发模板](https://github.com/chainreactors/malefic-3rd-template)，支持通过Cargo features选择性构建和动态加载。开发者可以基于模板快速开发自定义模块，编译为DLL后通过`load_module`命令热加载到implant中，无需重新编译主体。这种设计既保证了implant的轻量化，又提供了无限的扩展可能。

**相关文档:**
- [3rd模块开发模板](https://github.com/chainreactors/malefic-3rd-template) - 模块开发框架、示例代码与构建指南
- [内置3rd模块集合](https://github.com/chainreactors/malefic/tree/master/malefic-3rd) - Community版本公开的3rd模块源码  

## Changelog


### Client/Server

### 用户体验优化
https://github.com/chainreactors/malice-network/issues/45

每个版本都能接收到使用过于繁琐复杂的反馈。我们在每个版本都尽力简化使用流程与用户体验。





#### 自动化编译优化

todo

#### 插件优化

https://github.com/chainreactors/malice-network/issues/65


### 文档重构
### Implant
#### mutant 大量新功能

malefic-mutant新增SRDI转换、签名伪造、二进制剥离、格式转换、运行时补丁等功能，成为功能完整的二进制处理工具链。

```bash
# SRDI转换 - PE转shellcode
malefic-mutant tool srdi -i malefic.exe -o malefic.bin

# 签名伪造 - 复制合法签名
malefic-mutant tool sigforge copy -s legitimate.exe -t malefic.exe -o malefic_signed.exe

# 二进制剥离 - 移除路径信息
malefic-mutant tool strip -i malefic.exe -o malefic_stripped.exe
```

参考: [Mutant文档](../manual/mutant/malefic_mutant.md) | [构建文档](../manual/implant/build.md)

#### malefic profiles


#### Sleep与DGA

支持Cron表达式的灵活Sleep配置和基于种子的DGA域名生成算法，实现动态回连间隔和自动域名轮换。

```yaml
# Sleep配置 - Cron表达式
cron: "*/5 * * * * * *"  # 每5秒回连一次
jitter: 0.2              # 20%随机偏移

# DGA配置 - 域名生成算法
dga:
  enable: true
  key: "malefic_dga_2024"      # DGA种子密钥
  interval_hours: 8             # 域名轮换间隔
```

```lua
-- 运行时修改Sleep间隔
sleep(active(), 10)  -- 设置为10秒
```

参考: [构建文档](../manual/implant/build.md#sleep配置) | [Beacon文档](../manual/mal/beacon.md)

#### Guardrail

环境感知的执行保护机制，通过IP地址、用户名、主机名、域名等条件确保implant仅在预期环境中执行。

```yaml
guardrail:
  enable: true
  require_all: true  # AND模式：所有条件必须满足
  ip_addresses: ["192.168.*.*", "10.0.*.*"]
  usernames: ["*admin*", "root*"]
  server_names: ["*server*", "workstation*"]
  domains: ["pentest*", "*.local"]
```

```yaml
# 示例：限制在特定内网执行
guardrail:
  enable: true
  require_all: true
  ip_addresses:
    - "192.168.10.*"
    - "192.168.20.*"
```

参考: [Guardrail文档](../guideline/advance/Guardrail.md)

#### Pty

（待补充文档）


## End

v0.1.2 是一个承前启后的版本， 这个版本之后， 我们将全力投入到 v0.2.0 中， 将IoM的各项能力全面的对外暴露， 使得更接近于进攻性基础设施， 可以被任意项目任意场景集成， 并且进一步优化与AI的互操作性。 我们希望IoM的定位可以变成 **AI时代的进攻性基础设施**。

在v0.2.0 的路线图中， 我们可以快速使用 IoM提供的各种组件基于AI coding 快速在1小时内编写全新的implant；可以基于AI几分钟内编写新的功能性插件； 可以直接被AI操作用来进行自动化后渗透。并且wm