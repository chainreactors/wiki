---
date:
  created: 2025-11-10
slug: IoM_v0.1.2
---

## 前言

离上次更新又过去了四个月。 IoM 在快速演进中。 我们再一次对implant 到 server的全方面优化。 

我们近期的工作主要在 AI、三语言SDK、saas使用体验优化、以及web GUI相关（gui不在本次更新中发布，预计11月底发布新的vscode插件/webui），以及大量的用户体验改进与bug修复。

v0.1.2 提供了各种层面的互操作能力， 包括

- 通过MCP实现的AI操作client
- 基于FFI实现跨语言implant
- 通过golang/typescript/python SDK实现的grpc client 调用teamserver上的rpc
- 通过implant module template实现基于rust编写module并且动态加载

目前的IoM的组件越来越复杂， 我们提供了一个统一的导航项目方便找到IoM的各种组件。  https://github.com/chainreactors/project-IoM

这将是未来IoM最大的优势，允许被继承到任意的组件中， 也允许任意集成三方组件。我们计划成为开放的基础设施， 更希望与AI深度绑定。  


## Integrate

### MCP --- 与AI集成


通过[Model Context Protocol](/IoM/manual/integrate/ai.md)集成，IoM支持AI代理直接操作的C2框架。AI可以通过自然语言理解渗透测试需求，自动调用IoM的所有客户端功能，实现智能化的渗透测试和自动化响应。支持Claude Desktop等MCP客户端，只需简单配置即可让AI成为你的渗透测试助手。

```bash
# 启动MCP服务器
./client --mcp 127.0.0.1:4999
```

![MCP配置](/IoM/assets/Pasted image 20251102194506.png)

![MCP集成示例](/IoM/assets/Pasted image 20251102194513.png)

**相关文档:**
- [AI集成完整指南](/IoM/manual/integrate/ai.md) - MCP服务器配置、客户端对接与使用场景

### FFI integrated --- 任意语言的implant

为了让IoM的能力能够被更多语言和场景使用，我们将Windows端的核心攻击能力封装为[Malefic-Win-Kit](/IoM/manual/implant/win_kit.md) DLL。通过标准C ABI接口，支持PE执行、反射加载、代码注入、BOF、EDR绕过等功能的多语言调用。这使得安全研究人员可以使用Python、Go、C#等熟悉的语言快速构建自定义工具，而无需深入Rust底层实现。

```python
# Python调用示例 - 在牺牲进程中执行PE
import ctypes
dll = ctypes.CDLL("malefic_win_kit.dll")
result = dll.RunPE("C:\\Windows\\System32\\notepad.exe", pe_data, len(pe_data), b"--help", 0, True, False)
```

支持语言: C, Go, Rust, Python, C#

**相关文档:**
- [FFI集成指南](/IoM/manual/integrate/ffi.md) - 多语言调用方式与API说明
- [Win-Kit完整文档](/IoM/manual/implant/win_kit.md) - 所有可用功能与参数详解


### SDK ---  client的多语言SDK

为了让IoM能够被更广泛的场景集成，我们提供了[三语言SDK](/IoM/manual/integrate/sdk/index.md)（Python/Go/TypeScript），将数百个gRPC方法封装为符合各语言习惯的原生API。

