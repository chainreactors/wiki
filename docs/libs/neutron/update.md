---
title: neutron · 更新日志
---

## update log

### 2024.3.1 (gogo-v2.12.0 zombie-v1.1.1)

* 适配新的nuclei, 将http相关templates字段`requests` 替换为`http`
* 在各个模块中支持dsl(在不影响兼容性与二进制体积的情况下实现), 包括match、extractor、payload、path、header、raw等位置均已支持
* 新增新的payloads传入方式，可以在编译后动态修改payloads
* 修复多个bug，可能导致崩溃，错误输出等
* 移除chainreactors/utils依赖， 现在neutron的依赖更加少了，欢迎移植到其他工具中使用
* 在info字段下新增zombie属性, 可以使用neutron template在zombie中动态注册插件实现爆破功能