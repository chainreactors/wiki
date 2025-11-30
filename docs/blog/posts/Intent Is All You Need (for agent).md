---
date:
  created: 2025-12-01
slug: intent_is_all_you_need
---
![](Pasted%20image%2020251201022349.png)

![](Pasted%20image%2020251201022424.png)

![](Pasted%20image%2020251201022437.png)

AI 时代符合第一性原理的设计理念胜过复杂的 Agent 工程。

![](Pasted%20image%2020251201022445.png)

![](幻灯片5.png)

![](Pasted%20image%2020251201022913.png)

![](幻灯片6.png)

我们让 AI 准确完整表达意图，然后高效执行，数十倍提升工具调用效率。

![](幻灯片7.png)

![](幻灯片8.png)

![](幻灯片9.png)

![](幻灯片10.png)

我们让工具适应 AI，做 AI 友好的基础设施。

![](幻灯片11.png)

![](幻灯片12.png)

![](幻灯片13.png)

![](幻灯片14.png)

我们开发完只测试了一个题目就下场正式比赛了，整场比赛使用kimi k2 为主的情况下只消耗了价值1k多人民币的Token。

![](Pasted%20image%2020251201022745.png)

![](幻灯片16.png)

模型工程 attention is all you need，那么agent工程就是intent is all you need。 

![](幻灯片17.png)

我们认为所有繁复的当前的agent工程都是中间阶段。

事实也证明，我们不需要任何知识库，扫描器，sop，复杂工程的agent，也能达到甚至超过很多投入了我们数百倍工作量。

![](幻灯片18.png)

通用超级agent正在诞生，我们需要做的是实现Intent Runtime，让超级agent贯彻人类的意图。

我们认为意图工程的终极形态是出现AI Native Programming Language. 专家可以通过形式化的自然语言充分表达意图，通过Runtime执行ANPL中的意图。 

![](Pasted%20image%2020251201022851.png)

## 答疑

### 意图工程这部分的代码真的只有100行么？

我们的100行代码主要实现了baby runtime ， 意图工程是我们认为未来的AI工程化趋势

### 是否是claude code在其中发挥了主要作用？实际上和我们的工作并无关系？

claude code确实有很大的作用， 但是使用10行的pydantic ai实现简单的ReAct Agent也能解出绝大部分简单中级题目以及部分hard题目。 并且也有其他团队使用了claude code， 但是确实效果没有我们的好。

因此我们任何在这次比赛中， 发挥核心作用的是让Claude Code强制通过python编排AI的意图。

### 意图工程与第二部分的关联？

第二部分我们主要介绍了 meta-tooling 设计模式， 通过让AI通过代码组织自己意图， 实现一次性调用大量原本需要多次MCP调用的工具。

我们认为这就是意图工程的雏形， 让AI更好地表达自己的意图。这确实不是意图工程的全部。

我们认为未来会出现形式化的 AI Native Programming Language， 让专家也可以通过形式化自然语言（形式逻辑）表达自己的意图， 并且需要实现一个 Intent Runtime， 保证每一句 ANPL Code被Runtime 执行。而不是编写一大段prompt， 让通用agent像是黑箱一样执行。

### 如何确定添加了更多意图工程的组件后效果不会下降？

我们实现了一套 意图的形式化表示法（Agent Pattern Graph）以及意图 Runtime。 正在一些复杂的垂类场景落地， 如果有机会的话，我们会在其他会议上发表我们的成果。