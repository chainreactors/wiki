## 几个必备知识


我们的指纹库是 ”or“ 逻辑， 并且不支持 ”and“ 逻辑。 这是为了让指纹规则尽可能简单， 让一个最小的特征成为指纹。 

具体规则见 rule文档， 里面包含了大量例子。 

描述指纹结构的代码见: https://github.com/chainreactors/fingers/blob/master/fingers/fingers.go 

已经添加了jsonschema， 建议使用ai辅助理解。 

**指纹只用来描述匹配规则**。但是对于指纹的辅助属性、分类等相关信息则是通过 alias (最早用来统一多个指纹库的名字)。 

https://github.com/chainreactors/fingers/blob/master/alias/alias.go

alias目前用来解决以下核心问题:

1. 统一多指纹库的名称不统一的情况
2. 过滤指纹
3. 给指纹添加CPE、分类、优先级等信息
4. 作为POC和Fingers 多对多的中间表


## SOP1 通过目标网站添加指纹

当人类在添加一条指纹的时候，会分为以下几个核心步骤。


### 找到核心特征

我们在攻击过程中会有很多目标站点。

一般来说，绝大部分指纹都能找到一段**核心特征**。我们要确保这个核心特征尽可能不会和其他网站的重复。

例如广讯通， 我们就找了一个比较有代表性的特征


```
- name: 广讯通
  focus: true
  rule:
    - regexps:
        body:
          - Services/Identification/login.ashx
```


### 在fofa上确认核心特征是否有效

通过fofa搜索， 校验几个站点， 确认核心特征是否可以找到通类型网站， 并且不太会有误报。



## SOP2 已知系统名称添加指纹

fofa/hunter等已经有大量的系统名称，但是其指纹不公开或者指纹质量不符合预期。 我们需要重新编写指纹。 

### 搜索对应的指纹名称


搜索对应的指纹名称， 可以找到一些网站。 我们需要让AI分析站点的特征， 找到核心特征。 然后编写对应的

1. fingers规则的yaml
2. alias 的yaml， 提供分类和补充信息

### 搜索核心特征反向验证

搜索指纹中的body， 确认fingers是否正确。 


### 通过api 将 校验后的指纹和alias提交到平台

和群里的胡对接下， cyberhub有openapi