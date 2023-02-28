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

gogo是一款几乎能解决一切内网自动化操作的工具, 并非是一个简单的缝合怪, 也不是仅仅实现了功能的demo, 而是一个经过两年打磨, 对几乎所有场景(webshell, cs, 多级代理等等)下都有大量优化的 **红队向工具**. 

gogo将内网自动化 **从某些工具的一键无脑操作提升到有目的的行动策略组**, 几乎可以在所有奇怪复杂场景下通过特定的参数组合解决. 甚至在高防护的内网中, 也能进行一定程度的规避与探测. 

## 目录

1. [**参数与功能介绍**](/wiki/gogo/start)
2. [**设计理念与解决方案**](/wiki/gogo/design) *(建议优先阅读此章)*
3. [**设计细节**](/wiki/gogo/detail)
4. [**拓展与二次开发**](/wiki/gogo/extension)
5. [**实战与应用场景**](/wiki/gogo/do)

## background

当我们开始从事红队工作时, 不管是内网探测还是外网信息收集, 都还没有成熟的方法论. 

历史上有不少类似的工具, masscan/nmap的端口扫描, serverscan用go实现了部分nmap的功能. 以及一些图形化的工具. 

但红队面临的场景是复杂的, 并非所有情况都能本机接入, 超过90%的场景都需要在webshell/c2/代理下操作. 那么非落地的工具就不能满足的我们的需求了. 

最开始, 有一些人打包了单文件版本的masscan与nmap, 不过对系统的要求很高, 只有特定操作系统才能运行, 后来有人用go写了serverscan. 一定程度上解决了兼容性问题. 

但serverscan也是照着nmap设计的, 到了实战中会发现, 我们需要的不是端口指纹, 而是http应用的指纹与信息. 并且serverscan在识别端口指纹的时候有大量的主动发包, 速度极慢, 扫描的范围很难超过一个C段. 

于是我们开始尝试编写一个适用于红队场景的扫描器.  当然, 这个时期也有很多同行也遇到了类似的问题, fscan, kscan, TailorScan等等扫描器都是在这个阶段诞生的. 

gogo与这些工具同样经历了一两年的发展迭代, 其实在绝大多数功能上并没有突破性的差距, 更多的差距是在细节上的优化, 唯一能做到远远领先的就是gogo的可操控性与可拓展性. 这两个特性让gogo能够做到在同样功能的情况下, 能发现多得多的有效数据. 

在很多次实战中, 我们发现过使用fscan的友商与靶标插肩而过, 原因很简单. fscan反馈太少了, 使用者没办法感知到fscan的漏报. 或者一旦有网络隔离, fscan只能一遍一遍重扫, 一遍一遍尝试作着大量的无用功. 

而这个扫描器经过两年的打磨, 最终形态就是现在的gogo. 以工件(artifact)的形态, 作为与其他工具联动的一环, 高度可控的高拓展的内网自动化引擎. 
