---
title: neutron · 更新日志
---

## update log

### 2024.3.1 (gogo v2.12.0 zombie v1.1.1)

* 适配新的nuclei, 将http相关templates字段`requests` 替换为`http`
* 在各个模块中支持dsl(在不影响兼容性与二进制体积的情况下实现), 包括match、extractor、payload、path、header、raw等位置均已支持
* 新增新的payloads传入方式，可以在编译后动态修改payloads
* 修复多个bug，可能导致崩溃，错误输出等
* 移除chainreactors/utils依赖， 现在neutron的依赖更加少了，欢迎移植到其他工具中使用
* 在info字段下新增zombie属性, 可以使用neutron template在zombie中动态注册插件实现爆破功能

### 2024.6.26

进一步兼容nuclei的dsl

* 支持variables功能
* 支持randstr变量与duration变量

### 2024.7.16 （gogo v2.13.2, zombie v1.2.0）

现在nuclei的绝大部分poc都不需要修改就能在neutron中正常运行

* 修复一个重大bug， 该bug导致每个template只能被使用一次。见： https://github.com/chainreactors/neutron/issues/4

* 实现解析annotation, 使得存在annotation的yaml也不会报错, 实现了timeout annotation

* 更优雅的实现randstr与randnum

* 支持DN相关变量 @XiaoliChan

* 实现yaml反序列化保留map顺序, 可以通过编译tag json兼容go1.11

* dsl新增`generate_shiro_gadget`  @XiaoliChan

* 解决潜在的conn泄露问题 @XiaoliChan

  