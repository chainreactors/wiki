---
title: spray · 细节
---

## 智能过滤

每接收到一个目标, 创建任务并初始化, 在初始化阶段, 实际上会做两件事. 首先访问index页面, 查看连通性以及获取index的baseline.

然后再生成一个随机目录, 获取随机目录的baseline.

初始化完成之后, 将会保存这两个baseline, 这两个baseline就是后续一切智能过滤与高级过滤的基石.

### 实现逻辑

智能过滤较为复杂, 我只能简单描述一下逻辑, 具体的请看代码.

智能过滤依赖一些经验公式, 内置的经验公式为最小状态, 可以自行通过命令行进行修改.

```
WhiteStatus = []int{200}
BlackStatus = []int{400, 404 410}
FuzzyStatus = []int{403, 404, 500, 501, 502, 503}
WAFStatus   = []int{493, 418}
```

修改对应列表的命令行参数为`--white-status`, `--black-status`, `--fuzzy-status`, `--waf-status`.

智能过滤分为三个阶段. 

在开始之前, 会进行基础信息的收集, 会发送一个随机目录(random_baseline)与根目录(index_baseline)的请求, 不论这两个请求的返回结果是什么, 保存这两个请求的详细信息.

收集到这些信息之后, 才会开始目录爆破. 

**第一个阶段为预过滤**:

1. 如果请求的状态码为200, 则跳过预过滤.
2. 如果请求的状态码包含BlackStatus与WAFStatus中的几个状态码, 则被过滤.
3. 过滤重复30x请求, redirect的目的地与random_baseline的redirect相同, 则被过滤
4. 如果请求的状态码与random_baseline的状态码相同, 则被过滤

预过滤主要为了提高性能, 第二与第三阶段会用到大量正则匹配, hash计算之类的操作. 在TPS达到几千几万的时候导致CPU占用过高.  必需在进行复杂处理之前, 将一些必定无效的数据过滤掉.

被过滤的结果可以使用`--debug`查看, 其中的reason字段表示被过滤的原因, 可以帮助人工调整过滤策略.

**第二阶段为标准过滤**:

通过预过滤的请求会执行一次详细的信息收集, 包括被动指纹识别, hash计算等工作.

1. 如果是FuzzyStatus中的几个状态码, 第一次出现该状态码将会被添加到baseline列表中, 用来给之后的相同状态码当作baseline.
2. 选择对应状态码的baseline, 如果不存在则使用index_baseline
3. 根据的页面的body长度绝对值小于path与MD5值进行对比, 如果均不同则进入到4中
4. 判断页面中是否存在path, 很多情况下, 输入的path会被重新拼接到body中. 如果存在path则认为是无效数据.

如果通过了上面这几个步骤, 则进入下一步.

**第三阶段为模糊过滤**, 这一阶段还在探索中, 可能存在误判漏判, 因此提供了--fuzzy-file参数将这一阶段被过滤的结果单独输出到一个文件中做人工分析.

1. 将会对比对应baseline的simhash, 如果simhash的阈值小于5, 则认为是相似页面, 被过滤. 可通过`--simhash-threshold`参数进行修改.

!!! question "为什么不对所有的状态码使用模糊过滤?"
	假设某个网站正常情况下返回的是200, 但所有的api都会返回405, 如果将405加到fuzzy状态码列表中, 那么所有的api都会被过滤了. 所以, spray只对我们认为的大概率无用的状态码进行了额外的fuzzy过滤, 其他状态码只会和index的状态码进行compare. 


目前只有这一个步骤, 还有其他模糊过滤的思路可以一起交流.

当然, 使用spray并不需要了解每一个细节, 如果输出的结果不符合预期, 可以打开`--debug`查看被过滤的原因, 如果认为存在不合理的过滤, 请提交issue.

## Baseline

baseline既是spray的输出的结构体, 也是实现各种过滤策略与高级功能的基石.

??? note "baseline结构体"
    ```
    type Baseline struct {
        Number       int        `json:"number"`
        Url          *url.URL   `json:"-"`
        UrlString    string     `json:"url"`
        Path         string     `json:"path"`
        Host         string     `json:"host"`
        Body         []byte     `json:"-"`
        BodyLength   int        `json:"body_length"`
        Header       []byte     `json:"-"`
        Raw          []byte     `json:"-"`
        HeaderLength int        `json:"header_length"`
        RedirectURL  string     `json:"redirect_url,omitempty"`
        FrontURL     string     `json:"front_url,omitempty"`
        Status       int        `json:"status"`
        Spended      int64      `json:"spend"` // 耗时, 毫秒
        Title        string     `json:"title"`
        Frameworks   Frameworks `json:"frameworks"`
        Extracteds   Extracteds `json:"extracts"`
        ErrString    string     `json:"error"`
        Reason       string     `json:"reason"`
        IsValid      bool       `json:"valid"`
        IsFuzzy      bool       `json:"fuzzy"`
        URLs         []string   `json:"urls"`
        Source       int        `json:"source"`
        RecuDepth    int        `json:"-"`
        ReqDepth     int        `json:"depth"`
        Recu         bool       `json:"-"`
        *parsers.Hashes
    }
    ```

??? note "Framework 结构体"
    ```
    type Framework struct {
        Name    string       `json:"name"`
        Version string       `json:"version,omitempty"`
        From    int          `json:"-"`
        Froms   map[int]bool `json:"froms,omitempty"`
        Tags    []string     `json:"tags,omitempty"`
        IsFocus bool         `json:"is_focus,omitempty"`
        Data    string       `json:"-"`
    }
    ```
    
??? note "Extracted 结构体"
    ```
    type Extracted struct {
        Name          string   `json:"name"`
        ExtractResult []string `json:"extract_result"`
    }
    ```

??? note "Hashes 结构体"
    ```
    type Hashes struct {
        BodyMd5       string `json:"body-md5"`
        HeaderMd5     string `json:"header-md5"`
        RawMd5        string `json:"raw-md5"`
        BodySimhash   string `json:"body-simhash"`
        HeaderSimhash string `json:"header-simhash"`
        RawSimhash    string `json:"raw-simhash"`
        BodyMmh3      string `json:"body-mmh3"`
    }
    ```

这几个结构体将作为自定义过滤器的关键

