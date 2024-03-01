---
title: spray · index
---

## intro 

全新理解的下一代目录爆破工具, 一个全方位的目录爆破的解决方案

repo: https://github.com/chainreactors/spray

release: https://github.com/chainreactors/spray/releases/latest

**快速入门: https://chainreactors.github.io/wiki/spray/start/**

spray主要为了解决自动有效目录识别, 极限性能, 多目标以及分布式目录爆破中可能会遇到的问题. 并为解决这些问题保留了及其丰富的拓展能力. 提供了一站式的目录爆破/信息收集解决方案. 

**spray = [feroxbuster(高性能目录爆破)] + [指纹识别] + [httpx(http基本信息解析)] + [dirmap(字典生成)] + 自带的大量目录爆破相关功能**  

!!! important "设计理念"

	尽可能把能自动化的工作都交给工具, 但为所有场景保留可控制的接口. 

!!! example "Features."

    * 超强的性能, 在本地测试极限性能的场景下, 能超过ffuf与feroxbruster的性能50%以上. 
    * 基于掩码的字典生成
    * 基于规则的字典生成
    * 动态智能过滤
    * 全量gogo的指纹识别
    * 自定义信息提取, 如ip,js, title, hash以及自定义的正则表达式
    * 自定义无效页面过滤策略
    * 自定义输出格式
    * *nix的命令行设计, 轻松与其他工具联动
    * 多角度的自动被ban,被waf判断
    * 断点续传
    * 通用文件, 备份文件, 单个文件备份, 爬虫, 主动指纹识别的完美结合

## 目录

1. [**参数与功能介绍**](/wiki/spray/start)

2. [**设计理念与解决方案**](/wiki/spray/design)

3. [**设计细节**](/wiki/spray/detail)

4. [**最佳实践**](/wiki/spray/do)

   



