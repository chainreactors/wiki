---
date:
  created: 2025-12-02
slug: intent_engineering_01
---

## 前言
最近三个月一直在 AI 安全攻防方向进行探索。虽然时间不长，但个人对 AI 在攻防和通用领域有很多实践感悟。此文不会深入讲太过基础的 Agent 知识，只会提到一些我认为关键的知识点。重点是讲我在 AI for 攻防领域的探索与实践，以及衍生出的一些新的思考和工程理念。

文中很多概念都是基于我自己的理解，并不会摘抄公开的定义，所以也不一定正确，请大家辩证看待，不过为了增加文章的可信度，我先放出我在 AI for 攻防领域的一点实践成果： [《238支全球顶尖战队上演AI攻防巅峰对决，腾讯云黑客松-智能渗透挑战赛即将开启！》](https://mp.weixin.qq.com/s/frvi4x1t6-11Q3TUPQ21cA) ，[《Top20战队决出！@腾讯云黑客松智能渗透挑战赛》](https://mp.weixin.qq.com/s/FeWpPnezFR8__VfMA3Ev5A)

![](/blog/assets/Pasted%20image%2020251202124556.png)

<!-- more -->

## 我理解的 AI 和 AI Agent

### 基于 LLM 的 AI

其实在2025年末说 “大家广泛讨论的 AI 的本质是基于 Transformer 架构的 Large Language Model” 已经不太准确了，AI 的发展速度非常迅速，已经出现了很多新兴的架构与模型。但目前应用最广泛，能够进行问答，代码生成，驱动 Agent 进行工作的底层本质还是 LLM 或者 Multimodal Large Language Model。目前所有相关能力，都需要在这个本质框架下被审视。

而 LLM 的本质是 Token 预测，简单来说就是你给他一段文本（这段起始文本就是所谓的 Prompt ），他预测并为你持续输出这段文本后面有可能出现的词。所有看起来花里胡哨的能力（问答，写诗，代码，推理）都是从“预测下一个词”这个单一目标里涌现出来的。基于这个基本原理，首先我认为目前的 LLM 并不具备真正的推理能力，所有推理过程都是 AI 见过了无数人类的知识后模仿着人类语言的规律去预测一个理想化专家会怎么推理的表现。基于 LLM 的 AI 也并不会真正的理解和做数学题，它所展现出来的计算能力无非是模式匹配与模仿，以及学习了大量的数字和运算规则后，其权重矩阵中内化了执行某些算术操作的能力。AI 幻觉，这也是我不太喜欢的一个词，感觉它错误的暗示了目前的 AI 似乎具有人一样的感知和意识，掩盖了真正的技术本质。

但我并不悲观，即使 AI 的所有输出都是预测和模仿，但它的千万亿参数里是实实在在的蕴涵着人类所有的知识结晶。通过合理的编辑和优化初始文本，增加 AI 输出某种文本的概率，就可以得到我们真正想要的答案，这也就是我理解的 Prompt 工程。

### 基于 LLM 的 AI Agent

关于 AI Agent 的定义，我也不想描述的太过学术，我认为具备两个最核心的特性就可以称为 AI Agent：**与世界交互**、**多轮持续迭代**。

那么 AI 与世界交互的本质是什么呢？其实就是通过 Prompt 告诉 AI 有哪些工具，如果需要调用工具，就用特定格式的文本回复，程序拿到 AI 的回复就解析出工具名，参数值等然后去调用这个工具，最后将结果又输入给 AI ，这其实就是所谓的 Tool Calling / Function Calling 机制，没有任何例外。真正调用工具的是程序员编写的代码，LLM 自始至终都只有文本对话。

基于此会很容易认为想要增强 AI Agent 与现实世界交互的能力，就是给他塞入越来越多的工具与详细的工具说明和调用示例。我认为 MCP 的出现加剧了这种现象，首先 MCP 与 Function Calling 并不是并列或竞争的关系，而是互补：如果说 Function Calling 给 AI 带来了与世界交互的能力，那么 MCP 就是统一了这种能力的协议。降低了大家开发和接入工具的门槛，给 Agent 直接塞入一堆工具的现象自然越来越多。

但这种给 Agent 添加一堆 MCP 工具的行为我认为并不正确，首先是大量的工具说明会在每一次与 LLM 的交互中都占据很多上下文空间，其次工具调用的中间结果会浪费和污染上下文。

## 主流 Agent 的开发范式和瓶颈

在攻防 Agent 探索的初期，我调研了很多开源项目，发现要做好一个通用的 Agent ，一是需要具有较好的规划，执行，观测，反馈调整的能力，二是需要为其配备 AI 友好的工具。然后框架我选择了最主流的 LangGraph，由于没有实际的开发经验，我一开始设计的是一个非常复杂的 Multi-Agent 架构。

![](/blog/assets/Pasted%20image%2020251202124612.png)

在实际用 LangGraph 开发 Demo 时反而写的比较简单：用 Plan-and-Execute 作为整体骨架，Plan 得到的小任务用 ReAct 。然后还为其开发了两个 MCP 工具：命令执行 Terminal-MCP 和 浏览器操作 Browser-MCP，从这开始我就特别注重工具的 AI 友好性，首先工具都运行于 Docker 容器中，我可以给 Agent 最大的权限而不用担心对我的系统造成破坏。其次 Terminal-MCP 不只是单纯的阻塞式执行命令和返回执行结果，而是具有会话管理，交互式命令执行等完整功能的终端工具，可以让 AI 完成在一个窗格进行 nc 监听，同时打开另一个窗格进行漏洞利用反弹 shell，反弹成功后回到第一个窗格接手 shell 完成进一步渗透等操作。

![](/blog/assets/Pasted%20image%2020251202124617.png)

只需要给 AI 一个目标，比如“攻击 example.com 网站，利用漏洞反弹 shell”，AI 就可以自主完成规划，不断调用工具的原子能力，观察调用结果，再次进行其他调用或者修改 Plan，直到逐步完成最初设置的目标。这里的原子能力我指的是工具中具体的某个操作，比如 Terminal-MCP 中的列举当前会话列表、在指定会话输入字符和查看指定会话内容等。

  

很快我就意识到这种设计存在两个问题：

1.  将 Agent 变的足够通用，足够应付所有渗透测试场景，反而会造成信息过载和测试思路不明确。过度追求通用而忽视了专家经验的显式建模
2.  将各种工具都直接注册给 Agent 且保持每轮单个工具函数调用，会导致效率低下，且每轮交互中，Agent 都需要直接处理工具函数的完整返回值，导致上下文爆炸和污染

  

对于这两个问题，我将分别用两种方案解决：**Agent Pattern Graph（APG）** 和 **Meta-Tooling** 。

## 意图的结构化表达：Agent Pattern Graph

### APG 的诞生背景

当人类安全专家在做特定的安全测试时，是会基于现实世界的上下文和个人经验遵守一套“测试模式”的，比如对企业办公网网站进行安全测试：

```
● 判断网站是否接入 SSO 认证（看是否会跳转到统一 SSO 地址）
  ○ 是 -> 放弃测试，风险较低
  ○ 否 -> 判断是否存在自定义鉴权
    ■ 是 -> 判断是否存在前端鉴权绕过（浏览器访问网站，观察响应中是否有一些表示认证状态的参数，然后修改一些关于认证的请求或者响应包，看前端是否变成了已认证的状态）
    ■ 否 -> 进一步尝试各种功能，判断是否有高危敏感接口（浏览网站功能，测试其中的看起来危险的接口看是否存在 RCE、SSRF 等）
```


因为了解内部的 DNS 系统和 SSO 机制，安全专家若是以“办公网网站风险测试”为目标进行测试时肯定不会去扫描这个域名对应的 IP 端口，也不会死磕有 SSO 认证的网站，大概率也不会用通用 CVE 漏洞扫描器去扫描网站。但通用 AI Agent 会，我们并没有提前限定通用 AI Agent 在面对什么样的目标时具体应该怎么做。

在 LangGraph 框架中，用 DAG（有向无环图）来描述工作流的执行逻辑，我们可以按照前文的测试模式去专门开发一套程序用于完成办公网网站安全测试，但这样的话，专家经验与框架和代码强耦合，每次遇到新的场景都要重新写一套代码。我们当然也可以把测试流程用自然语言描述，然后交由如 Claude Code 这类很强的通用 Agent 完成，但首先人类的自然语言天生约束力很弱，很难准确表达精细化的流程，其次 Agent 对于复杂 Prompt 的遵守性存疑。

  

所以我尝试在两种极端中寻找平衡，最终我打算引入一种新的中间形式 **Agent Pattern Graph（APG）** 来表示安全专家经验，将代码实现与专家经验解耦。用程序的编译执行来类比就是：

-   程序员编写 Java 代码 -> 编译器编译为字节码 -> Java 虚拟机解释执行字节码
-   安全专家自然语言表达经验 -> AI 梳理成 APG -> APG Runtime 解释执行 APG

  

准确来说，APG 是一种基于 YAML 声明式语法定义的有向无环图 (DAG）（后续可能酌情增加环的概念，以支持循环、递归和图复用），用于描述一个代码安全审计或者渗透测试流程，也可以描述任意通用领域 SOP。由一系列节点和边组成，其中节点定义 Agent 的操作任务和预期产出，边定义流程的动态路由条件。APG Runtime 负责解释运行APG。示例：

```
name: 办公网网站风险测试
agent: PydanticAI

context:
  target_url: ""          # 网站URL，APG的输入
  auth_status: ""         # n2 节点产出的鉴权状态 (SSO, Custom, None)
  bypass_result: ""       # n4 节点产出的绕过结果 (Success/Fail)
  vulnerability_report: "" # n6 节点产出的漏洞信息或无漏洞报告

nodes:
  - id: n2
    type: start
    name: 访问目标,检测身份认证
    inputs:
      - target_url
    content: |
      行为: 访问目标网站 {{target_url}} 首页, 获取响应和请求记录。
      判断是否存在 SSO 统一身份认证，以及是否存在自定义认证。如果直接可访问功能界面，没有跳转和登录，则认为“无任何鉴权”。
      将鉴权状态总结输出到 'auth_status' 变量中（可选值：SSO, Custom, None）。
      工具建议: browser_navigate, browser_network_requests
    outputs:
      - auth_status
  - id: n3
    type: end
    name: 放弃测试 (SSO)
    content: |
      目标 {{target_url}} 存在 SSO 强制认证，安全性较高，放弃测试。
    outputs: []
  - id: n4
    type: action
    name: 自定义鉴权绕过
    content: |
      目标 {{target_url}} 存在自定义鉴权。
      行为: 通过爆破、前端鉴权绕过等方式尝试绕过自定义鉴权，进入后台功能界面。爆破前可以使用 admin/admin 和 user/user 这种弱口令组合。
      将绕过尝试的结果总结输出到 'bypass_result' 变量中（可选值：Success, Fail）。
      工具建议: browser_navigate, browser_type, browser_click
    outputs:
      - bypass_result
  - id: n5
    type: end
    name: 放弃测试 (绕过失败)
    content: |
      不能绕过自定义鉴权，无法进入后台。结束测试。
    outputs: []
  - id: n6
    type: action
    name: 测试网站功能尝试挖洞
    content: |
      目标 {{target_url}} 已进入功能界面。
      行为: 识别和遍历测试网站所有高风险功能，针对远程代码执行 (RCE)、模板注入 (SSTI) 等高危且可执行命令的功能进行定向测试。
      命令执行成功的话，反弹 Shell 回来。反弹成功后，执行几个命令验证一下。
      将发现的漏洞信息（或“未发现高危漏洞”）总结输出到 'vulnerability_report' 变量中。
      工具建议: browser_navigate, browser_type, browser_click, terminal_execute
    outputs:
      - vulnerability_report
  - id: n7
    type: end
    name: 没有漏洞
    content: |
      没有发现高危漏洞，结束测试。最终报告：{{vulnerability_report}}
    outputs: []
  - id: n8
    type: end
    name: 整理漏洞报告
    content: |
      发现高危漏洞。整合结果并输出报告。最终报告：{{vulnerability_report}}
    outputs:
      - final_report_path
edges:
  - from: n1
    to: n2
  - from: n2
    to: n3
    condition: "auth_status 的值为 SSO"
  - from: n2
    to: n4
    condition: "auth_status 的值为 Custom"
  - from: n2
    to: n6
    condition: "auth_status 的值为 None"
  - from: n4
    to: n5
    condition: "bypass_result 的值为 Fail"
  - from: n4
    to: n6
    condition: "bypass_result 的值为 Success"
  - from: n6
    to: n8
    condition: "高危漏洞已确认"
  - from: n6
    to: n7
    condition: "未发现高危漏洞"
```

可视化呈现：

![](/blog/assets/Pasted%20image%2020251202124637.png)

### APG 与 Dify/n8n：抽象层次的本质差异

Dify 和 n8n 这类工具是通用业务流程的自动化，它们的核心是连接不同的 API 和服务，它们描绘的是程序怎么跑，节点是具体的原子动作（发邮件、查数据库）。而 APG 的目标是固化人类专家的思维路径，它是为驱动 AI Agent 进行复杂攻防推理而设计的。APG 的节点不是一个原子 API 调用，而是给 Agent 的一个高层任务指令（比如：“尝试绕过自定义鉴权”）。

区别的本质： Dify/n8n 控制的是代码执行流；APG 控制的是 AI Agent 的思考流。

### APG 是动态版 LangGraph 吗？

我觉得可以这么理解，但不够准确。APG 提供了 LangGraph 所缺少的一种能力——让非程序员（安全专家）也能通过一份 YAML 文件，快速定义、修改和部署一个复杂的、有专家经验指导的 Agent。 它将 LangGraph 的能力提升到了一个更高且更灵活的工程抽象层面。

### APG 的展望

我期望 APG 能够成为安全专家经验的工程化载体。每一张 APG 都是一份由专家验证的可执行、可复用、可持续演进的数字资产。在实际应用中仅需通过组合和裁剪这些图，就能快速构建出最合适的工作模式并由 Runtime 执行。此外，APG 执行过程中的日志和结果都将被结构化记录，这使得可以对大规模测试结果进行多维度聚合查询，从而清晰地回答“有多少系统没有接入SSO”，“最容易成功的攻击路径是什么”等问题。

### 意图工程

回过头来看，APG 诞生于这样一个场景：当我们拥有大量专家经验时，如何高效构造相应的 Agent。从这个实践问题出发，逐渐衍生出对未来 AI 工程的设想——**面向意图的工程**。

目前 Claude Code 中的类似实现本质上都是 Prompt Engineering，包括 Command、Subagent、Skill 这三套功能。但它们都存在一个共同的局限：Prompt 对执行流程的约束力很弱。

我们要解决的问题是：如何让 Claude Code 严格按照专家经验定义的流程执行。自然语言描述的 Prompt 天生缺乏对执行路径的强制约束，Agent 可能会"理解"你的意图，但无法保证完全按照预期的步骤和分支逻辑执行。这就是为什么我们需要 APG——一种结构化的、可验证的意图表达方式。

  

#### AI 工程的演变历程

-   **第一代：面向模型** - Prompt Engineering，集大成者：张继刚，Claude Code Skill
-   **第二代：面向 Agent** - Context Engineering，集大成者：Anthropic 的 Claude Code
-   **第三代：面向意图** - Intent Engineering，高速发展中，代表有 GitHub 的 SpecKit、HOP 等开源项目

  

#### 意图工程的两个核心组成

1.  **意图的理解/表达**：如何让 AI 更好地理解我们的意图（开源代表：SpecKit）
2.  **意图的执行**：如何让 AI 坚决执行我们的意图（开源代表：HOP）

  

意图工程的特性是与模型无关、与 Agent 无关，双向正交。它专注于意图层面的理解、表达和执行。

## 从原子调用到代码编排: Meta-Tooling 的范式转变

### 传统工具调用的根本性问题

当我们将大量MCP工具直接暴露给 Agent 时,会遇到两个核心瓶颈:

#### 上下文污染与爆炸

如果让 Agent 扫描某个目标 IP 的全端口，获取服务指纹信息，然后提取其中的WEB端口进行漏洞扫描。传统方式下，Agent的执行流程是:

```
1.  调用端口扫描工具 → 端口的扫描结果全部进入上下文
2.  Agent 在上下文中"目测"这些结果，识别出开放的端口
3.  调用服务识别工具 → 每个开放端口的详细指纹信息进入上下文
4.  Agent 再次"目测"，提取出WEB服务端口（80、443、8080等）
5.  对每个 WEB 端口调用漏洞扫描器 → 每个扫描器的详细输出进入上下文
```
  

整个过程中，充满大量无关数据：

```
● 无关端口的扫描记录
● 非 WEB 服务的详细指纹
● 漏洞扫描器的冗长输出
```
  

这些中间结果可能占据非常大的上下文空间，而Agent真正需要的只是："发现3个WEB端口，其中8080端口存在未授权访问漏洞"。大量无关信息不仅消耗 token，还会稀释 Agent 对关键信息的注意力。

#### 用 LLM 对话模拟控制流低效且错误率高

继续上面的渗透测试场景。在传统的工具调用模式中，每一步操作都需要：

```
● 一次完整的模型推理
● Agent通过自然语言"目测"扫描结果
● 手动提取有用信息并决定下一步
● 再次调用下一个工具
```

  

端口筛选、服务过滤、漏洞判断这些逻辑，本质上是条件判断和循环处理，应该用代码直接表达，但在传统工具调用模式下却不得不通过多轮自然语言对话来模拟。

举个具体例子：

```
Agent: "我发现端口80开放,接下来我要识别它的服务"
[调用服务识别] → "HTTP 服务,nginx 1.18.0"
Agent: "这是一个WEB服务,我要扫描它的漏洞"
[调用漏洞扫描器] → "发现3个中危漏洞,2个低危..."
Agent: "让我分析一下这些漏洞是否可利用..."
```

这个过程在代码中只需要三行：

```
if service.type == "http":
    vulns = scan_vulnerabilities(port, service)
    exploitable = [v for v in vulns if v.severity >= "high"]
```

  

这种通过自然语言对话去模拟控制流就像让安全工程师不能编写自动化脚本，而必须对着终端一遍遍手动输入命令、等待结果、再决定下一条命令。

### Meta-Tooling 的本质

要解决上述传统工具调用的问题，我的核心思路是将 LLM 从繁琐的执行细节中解放出来，让它回归高层推理和代码编写这两个真正擅长的领域。传统 Agent 依赖多轮底层的原子能力调用，我为 Agent 引入了一种新的能力层次——元工具（Meta Tool）：一个用来编排和组合调用其他工具的工具，一个可以创造工具的工具。简单来说就是可以让 Agent 通过代码而非对话来编排工具。

  

Agent 不是逐个请求工具、每个结果都放入上下文，而是：

```
1.  编写一段Python代码来声明整个工作流程代码在沙箱中执行
2.  调用多个工具代码处理工具的输出
3.  完成数据转换和筛选
4.  只有代码的最终输出进入 Agent 的上下文
```

### 为什么选择 Python 作为 DSL

既然需要一个高级执行层（DSL），其实可以自己设计一套专用的 YAML 或 JSON 格式的 DSL 语法，就像APG 对 LangGraph 的抽象一样。但我最终选择了 Python：

-   **AI 的 Python 编写能力极强**：现阶段的 LLM 在生成和理解 Python 代码方面的能力，远超其对任何一种自研 DSL 的理解。选择 Python 能最大限度地发挥LLM的编程天赋
-   **丰富的库生态与功能适配**：Python 语言本身就非常适合作为攻防领域的"胶水语言"，语法简洁，生态强大，在其之上封装各种工具库非常容易
-   **自由组合与创造性的极致释放**：能力封装为 Python 函数，极大地释放了 Agent 对底层能力的组合与编排能力。它不仅可以调用预置的高阶函数，更重要的是，在面对新目标时，Agent 可以当场编写和调用一个针对特定场景的定制化函数，即创造工具

## Meta-Tooling 在 Antix 中的工程实践

应用到 Antix 中的只有 Meta-Tooling，并没有来得及接入 APG ，其实按照我比赛前的设想，是可以用 AI 总结一下 Benchmark 的题目类型，各题目解题思路等，然后整合并建模为一张通用的渗透测试或 CTF 解题的 APG 图，虽然可能过拟合 Benchmark，但比赛成绩肯定会比目前高很多。

### 核心实现：Python Executor MCP

Meta-Tooling 的落地实现本质上是一个基于 Jupyter Kernel 的 Python 代码执行环境，我将其封装为了一个 MCP 服务。与传统的一次性代码执行不同，这个执行器具备完整的会话管理能力，可以让 Agent 像人类工程师一样在持久化的 Notebook 环境中工作。

![](/blog/assets/Pasted%20image%2020251202124703.png)

整个系统分为三层：

-   **MCP 接口层**：暴露 execute\_code、list\_sessions、close\_session 三个工具函数给 Agent


-   **会话管理层**：维护多个独立的 Jupyter Kernel 实例，每个会话拥有独立的变量空间和执行上下文
-   **持久化层**：所有执行历史自动保存为 .ipynb 文件，可追溯、可复现

### 工具集成：从 MCP 到 Sandbox 和 Toolset

虽然 Python Executor 本身是一个 MCP 工具，但它可以在执行的 Python 代码中调用更底层的 Sandbox 的能力。

我在 Sandbox 中提前构造了完整的桌面级操作系统环境，并在 Python 执行环境中预置了一个 toolset 库，封装了大量高级能力，包含浏览器、Terminal、流量代理等。Sandbox 除了对外暴露 Python Executor MCP （给 Agent 使用）外，也暴露 VNC 服务（给人类用于观察和干预），可以直观看一下：


### 持久化与可追溯性

每个会话的执行历史都会实时保存为标准的 Jupyter Notebook 文件：

![](/blog/assets/Pasted%20image%2020251202124712.png)

这意味着：

-  **可复现**：任何一次测试都可以通过 Notebook 完整复现
-  **可审计**：人类专家可以打开 .ipynb 文件查看 Agent 的思考过程 ，所有渗透测试行为都有完整的代码和输出记录

在比赛中，我可以在 Antix 运行结束后立即打开生成的 Notebook，看到它是如何一步步攻破靶机的，哪些尝试失败了，哪些成功了，就像查看人类工程师的工作记录一样清晰。

## 后记

这次的比赛于 11.10 开赛，我在赛前两天基本已经完成了整个 Meta-Tooling 的落地实现，而这个想法诞生的更早，但写这篇文章时发现 Anthropic 在 11.04 和 11.24 分别发布了两篇文章 [https://www.anthropic.com/engineering/code-execution-with-mcp](https://www.anthropic.com/engineering/code-execution-with-mcp) ， [https://www.anthropic.com/engineering/advanced-tool-use](https://www.anthropic.com/engineering/advanced-tool-use) 几乎和我的想法一致。有点感叹目前 AI 应用层的发展速度真的也非常快，而且这个层面的创新和突破很容易被追平，我觉得在未来，通用 AI 应用层工程很难成为技术壁垒，企业真正的壁垒是原本深耕领域的垂类数据、经验和 Infra。

另外在探索 AI for 安全攻防的这段时间里，AI 不仅是我的研究对象，更深度介入了我日常的每个环节。从想法梳理到代码编写再到落地验证，都离不开 Claude Code、Manus、Gemini 这些 AI 工具的使用。我不只是在用 AI 尝试重构安全攻防，也在用 AI 重构自己的工作方式。