- [Go SDK](https://github.com/chainreactors/IoM-go)提供事件钩子和任务回调机制，适合构建高性能工具；从malice-network的client中剥离出来的， 相对使用时间最长， bug相对较少的SDK
- [Python SDK](/IoM/manual/integrate/sdk/python.md) （Unstable） 提供完整的async/await支持和类型提示，适合自动化脚本和AI集成；
- [TypeScript SDK](https://github.com/chainreactors/IoM-typescript) （Unstable）为VSCode扩展和Web UI提供类型安全的客户端，正在快速迭代中

我们计划在v0.2.0 之前三语言的SDK达到可用状态， 并且每个SDK都会有一些落地常见。 例如webui， cli， IoM agent等。

### 3rd module --- module开发模板

为了保持implant主体的最小化依赖和灵活性，我们将所有需要第三方依赖的功能模块独立为3rd module。本次更新提供了[第三方模块开发模板](https://github.com/chainreactors/malefic-3rd-template)，支持通过Cargo features选择性构建和动态加载。开发者可以基于模板快速开发自定义模块，编译为DLL后通过`load_module`命令热加载到implant中，无需重新编译主体。这种设计既保证了implant的轻量化，又提供了无限的扩展可能。

在3rdmodule中， 我们没有束缚， 不需要考虑依赖， 可以放心大胆的引入各种rust库， 实现各种各样的功能。 在AI coding的加持下，我们可以复用rust丰富的 offensive infra的生态。 

**相关文档:**
- [3rd模块开发模板](https://github.com/chainreactors/malefic-3rd-template) - 模块开发框架、示例代码与构建指南
- [内置3rd模块集合](https://github.com/chainreactors/malefic/tree/master/malefic-3rd) - Community版本公开的3rd模块源码  

## Changelog

大量新功能、用户体验优化、bug修复。 

### Client/Server

### 用户体验优化
https://github.com/chainreactors/malice-network/issues/45

每个版本都能接收到使用过于繁琐复杂的反馈。我们在每个版本都尽力简化使用流程与用户体验。后续我们将会在每个版本提交一个跟踪用户体验的issue。 在issue中的所有反馈我们都会在下一个版本之前修复。 

新版本的用户体验反馈随时在 https://github.com/chainreactors/malice-network/issues/72 中提供， 我们会快速跟进并修复， 最快可以在当天的 nightly版本中体验到。 


#### 插件优化

v0.1.1 中，我们通过community插件进一步简化了各种常用功能的使用流程， 不再需要手动安装各种插件包， 去解决github api的各种错误。 v0.1.2 进一步优化了 community 插件包的能力

https://github.com/chainreactors/malice-network/issues/65

![](Pasted%20image%2020251112014614.png)

### 文档重构

在v0.1.1 发布之后， 我们收到了极其大量的反馈， 都是文档难以理解。 我们通过内部的交叉review和重构， 重新组织了文档的逻辑。 虽然文档还是不够丰富与全面， 但是我们只能说尽力去改造文档。 

当前我们对文档有一个标准， **必须要让AI能够理解我们的表达的意思** 。 如果任何AI理解出现偏差的情况， 随时在issue中反馈。 

当前的文档逻辑， 对于入门的使用者， 只需要关注:

1.  https://wiki.chainreactors.red/IoM/quickstart/ 快速开始
2. https://wiki.chainreactors.red/IoM/concept/ 基本概念，尽可能深入浅出
3. https://wiki.chainreactors.red/IoM/guideline/ 引导文档， 可以根据当前的操作步骤按需选择


进阶的使用者可以关注:

1. https://wiki.chainreactors.red/IoM/design/  设计文档
2. https://wiki.chainreactors.red/IoM/manual/ 详细使用手册
3. https://wiki.chainreactors.red/IoM/guideline/develop/  二次开发文档
4. https://wiki.chainreactors.red/IoM/manual/integrate/  各种场景的集成与开发文档
5. https://wiki.chainreactors.red/IoM/manual/mal/ 插件进阶文档

### Implant
#### mutant 大量新功能

malefic-mutant新增SRDI转换、签名伪造、二进制剥离、格式转换、运行时补丁等功能，成为功能完整的二进制处理工具链。我们的mutant越来越接近msfvenom。

```bash
# SRDI转换 - PE转shellcode
malefic-mutant tool srdi -i malefic.exe -o malefic.bin

# 签名伪造 - 复制合法签名
malefic-mutant tool sigforge copy -s legitimate.exe -t malefic.exe -o malefic_signed.exe

# 二进制剥离 - 移除路径信息
malefic-mutant tool strip -i malefic.exe -o malefic_stripped.exe
```

参考: [Mutant文档](/IoM/manual/mutant/malefic_mutant.md) | [构建文档](/IoM/manual/implant/build.md)

#### malefic profiles

由于malefic支持的功能越来越复杂，如多种协议的支持，prelude的前置支持...

这里是一个很好的例子 ， 我们可以通过这个例子看到profile的使用。 

https://github.com/chainreactors/IoM-profiles/tree/master/prelude-persist

```
build prelude --autorun /path/2/IoM-profiles/prelude-persist.zip --target x86_64-pc-windows-gnu
```

![img.png](/IoM/assets/usage/build/prelude-persist-build.png)

我们把一些常见场景的配置文件公开到了 [IoM-profiles](https://github.com/chainreactors/IoM-profiles) 中作为参考。

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

参考: [构建文档](/IoM/manual/implant/build.md#sleep配置) | [Beacon文档](/IoM/manual/mal/beacon.md)

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

参考: [Guardrail文档](/IoM/guideline/advance/Guardrail.md)

#### Pty

我们在implant上实现了pty module。 现在可以实现交互式shell通过pty实现, 对应的指令为`interactive`.

**需要注意， 目前winpty仅支持windows 10 之后的版本， 并且可能存在不少bug。**

![img.png](/IoM/assets/usage/implant/interactive-shell.png)


## End

v0.1.2 是一个承前启后的版本， 这个版本之后， 我们将全力投入到 v0.2.0 中， 将IoM的各项能力全面的对外暴露， 使得更接近于进攻性基础设施， 可以被任意项目任意场景集成， 并且进一步优化与AI的互操作性。 我们IoM的定位将是 **AI时代的进攻性基础设施**。

在v0.2.0 的路线图中， 

- 我们可以快速使用 IoM提供的各种组件基于AI coding 快速在1小时内编写全新的implant；
- 可以基于AI几分钟内编写新的功能性插件； 
- 可以直接被agent操作用来进行自动化后渗透；
- 发布webui以及插件的自动UI渲染