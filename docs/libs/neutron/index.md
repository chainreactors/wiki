---
title: neutron · index
---



## Intro

neutron是为了在需要工具落地的场景中使用而魔改的轻量版nuclei 引擎, 实现了nuclei引擎中的绝大部分功能, 并且几乎不需要引入额外的第三方库. 能兼容低版本操作系统(windows xp/ windows server 2003). 极小体积, 几乎不会让二进制体积增长.



## 使用

nuclei 官方的poc编写教程 https://nuclei.projectdiscovery.io/templating-guide/

gogo常用于特殊环境下, 因此删除了许多nuclei原有的功能, 例如dsl, oast以及除了http与tcp协议之外的漏洞探测.

nuclei更新较快, 一般情况下gogo会落后nuclei最新版几个月, 所以建议只使用基本的规则, 编写最简的poc, 保证兼容性.

**明确删除并且后续不会添加的功能**

部分功能会以简化的形式重新加入到gogo中

1. oast与OOB,这类需要外带的功能, 可以通过探测接口是否存在做一个大致的匹配.
2. workflow, 通过chain简单代替
3. info中的大多数信息, 只保留最基本的信息, 并且不会输出, 建议只保留name, tag, severity三个字段
4. pipeline
5. Race conditions
6. 除了regex之外的extractor. 因为引入多个解析库容易会变得臃肿

**暂时不支持的功能, 但在计划表中的功能**

- [x] cookie reuse
- [x] http redirect
- [x] variables  （已支持自定义payloads, 功能类似variables）
- [x] Helper Functions (已支持完整的dsl引擎)

## 案例

### gogo中使用

请见: https://chainreactors.github.io/wiki/gogo/extension/#poc



### zombie中使用

请见: https://chainreactors.github.io/wiki/zombie/extension/
