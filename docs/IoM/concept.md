---
title: Internet of Malice · 核心概念
---

# IoM 核心概念

IoM采用高度解耦的分布式架构，本文档介绍各个核心组件的概念和作用。

!!! tip "与开发者指南的关系"
    本文档介绍概念和架构，具体开发实践请参考[开发者贡献指南](/IoM/guideline/develop/)

## 相关项目

IoM作为完整的进攻性基础设施，由多个相互协作的项目组成。

### 核心项目

- **[malice-network](https://github.com/chainreactors/malice-network)**: Server/Client/Listener核心框架
- **[malefic](https://github.com/chainreactors/malefic)**: Rust实现的跨平台Implant
- **[proto](https://github.com/chainreactors/proto)**: gRPC通讯协议定义

### 插件生态

- **[mals](https://github.com/chainreactors/mals)**: 官方插件仓库和索引
- **[mal-community](https://github.com/chainreactors/mal-community)**: 社区插件合集


## IoM 核心组件

IoM采用高度解耦的分布式架构，由以下核心组件协同工作：

```mermaid
graph TB
    subgraph "用户层"
        Client["Client<br/>用户交互界面"]
        Mal["Mal插件<br/>Lua脚本扩展"]
    end
    
    subgraph "控制层"
        Server["Server<br/>核心数据处理"]
        EventBus["事件总线<br/>状态同步"]
    end
    
    subgraph "网络层"
        Listener["Listener<br/>分布式监听"]
        Pipeline["Pipeline<br/>数据管道"]
        Parser["Parser<br/>协议解析"]
        Cryptor["Cryptor<br/>流式加密"]
    end
    
    subgraph "执行层"
        Implant["Implant<br/>目标执行"]
        Module["Module<br/>功能模块"]
        Addon["Addon<br/>二进制缓存"]
    end
    
    subgraph "生态层"
        BOF["BOF<br/>CobaltStrike兼容"]
        Armory["Armory<br/>Sliver生态"]
        Kit["Kit<br/>OPSEC工具包"]
    end
    
    %% 核心通信流
    Client -.->|gRPC| Server
    Server -.->|gRPC Stream| Listener
    Listener -.->|TCP/HTTP| Implant
    
    %% 内部关联
    Server --> EventBus
    Listener --> Pipeline
    Pipeline --> Parser
    Pipeline --> Cryptor
    Implant --> Module
    Implant --> Addon
    
    %% 插件扩展
    Client --> Mal
    Implant --> BOF
    Client --> Armory
    Implant --> Kit
    
    %% 状态同步
    Server -.->|事件广播| Client
    Server -.->|状态同步| Listener
    
    classDef clientStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef serverStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef networkStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef implantStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef ecosystemStyle fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class Client,Mal clientStyle
    class Server,EventBus serverStyle
    class Listener,Pipeline,Parser,Cryptor networkStyle
    class Implant,Module,Addon implantStyle
    class BOF,Armory,Kit ecosystemStyle
```


## 通讯流程

IoM的数据流转遵循严格的路径，确保安全和可控性。

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant L as Listener
    participant I as Implant
    
    Note over C,I: 1. 初始化连接
    C->>S: gRPC连接建立
    L->>S: gRPC Stream连接
    I->>L: TCP/HTTP Beacon连接
    
    Note over C,I: 2. 命令下发
    C->>S: 发送命令请求
    S->>S: 生成Spite消息
    S->>L: 转发Spite (gRPC Stream)
    L->>L: Parser解析 + Cryptor加密
    L->>I: 发送加密数据包
    
    Note over C,I: 3. 结果返回
    I->>L: 返回执行结果
    L->>L: Cryptor解密 + Parser解析
    L->>S: 回传Spite (gRPC Stream)
    S->>S: 更新Session状态
    S->>C: 返回结果 (事件系统)
    
    Note over C,I: 4. 状态同步
    S->>C: 广播状态更新事件
    S->>L: 同步Session状态
```

## Server

数据处理和状态管理的核心组件。

**核心职责**:

- 所有数据的中央管理和持久化
- 提供gRPC服务供Client和Listener调用
- 状态集合管理和事件分发
- 任务调度和结果处理

**架构特点**:

- Client/Listener中只保留只读副本
- 内存中保留当前存活的数据
- 历史数据保存在数据库中

**状态管理**:

| 状态集合 | 用途 | 说明 |
|----------|------|------|
| **clients** | 用户连接管理 | 正在连接的所有用户 |
| **listeners** | 监听器管理 | 所有Listener实例 |
| **jobs** | 任务管道管理 | Pipeline实例(TCP、Website等) |
| **events** | 事件系统 | 轮询用户并广播事件 |
| **sessions** | 会话管理 | 存活的Implant会话 |

**RPC服务**:
通过gRPC实现对状态的CRUD操作、事件通知、Listener交互等功能。

!!! info "二进制文件"
    v0.0.2后Server与Listener使用同一个二进制文件，通过不同配置启动不同模式。

!!! tip "开发指南"
    Server开发详见[Server开发指南](/IoM/guideline/develop/server/)

### Session

Implant会话的状态管理结构，保存单个Implant的完整信息。

**核心功能**:
Session是Server中最复杂的数据结构，负责管理单个Implant的完整生命周期。

**子状态集合**:

| 子状态      | 内容            | 用途         |
| -------- | ------------- | ---------- |
| **基本信息** | 操作系统、进程信息、权限等 | 环境识别和决策    |
| **任务管理** | 正在执行的Task列表   | 任务状态跟踪     |
| **连接状态** | 网络连接的逻辑状态     | 连接管理和故障恢复  |
| **数据缓存** | 历史数据缓存        | 性能优化和数据持久化 |
| **模块信息** | 可用Module列表    | 功能能力管理     |
| **组件管理** | 已加载的Addon     | 内存管理和资源控制  |
| ...      |               |            |

并且还有复杂的同步机制，将在client与listener上维护session的备份。 
## Implant

植入物，在目标系统中执行的核心组件。

https://github.com/chainreactors/malefic/

**主要类型**:

- **Malefic**: 功能完整的主Implant，支持Beacon/Bind模式
- **Pulse**: 轻量级上线马，仅4KB大小，类似CS的artifact  
- **Prelude**: 多段上线的中间阶段，支持权限维持等

**核心特性**:

- 基于Rust实现，跨平台支持
- 模块化设计，动态加载功能
- 多种通讯模式(Beacon/Bind)
- OPSEC友好的设计

**模块系统**:
Implant通过Module系统实现功能扩展，支持编译时静态链接和运行时动态加载。

IoM支持多种格式的无文件执行：

| 类型 | 描述 | 特性 |
|------|------|------|
| **execute-assembly** | CLR程序执行 | 支持bypass AMSI/ETW |
| **execute-exe** | PE程序反射执行 | 参数欺骗、进程注入 |
| **inline-exe** | 当前进程内执行 | 无新进程创建 |
| **execute-dll** | DLL反射执行 | 支持sideload |
| **execute-shellcode** | Shellcode执行 | 灵活的注入方式 |
| **powershell** | Unmanaged PowerShell | 绕过PowerShell限制 |
| **bof** | Beacon Object File | 轻量级功能扩展 |
上诉拓展能力能满足绝大部分场景。

!!! tip "详细文档"
    - Implant开发详见[Implant开发指南](/IoM/guideline/develop/implant/)
    - 编译配置参考[Implant构建指南](/IoM/manual/implant/build/)
    - 模块开发参考[Module开发文档](/IoM/manual/implant/modules/)

## Client

用户交互界面，负责命令输入和结果展示。

**架构特性**:

- 通过gRPC与Server通讯
- 支持CLI和GUI两种模式
- 高度可扩展的插件系统


!!! tip "详细文档"
    - Client开发详见[Client开发指南](/IoM/guideline/develop/client/)
    - 使用手册参考[Client使用指南](/IoM/manual/manual/client/)
    - Mal插件开发参考[Mal插件文档](/IoM/manual/mal/)


## 通讯

C2的本质就是安全的通讯与命令下发。我们需要将Client/Server/Listener/Implant 四端打通， 因此通讯设计是其中核心。 
### Spite

Spite是整个IoM通讯的最小单元，是server/listener <--> implant之间进行数据交换的载体。

**核心特性**:

- 基于Protobuf实现，高效序列化
- 统一的数据交换格式
- 支持任务状态管理
- 模块化的body设计

**结构定义**:
```protobuf
message Spite {
  string name = 1;      // 目标module名称  
  uint32 task_id = 2;   // 任务ID
  uint32 error = 5;     // 错误码
  Status status = 6;    // 任务状态
  
  oneof body {          // 具体数据载体
    Request request = 24;     // 通用请求
    Response response = 25;   // 通用响应  
    LoadModule load_module = 31;
    ExecuteBinary execute_binary = 42;
    // ... 更多模块特定的消息类型
  }
}
```

**使用场景**:

- Client通过RPC调用生成Spite
- Server将Spite转发给对应Listener  
- Listener通过Parser和Cryptor处理Spite
- Implant接收Spite并路由到对应Module执行

!!! info "协议定义"
    完整定义请参考[proto仓库](https://github.com/chainreactors/proto)的[implant.proto](https://github.com/chainreactors/proto/blob/master/implant/implantpb/implant.proto) 

### Listener

分布式监听服务，负责与Implant的实际通讯。

**设计理念**:
IoM的Listener与传统C2框架最大的不同是完全独立于Server，可以部署在任意服务器上，通过gRPC Stream与Server进行全双工通讯。

```mermaid
graph LR
	MSF["MSF\n监听在本机"] --> Cobaltstrike["Cobaltstrike\n监听在Server"] --> IoM["IoM\n分布式监听"]
```

**Listener内部架构**:

```mermaid
graph TB
    subgraph "Listener实例"
        subgraph "核心组件"
            Core[Listener核心<br/>管理与调度]
            RPC[gRPC Client<br/>与Server通讯]
        end
        
        subgraph "Pipeline管理"
            TCP[TCP Pipeline<br/>TCP/TLS监听]
            HTTP[HTTP Pipeline<br/>HTTP/HTTPS服务]
            Bind[Bind Pipeline<br/>主动连接]
            Website[Website Pipeline<br/>文件托管]
            Pulse[Pulse Pipeline<br/>轻量级上线]
        end
        
        subgraph "数据处理层"
            Parser[Parser<br/>协议解析器]
            Cryptor[Cryptor<br/>加密解密器]
            Forwarder[Forwarder<br/>数据转发]
        end
        
        subgraph "连接层"
            Conn1[连接1]
            Conn2[连接2]
            ConnN[连接N...]
        end
        
        Core --> RPC
        Core --> TCP
        Core --> HTTP
        Core --> Bind
        Core --> Website
        Core --> Pulse
        
        TCP --> Parser
        HTTP --> Parser
        Bind --> Parser
        Website --> Parser
        Pulse --> Parser
        
        Parser --> Cryptor
        Cryptor --> Forwarder
        
        Forwarder --> Conn1
        Forwarder --> Conn2
        Forwarder --> ConnN
    end
    
    subgraph "外部连接"
        Server[Server<br/>gRPC Stream]
        Implant1[Implant A]
        Implant2[Implant B]
        ImplantN[Implant N]
    end
    
    RPC -.->|双向流| Server
    Conn1 -.->|加密通讯| Implant1
    Conn2 -.->|加密通讯| Implant2
    ConnN -.->|加密通讯| ImplantN
    
    classDef coreStyle fill:#e3f2fd
    classDef pipelineStyle fill:#e8f5e8
    classDef dataStyle fill:#fff3e0
    classDef connStyle fill:#f1f8e9
    
    class Core,RPC coreStyle
    class TCP,HTTP,Bind,Website,Pulse pipelineStyle
    class Parser,Cryptor,Forwarder dataStyle
    class Conn1,Conn2,ConnN connStyle
```

**核心特性**:

- **分布式部署**: 可在任意服务器上部署
- **完全解耦**: 与Server独立，故障隔离
- **多形态支持**: 支持各种伪装和隐蔽形式
- **实时通讯**: 通过gRPC Stream与Server双向通讯

**内部架构**:

- **Listener核心**: 管理Pipeline和与Server交互
- **Pipeline**: 具体的数据管道实现
- **Forwarder**: 数据转发组件
- **Parser**: 协议解析器
- **Cryptor**: 加密解密器

!!! tip "开发指南"
    Listener开发详见[Server开发指南](/IoM/guideline/develop/server/#listener开发)

### Pipeline

数据管道，Listener与Implant/WebShell交互的具体实现。

**概念说明**:

Pipeline相当于传统C2框架中的Listener概念，但IoM进一步细分了其实现。每个Listener可以运行多个Pipeline，Pipeline负责与Implant的具体交互。

**主要类型**:

| 类型             | 用途                | 状态      |
| -------------- | ----------------- | ------- |
| **TCP/TLS**    | 监听TCP端口，默认配置      | ✅ 稳定    |
| **HTTP/HTTPS** | HTTP协议通讯          | 🛠️ 开发中 |
| **Bind**       | 主动连接bind模式Implant | ✅ 稳定    |
| **Pulse**      | 轻量级Pulse专用管道      | ✅ 稳定    |
| **Website**    | 静态文件托管(类似CS的host) | ✅ 稳定    |
| **REM**        | 流量代理和转发服务         | 🛠️ 计划中 |

**交互模式**:

- **Beacon模式**: 解析心跳包并返回任务数据
- **Bind模式**: 主动向目标发起连接  
- **Website模式**: 提供HTTP服务分发文件
- **代理模式**: 提供端口转发和流量中转

**可扩展性**:
通过实现Pipeline的基本RPC控制接口，可以接入各种形式的Pipeline，如云函数、代理、[LOLC2](https://lolc2.github.io/)等。

!!! important "设计特点"
    Pipeline比传统Listener设计更加灵活，支持更丰富的功能，并且与Parser、Cryptor完全解耦。

### Parser

协议解析器，控制最终数据包格式的组件。

**设计目的**:
Parser提供了协议实现的抽象层。虽然内部组件间通过Spite通讯，但最终发送到目标的数据包可以是任意格式。

**接口定义**:
```go
type PacketParser interface {  
    PeekHeader(conn *peek.Conn) (uint32, uint32, error)  
    ReadHeader(conn *peek.Conn) (uint32, uint32, error)  
    Parse([]byte) (*implantpb.Spites, error)  
    Marshal(*implantpb.Spites, uint32) ([]byte, error)  
}
```

**核心功能**:

- **Parse**: 二进制数据 → Spites映射
- **Marshal**: Spites → 二进制数据映射  
- **ReadHeader/PeekHeader**: 协议识别和header解析

**默认协议栈**:
```mermaid
graph TD
    subgraph 通讯协议
        TLS[TLS层]
        subgraph 自定义加密
            Encryption[对称加密层]
            subgraph 内部结构
                Header[协议头]
                Secure[密码学安全加密] --> Proto[Protobuf数据]
            end
        end
    end
```

**扩展能力**:

- 自定义传输协议格式
- 接入第三方C2框架
- 作为其他C2的external listener
- 适配不同的implant协议

### Cryptor

流式加密解密器，负责数据流的加密处理。

**接口设计**:
```go
type Cryptor interface {  
    Encrypt(reader io.Reader, writer io.Writer) error  
    Decrypt(reader io.Reader, writer io.Writer) error  
    Reset() error  
}
```

**特性**:

- 直接作用于连接流(与REM相同设计)
- 支持流式加密算法
- 对全包进行加密解密

**当前实现**:

- **XOR**: 简单异或加密
- **AES-CFB**: AES CFB模式


!!! important "组件解耦"
    Parser、Pipeline、Cryptor三者完全解耦，可以任意组合使用，提供极大的灵活性。

## Task

IoM中的任务管理基于Task和Job两个核心概念，实现了灵活的异步任务调度和管理。

### Task

Task是IoM中最小的执行单元，每个用户操作都会生成一个Task。

**核心特性**:

- **唯一标识**: 每个Task有唯一的task_id
- **状态管理**: 支持pending、running、completed、failed等状态
- **异步执行**: 支持长时间运行的任务
- **结果缓存**: 任务结果可以被缓存和查询

**生命周期**:

1. **创建**: Client发送命令时创建Task
2. **分发**: Server将Task转发给对应的Listener
3. **执行**: Implant接收并执行Task
4. **返回**: 执行结果通过相同路径返回
5. **完成**: Task状态更新为完成或失败


## REM网络工具包

REM(Request Enhancement Module)是IoM的网络工具包，提供强大的流量代理和隧道能力。

**核心功能**:

- **正反向代理**: 支持HTTP/HTTPS/SOCKS代理
- **端口转发**: TCP/UDP端口转发和映射
- **流量隧道**: 基于多种协议的隧道通讯
- **LOLC2支持**: Living off the Land C2技术支持
- **流量混淆**: 多种流量伪装和加密方案

**与IoM集成**:

- 可作为独立服务部署
- 与Listener深度集成
- 支持级联部署
- 提供统一的配置管理

!!! tip "详细文档"
    REM的完整功能参考[REM文档](/rem/)和[代理配置指南](/IoM/guideline/proxy/)



## 插件生态与兼容性

IoM构建了完整的插件生态系统，既支持原生插件开发，又兼容主流C2框架的插件生态。

### 拓展能力

IoM的拓展能力是其核心中的核心，支持在多个维度进行功能扩展，构建了完整的可拓展生态系统。

| 拓展维度           | 扩展类型         | 描述                 | 文档链接                                                    |
| -------------- | ------------ | ------------------ | ------------------------------------------------------- |
| **🔧 Client**  | Command开发    | 添加自定义命令            | [Client开发指南](/IoM/guideline/develop/client/)            |
|                | Mal插件系统      | Lua脚本扩展            | [Mal插件文档](/IoM/manual/mal/)                             |
|                | Armory兼容     | Sliver生态支持         | [内置插件文档](/IoM/guideline/embed_mal/)                     |
|                | 多语言SDK       | 第三方客户端开发           | [proto仓库](https://github.com/chainreactors/proto)       |
| **⚙️ Server**  | Proto协议扩展    | 自定义消息类型            | [proto定义](https://github.com/chainreactors/proto)       |
|                | RPC服务扩展      | 添加新的RPC接口          | [Server开发指南](/IoM/guideline/develop/server/)            |
|                | Parser扩展     | 自定义协议解析            | [Server开发指南](/IoM/guideline/develop/server/#listener开发) |
|                | Pipeline扩展   | 自定义传输通道            | [Server开发指南](/IoM/guideline/develop/server/#listener开发) |
| **🚀 Implant** | Module系统     | 动态功能模块             | [Module开发文档](/IoM/manual/implant/modules/)              |
|                | Features编译   | 编译时功能选择            | [Implant构建指南](/IoM/manual/implant/build/)               |
|                | Addon管理      | 二进制内存缓存            | [Implant开发指南](/IoM/guideline/develop/implant/)          |
|                | 执行引擎         | 多种加载方式             | [Implant使用手册](/IoM/manual/implant/)                     |
|                | Kit工具包       | OPSEC对抗工具          | [高级用法文档](/IoM/guideline/advance/Guardrail/)             |
|                | Loader扩展     | 自定义加载器             | [Implant开发指南](/IoM/guideline/develop/implant/)          |
| **🔄 生态兼容**    | BOF兼容        | CobaltStrike BOF支持 | [内置插件文档](/IoM/guideline/embed_mal/)                     |
|                | Assembly兼容   | CLR程序执行            | [Implant使用手册](/IoM/manual/implant/)                     |
|                | PowerShell兼容 | Unmanaged执行        | [Implant使用手册](/IoM/manual/implant/)                     |
|                | Sliver兼容     | Alias/Extension支持  | [内置插件文档](/IoM/guideline/embed_mal/)                     |
|                | PE兼容         | 反射加载/SRDI          | [Implant使用手册](/IoM/manual/implant/)                     |
|                | DLL兼容        | UDRL/sideload      | [Implant使用手册](/IoM/manual/implant/)                     |
| **📦 插件包**     | lib包         | 基础加载器              | [community-lib](https://github.com/chainreactors/mal-community/tree/master/community-lib)         |
|                | common包      | 通用扫描工具             | [community-common](https://github.com/chainreactors/mal-community/tree/master/community-common)         |
|                | steal包       | 凭证提取工具             | [community-steal](https://github.com/chainreactors/mal-community/tree/master/community-steal)         |
|                | elevate包     | 提权工具               | [community-elevate](https://github.com/chainreactors/mal-community/tree/master/community-elevate)         |
|                | persistence包 | 权限维持               | [community-persistence](https://github.com/chainreactors/mal-community/tree/master/community-persistence)         |
|                | move包        | 横向移动               | [community-move](https://github.com/chainreactors/mal-community/tree/master/community-move)         |
|                | proxy包       | 代理隧道               | [community-proxy](https://github.com/chainreactors/mal-community/tree/master/community-proxy)                         |
|                | domain包      | 域渗透                | [community-domain](https://github.com/chainreactors/mal-community/tree/master/community-domain)         |


### Mal插件系统

Mal是IoM的核心插件系统，提供了强大而灵活的扩展能力。

#### 概念定义

Mal（Malice Lua）是基于Lua 5.1和gopher-lua实现的插件框架，为IoM提供了：

- **脚本化扩展**: 使用Lua编写自定义功能
- **命令注册**: 动态添加Client命令
- **API集成**: 完整的gRPC和内置API访问
- **生态兼容**: 支持CobaltStrike AggressorScript风格API

#### 架构设计

```mermaid
graph TB
    subgraph "Mal插件架构"
        subgraph "插件层"
            Plugin["Mal插件<br/>(.lua + mal.yaml)"]
            Library["Mal库<br/>可复用模块"]
            Community["社区插件<br/>mal-community"]
        end

        subgraph "运行时"
            VMPool["VM实例池<br/>并发管理"]
            subgraph "VM实例"
                LuaVM1["Lua VM 1"]
                LuaVM2["Lua VM 2"]
                LuaVMN["Lua VM N"]
            end
            Registry["命令注册<br/>Cobra集成"]
            Protobuf["Protobuf<br/>消息处理"]
        end

        subgraph "API层"
            Builtin["Builtin API<br/>核心功能"]
            RPC["RPC API<br/>gRPC调用"]
            Beacon["Beacon API<br/>CS兼容层"]
        end

        subgraph "扩展库"
            StdLib["Lua标准库<br/>package/table/io等"]
            ExtLib["扩展库<br/>json/yaml/http等"]
            Storage["持久存储<br/>跨插件共享"]
        end
    end

    %% 插件加载流程
    Community --> Plugin
    Plugin --> VMPool
    Library --> VMPool

    %% VM池管理
    VMPool ==> LuaVM1
    VMPool ==> LuaVM2
    VMPool ==> LuaVMN

    %% VM与API连接
    LuaVM1 -.-> Builtin
    LuaVM1 -.-> RPC
    LuaVM1 -.-> Beacon

    %% API内部关系
    Beacon --> RPC
    RPC --> Protobuf
    Builtin --> Registry

    %% VM与扩展库连接
    LuaVM1 -.-> StdLib
    LuaVM1 -.-> ExtLib
    ExtLib --> Storage

    classDef pluginStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef apiStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef runtimeStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef vmStyle fill:#e1f5fe,stroke:#0288d1,stroke-width:1px
    classDef extStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px

    class Plugin,Library,Community pluginStyle
    class Builtin,RPC,Beacon apiStyle
    class VMPool,Registry,Protobuf runtimeStyle
    class LuaVM1,LuaVM2,LuaVMN vmStyle
    class StdLib,ExtLib,Storage extStyle
```



### Implant Loader支持

| 插件类型          | 用途         | 兼容性      | 特性 |
| ------------- | ---------- | -------- | ---- |
| **Mal插件**     | Lua脚本扩展    | IoM原生    | 动态脚本、丰富API |
| **Module**    | 动态模块加载     | IoM原生    | Rust FFI、热插拔 |
| **Addon**     | 二进制程序缓存    | IoM原生    | 内存缓存、避免重传 |
| **BOF** | Beacon Object File | CobaltStrike兼容 | 轻量级功能扩展 |
| **Assembly** | CLR程序执行 | CobaltStrike兼容 | bypass AMSI/ETW |
| **PowerShell** | Unmanaged执行 | CobaltStrike兼容 | 绕过限制策略 |
| **Alias**     | CLR/UDRL管理 | Sliver兼容 | 命令别名和预设 |
| **Extension** | BOF管理      | Sliver兼容 | 插件管理 |
| **Armory**    | 插件包管理      | Sliver兼容 | 一键安装管理 |

!!! tip "详细文档"
    - 插件开发参考[Mal插件文档](/IoM/manual/mal/)
    - 兼容性配置参考[内置插件文档](/IoM/guideline/embed_mal/)


## OPSEC模型

IoM设计了基于四个维度的OPSEC评估模型，参考CVSS评分标准。

### 评分体系

**评分范围**: 0-10分，分越高越安全

| 等级 | 分数 | 描述 |
|------|------|------|
| **低** | 0-3.9 | 极易被检测，明显痕迹，可能造成严重后果 |
| **中** | 4.0-6.9 | 可能被检测，痕迹可控，后果可控 |
| **高** | 7.0-8.9 | 基本不被检测，痕迹较小，后果轻微 |
| **OPSEC** | 9.0-10 | 几乎不可能被检测，无痕迹，无后果 |

### 评估维度

**1. 暴露度** - EDR/NDR检测风险

- 进程创建活动
- 线程创建活动  
- 文件系统操作
- 网络连接建立
- 系统API调用

**2. 痕迹** - 操作可追溯性

- 日志删除能力
- 文件清理能力
- 注册表痕迹
- 内存痕迹

**3. 检测可能性** - 被发现的概率

- 现有检测机制覆盖
- 系统级追踪可能性
- 检测实现复杂度

**4. 后果** - 被发现后的影响

- 立足点丢失风险
- 长期潜伏影响
- 整体行动暴露
