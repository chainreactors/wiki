# overview

repo: https://github.com/chainreactors/fingers

fingers 是用来各种指纹规则库的go实现, 不同规则库的语法不同, 为了支持在工具多规则库. 于是新增了fingers仓库管理各种不同的规则引擎, 允许不同的输入结构, 但统一输出结构. 并合并输出结果, 最大化指纹识别能力

目前fingers仓库只提供给[spray](https://github.com/chainreactors/spray) 与 [gogo](https://github.com/chainreactors/gogo)使用, 后续将移植到更多工具中, 也欢迎其他工具使用本仓库. 

## 指纹库

### 内置指纹库语法

指纹库位于: https://github.com/chainreactors/templates/tree/master/fingers

https://github.com/chainreactors/fingers/tree/master/fingers 为其规则库的go语言实现.

指纹分为tcp指纹、http指纹

tcp指纹与http指纹为同一格式, 但通过不同的文件进行管理

!!! example "Features."
    *  支持多种方式规则配置
        *  支持多种方式的版本号匹配
        *  404/favicon/waf/cdn/供应链指纹识别
        *  主动指纹识别
        *  超强性能, 采用了缓存,正则预编译,默认端口,优先级等等算法提高引擎性能
        *  重点指纹,指纹来源与tag标记

### 完整的配置
配置文件: `v2/templates/http/*` 与 `v2/templates/tcpfingers.yaml`

一个完整的配置:
```yaml
- name: frame   # 指纹名字, 匹配到的时候输出的值
  default_port: # 指纹的默认端口, 加速匹配. tcp指纹如果匹配到第一个就会结束指纹匹配, http则会继续匹配, 所以默认端口对http没有特殊优化
    - '1111'
  protocol: http  # tcp/http, 默认为http
  rule:
   - version: v1.1.1 # 可不填, 默认为空, 表示无具体版本
     regexps: # 匹配的方式
        vuln: # 匹配到vuln的正则, 如果匹配到, 会输出framework为name的同时, 还会添加vuln为vuln的漏洞信息
          - version:(.*) # vuln只支持正则,  同时支持版本号匹配, 使用括号的正则分组. 只支持第一组
        regexp: # 匹配指纹正则
          - "finger.*test" 
       # 除了正则, 还支持其他类型的匹配, 包括以下方式
        header: # 仅http协议可用, 匹配header中包含的数据
          - string
        body: # 包含匹配, 非正则表达式
          - string
        md5: # 匹配body的md5hash
          - [md5]
        mmh3: # 匹配body的mmh3hash
          - [mmh3]
          
        # 只有上面规则中的至少一条命中才会执行version
        version: 
          - version:(.*)  # 某些情况下难以同时编写指纹的正则与关于版本的正则, 可以特地为version写一条正则

     favicon: # favicon的hash值, 仅http生效
        md5:
          - f7e3d97f404e71d302b3239eef48d5f2
        mmh3:
          - '516963061'
     level: 1      # 0代表不需要主动发包, 1代表需要额外主动发起请求. 如果当前level为0则不会发送数据, 但是依旧会进行被动的指纹匹配.
     send_data: "info\n" # 匹配指纹需要主动发送的数据
     vuln: frame_unauthorized # 如果regexps中的vuln命中, 则会输出漏洞名称. 某些漏洞也可以通过匹配关键字识别, 因此一些简单的poc使用指纹的方式实现, 复杂的poc请使用-e下的nuclei yaml配置

```

为了压缩体积, 没有特别指定的参数可以留空会使用默认值。

在两个配置文件中包含大量案例可供参考。

但实际上大部分字段都不需要配置, 仅作为特殊情况下的能力储备。

每个指纹都可以有多个rule, 每个rule中都有一个regexps, 每个regexps有多条不同种类的字符串/正则/hash

### wappalyzer

https://github.com/chainreactors/fingers/tree/master/wappalyzer 为wappalyzer指纹库的实现, 核心代码fork自 https://github.com/projectdiscovery/wappalyzergo , 将其输出结果统一为frameworks.

后续将会提供每周更新的github action, 规则库只做同步. 

### fingerprinthub

规则库本体位于: https://github.com/0x727/FingerprintHub

https://github.com/chainreactors/fingers/tree/master/fingerprinthub 为其规则库的go实现. 本仓库的此规则库只做同步.

后续将会提供每周更新的github action, 规则库只做同步. 

### ehole

规则库本体位于: https://github.com/EdgeSecurityTeam/EHole

https://github.com/chainreactors/fingers/tree/master/ehole 为其规则库的go实现. 本仓库的此规则库只做同步.



### goby

规则库本体来自社区的开源逆向[goby](https://gobies.org/) Thanks @XiaoliChan @9bie .

https://github.com/chainreactors/fingers/tree/master/goby 为其规则库的go实现. 本仓库的此规则库只做同步.

## fingers sdk

调用内置所有进行指纹引擎识别, 示例:

```golang

func TestNewEngine(t *testing.T) {
	engine, err := NewEngine()
	if err != nil {
		panic(err)
	}
	resp, err := http.Get("https://baidu.com")
	if err != nil {
		return
	}
	frames, err := engine.DetectResponse(resp)
	if err != nil {
		return
	}
	fmt.Println(frames)
}
```

调用SDK识别Favicon指纹, 示例:

```golang
func TestFavicon(t *testing.T) {
	engine, err := NewEngine()
	if err != nil {
		panic(err)
	}
	resp, err := http.Get("http://81.70.40.202:8080/favicon.ico")
	if err != nil {
		return
	}
	content := common.ReadRaw(resp)
	_, body, _ := common.SplitContent(content)
	frames := engine.HashContentMatch(body)
	fmt.Println(frames)
}
```

