---
title: neutron · index
---

## overview

repo: https://github.com/chainreactors/neutron

neutron是为了在需要工具落地的场景中使用而魔改的轻量版nuclei 引擎, 实现了nuclei引擎中的绝大部分功能, 并且几乎不需要引入额外的第三方库. 能兼容低版本操作系统(windows xp/ windows server 2003). 极小体积, 几乎不会让二进制体积增长.



## 使用

nuclei 官方的poc编写教程 https://nuclei.projectdiscovery.io/templating-guide/

gogo常用于特殊环境下, 因此删除了许多nuclei原有的功能, 例如dsl, oast以及除了http与tcp协议之外的漏洞探测.

nuclei更新较快, 一般情况下gogo会落后nuclei最新版几个月, 所以建议只使用基本的规则, 编写最简的poc, 保证兼容性.

**明确删除并且后续不会添加的功能**

部分功能会简化后重新加入到neutron中

1. oast与OOB.
2. workflow, 通过chain简单代替
3. pipeline
4. Race conditions

**TODO**

- [x] cookie reuse
- [x] http redirect
- [x] variables  
- [x] Helper Functions (已支持完整的dsl引擎)
- [x] Requests Annotation
- [ ] Unsafe HTTP

## 案例

### gogo中使用

请见: https://chainreactors.github.io/wiki/gogo/extension/#poc



### zombie中使用

请见: https://chainreactors.github.io/wiki/zombie/extension/
