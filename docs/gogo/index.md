---
title: gogo · index
---

## intro

为红队设计的基于端口的全能自动化引擎

repo: https://github.com/chainreactors/gogo

规则库: https://github.com/chainreactors/gogo-templates

下载: https://github.com/chainreactors/gogo/releases/latest

快速入门: https://chainreactors.github.io/wiki/gogo/start/

理论上支持包括windows 2003在内的全操作系统, **release中的版本使用了go 1.17+ubuntu-latest以及github action自动编译. 出现过在较低系统版本上无法运行的问题.** 如果出现了兼容下问题, 可以参考[文档中的编译一节](/wiki/gogo/start/#make)自行编译

## description

gogo是一款几乎能解决一切内网自动化操作的工具, 并非是一个简单的缝合怪, 也不是仅仅实现了功能的demo, 而是一个经过两年打磨, 对几乎所有场景(webshell, cs, 多级代理等等)下都有大量优化的**红队向工具**. 

gogo将内网自动化**从某些工具的一键无脑操作提升到有目的的行动策略组**, 几乎可以在所有奇怪复杂场景下通过特定的参数组合解决. 甚至在高防护的内网中, 也能进行一定程度的规避与探测. 

## 目录

1. [**参数与功能介绍**](/wiki/gogo/start)
2. [**设计理念与解决方案**](/wiki/gogo/design) *(建议优先阅读此章)*
3. [**设计细节**](/wiki/gogo/detail)
4. [**拓展与二次开发**](/wiki/gogo/extension)
5. [**实战与应用场景**](/wiki/gogo/do)
