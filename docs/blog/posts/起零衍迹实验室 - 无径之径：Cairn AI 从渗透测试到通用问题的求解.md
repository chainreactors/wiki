---
date:
  created: 2026-04-26
slug: qiling_cairn_ai_pathless
title: 无径之径：Cairn AI 从渗透测试到通用问题的求解
---

## **[起零衍迹实验室]**{ style="color: #ff9f0a;" } 无径之径：Cairn AI 从渗透测试到通用问题的求解

这是我在第二届 **TCH·腾讯云黑客松智能渗透挑战赛** 获得线上唯一 AK 成绩的线下决赛答辩 PPT，最终总成绩为**全国第三**。

<!-- more -->

"无径之径" 的含义是——我没有给系统预设任何固定路径、流程定义和角色分工，路径本身从黑板上涌现出来。我的 PPT 写的比较详细，基本交代了我整个设计理念和工程实现，本系统全部代码近期也会在起零衍迹开源，如果有任何问题欢迎在本公众号该文章评论区留言，或者加入「起零衍迹 AI 社区」微信群讨论，我本人会一一回答。

> 「**起零衍迹**」是我们专注于 AI 应用与 Agent 工程前沿探索的开源组织，我们致力于技术开源与社区共建。安全攻防是我们深耕的方向之一。

## 无径之径：Cairn AI 从渗透测试到通用问题的求解

### About me![image-1](assets/qiling-cairn-ai-pathless/01.png)

### 目录![image-2](assets/qiling-cairn-ai-pathless/02.png)

## 问题的本质

### 开场![image-3](assets/qiling-cairn-ai-pathless/03.png)

### 经典回答![image-4](assets/qiling-cairn-ai-pathless/04.png)

### 状态空间搜索![image-5](assets/qiling-cairn-ai-pathless/05.png)

### 不只是渗透测试![image-6](assets/qiling-cairn-ai-pathless/06.png)

## 系统设计 — 黑板、蚁群、和涌现

### 一个画面 —— 侦探破案![image-7](assets/qiling-cairn-ai-pathless/07.png)

### 我设计出来，才发现它有名字 —— 黑板架构![image-8](assets/qiling-cairn-ai-pathless/08.png)

### Cairn 的黑板![image-9](assets/qiling-cairn-ai-pathless/09.png)

### Agent 的工作循环![image-10](assets/qiling-cairn-ai-pathless/10.png)

### 一道题的完整生命周期![image-11](assets/qiling-cairn-ai-pathless/11.png)

### 设定起点 Origin![image-12](assets/qiling-cairn-ai-pathless/12.png)

### 设定终点 Goal![image-13](assets/qiling-cairn-ai-pathless/13.png)

### 系统初始时要求直接完成 Goal![image-14](assets/qiling-cairn-ai-pathless/14.png)

### Worker 尝试直接从 Origin 到达 Goal（Bootstrap）![image-15](assets/qiling-cairn-ai-pathless/15.png)

### 没有在指定时间内到达 Goal，但也写下了结论 Fact![image-16](assets/qiling-cairn-ai-pathless/16.png)

### Worker 开始思考下一步应该做什么（Reason）![image-17](assets/qiling-cairn-ai-pathless/17.png)

### Worker 写下下一步 Intent![image-18](assets/qiling-cairn-ai-pathless/18.png)

### Worker 执行指定 Intent（Explore）![image-19](assets/qiling-cairn-ai-pathless/19.png)

### Worker 执行指定 Intent 完成后写下结论 Fact![image-20](assets/qiling-cairn-ai-pathless/20.png)

### 态势变化，Worker 重新思考下一步做什么（Reason）![image-21](assets/qiling-cairn-ai-pathless/21.png)

### Worker 写下下一步 Intent![image-22](assets/qiling-cairn-ai-pathless/22.png)

### Worker 执行指定 Intent（Explore）![image-23](assets/qiling-cairn-ai-pathless/23.png)

### Worker 判定完成，连接到 Goal，项目结束![image-24](assets/qiling-cairn-ai-pathless/24.png)

### 一个更复杂的案例![image-25](assets/qiling-cairn-ai-pathless/25.png)

### 我从来没有限制他怎么做渗透测试![image-26](assets/qiling-cairn-ai-pathless/26.png)

## 系统架构

### 平等的 Worker，动态的任务![image-27](assets/qiling-cairn-ai-pathless/27.png)

### Agent 之间如何协调![image-28](assets/qiling-cairn-ai-pathless/28.png)

### Agent 角色分工是人类局限的投影![image-29](assets/qiling-cairn-ai-pathless/29.png)

### 传统多 Agent 架构的角色分工是人类局限的投影![image-30](assets/qiling-cairn-ai-pathless/30.png)

### Less Is More![image-31](assets/qiling-cairn-ai-pathless/31.png)

## 总结

### 比赛表现![image-32](assets/qiling-cairn-ai-pathless/32.png)

### 总结![image-33](assets/qiling-cairn-ai-pathless/33.png)

### 结语![image-34](assets/qiling-cairn-ai-pathless/34.png)

### 附.![image-35](assets/qiling-cairn-ai-pathless/35.png)

### THANKS![image-36](assets/qiling-cairn-ai-pathless/36.png)

