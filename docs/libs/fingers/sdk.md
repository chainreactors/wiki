## Engine

### 初始化

fingers 提供了一个预设配置的初始化API `NewEngine`, 提供初始化所有支持的引擎. 

```
func NewEngine(engines ...string) (*Engine, error)
```

如果engines为空则初始化所有引擎. 也可以选择自己需要的engine进行初始化.

```
FaviconEngine     = "favicon"
FingersEngine     = "fingers"
FingerPrintEngine = "fingerprinthub"
WappalyzerEngine  = "wappalyzer"
EHoleEngine       = "ehole"
GobyEngine        = "goby"
```

```
need := []string{FingersEngine, FingerPrintEngine}
engine, err := NewEngine(need...)
if err != nil {
    panic(err)
}
```

### 指纹匹配

#### DetectResponse

通过http.Response匹配

调用所有的指纹引擎对指定目标的返回结果进行匹配

```golang
func TestEngine(t *testing.T) {
    engine, err := NewEngine()
    if err != nil {
       panic(err)
    }
    resp, err := http.Get("http://127.0.0.1:8080/")
    if err != nil {
       return
    }
    frames, err := engine.DetectResponse(resp)
    if err != nil {
       return
    }
    fmt.Println(frames.String())
}
```

#### DetectResponse

通过[]bytes匹配

如果已经进行过读取, 也可以使用`DetectContent(content []bytes)`代替`DetectResponse`

```
func TestEngine(t *testing.T) {
    engine, err := NewEngine()
    if err != nil {
       panic(err)
    }
    resp, err := http.Get("http://127.0.0.1:8080/")
    if err != nil {
       return
    }
	content := httputils.ReadRaw(resp)
	frames, err := engine.DetectContent(content)
	if err != nil {
		return
	}
    fmt.Println(frames.String())
}
```

### DetectFavicon

因为favicon检测需要特殊的目录, 与其他指纹匹配传入的数据不同.

因此Engine提供了单独的`DetectFavicon` api

调用Favicon引擎对图标进行匹配:

```golang
func TestFavicon(t *testing.T) {
	engine, err := NewEngine()
	if err != nil {
		panic(err)
	}
	resp, err := http.Get("http://baidu.com/favicon.ico")
	if err != nil {
		return
	}
	content := httputils.ReadRaw(resp)
	body, _, _ := httputils.SplitHttpRaw(content)
	frame := engine.DetectFavicon(body)
    fmt.Println(frame.String())
}
```

### Match

`Match`是`DetectResponse`和`DetectContent`实际调用的接口, 区别在于`DetectContent`与`DetectResponse` 提供了一些性能优化与校验. 

Match只能接受`*http.Response`也意味着只接受合法的http返回值作为输入. 因为部分指纹引擎会有header, cookie相关的匹配part. 

```golang
func TestEngine_Match(t *testing.T) {
	engine, err := NewEngine()
	if err != nil {
		panic(err)
	}
	resp, err := http.Get("http://127.0.0.1:8089")
	if err != nil {
		panic(err)
	}
	frames := engine.Match(resp)
	fmt.Println(frames.String())
}
```

### MatchWithEngines

指定引擎名字, 调用特定的Match

```golang
func TestEngine_MatchWithEngines(t *testing.T) {
	engine, err := NewEngine()
	if err != nil {
		t.Error(err)
	}
	resp, err := http.Get("http://127.0.0.1")
	if err != nil {
		return
	}

	need := []string{FingersEngine, FingerPrintEngine}
	frames := engine.MatchWithEngines(resp, need...)
	for _, frame := range frames {
		t.Log(frame)
	}
}
```

### Disable

关闭特定引擎

`engine.Disable("ehole")`

### Enable

开启已经注册的引擎, 初始化的时候会自动Enable.

`engine.Enable("ehole")`

## 自定义引擎

### Impl

fingers中的引擎必须要实现这四个接口才能注册到Engine中
```
type EngineImpl interface {
	Name() string
	Compile() error
	Len() int
	Match(content []byte) common.Frameworks
}
```

### 动态注册

实现了EngineImpl接口的struct将可以被注册到Engine中. 例如

```
func RegisterCustomEngine(engine *fingers.Engine) error {
    customEngine, err := NewCustomEngine()
    if err != nil {
       return err
    }
    engine.Register(customEngine)
    return nil
}
```

### 单指纹库调用

初始化单个指纹库并调用:

```golang
func TestFingersEngine(t *testing.T) {
	engine, err := fingers.NewFingersEngine()
	if err != nil {
		t.Error(err)
	}
	resp, err := http.Get("http://127.0.0.1")
	if err != nil {
		return
	}

	content := httputils.ReadRaw(resp)
	frames := engine.Match(content)
	for _, frame := range frames {
		t.Log(frame)
	}
}

```

## Alias

多指纹库可能会出现同一个指纹在不同指纹库中存在不同命名的情况. 为了解决这个问题, 实现`alias`转换, 能让不同指纹库中的别名以统一的方式展示, 并且固定product与vendor, 能让没有实现CPE相关功能的指纹库也能支持CPE。

### Alias

`alias.yaml`在 https://github.com/chainreactors/fingers/blob/master/alias/aliases.yaml   中配置.

定义:

```
type Alias struct {
	Name           string `json:"name" yaml:"name"`
	normalizedName string
	Vendor         string              `json:"vendor" yaml:"vendor"`
	Product        string              `json:"product" yaml:"product"`
	Version        string              `json:"version,omitempty" yaml:"version"`
	Update         string              `json:"update,omitempty" yaml:"update"`
	Edition        string              `json:"edition,omitempty" yaml:"edition"`
	AliasMap       map[string][]string `json:"alias" yaml:"alias"`
	Block          []string            `json:"block,omitempty" yaml:"block"`
	blocked        map[string]bool
}
```

具体配置以用友NC为例.

```
- name: 用友 NC      # 对外展示的名字
  vendor: yonyou    # 厂商, 对应到CPE的vendor
  product: NC		# 产品名, 对应到CPE的product
  alias:            # 别名
    fingers:        # 指纹库名
      - 用友NC       # 对应指纹库中的名字
    ehole:			
      - 用友NC	   # 可以是多个别名
      - YONYOU NC
    goby:
      - UFIDA NC
    fingerprinthub:
      - yonyou-ufida-nc
```

默认在`NewEngine`时, 会通过内嵌的aliases.yaml 初始化. 并加载原生指纹库fingers的数据作为基准值. 

#### Block

配置了alias的映射后, 可以通过block来解决一些误报问题. 

以下配置表示: 如果goby识别到了`UFIDA NC`, 并且配置了block goby, 则这个结构不会合并到最终结果中. 

```
- name: 用友 NC     
  vendor: yonyou    
  product: NC		
  block:
  	- goby # 需要屏蔽的engine
  alias:            
    fingers:        
      - 用友NC       
    ehole:			
      - 用友NC
      - YONYOU NC
    goby:
      - UFIDA NC
    fingerprinthub:
      - yonyou-ufida-nc
```

### 初始化

Aliases初始化时将会进行一些性能优化的与功能特性. 

标准化所有指纹库的Name, 会进行以下操作

* 中文转拼音
* 大写转小写
* 忽略`_`, `-`, `[blank]`

添加指纹Name索引, 用来后续Find时加速等操作.

**默认情况下, 未特别配置到aliases.yaml的指纹, 将以`fingers`的原生指纹库作为基准值**

#### NewAliases

alias提供了NewAliases, 将会使用`resources.AliasesData`的数据反序列化为`[]*Alias` 

```
func NewAliases(origin ...*Alias) (*Aliases, error) {
	var aliases []*Alias
	err := yaml.Unmarshal(resources.AliasesData, &aliases)
	if err != nil {
		return nil, err
	}
	aliasMap := &Aliases{
		Aliases: make(map[string]*Alias, len(aliases)+len(origin)),
		Map:     make(map[string]map[string]string),
	}

	err = aliasMap.Compile(append(origin, aliases...)) // yaml的优先级高于origin
	if err != nil {
		return nil, err
	}
	return aliasMap, nil
}
```

其中origin用来提供原先已经加载的alias配置. 例如在NewEngine中, 将会将`fingers`作为alias的基准值. 

```
	// 将fingers指纹库的数据作为未配置alias的基准值
	var aliases []*alias.Alias
	if impl := engine.Fingers(); impl != nil {
		for _, finger := range impl.HTTPFingers {
			aliases = append(aliases, &alias.Alias{
				Name:    finger.Name,
				Vendor:  finger.Vendor,
				Product: finger.Product,
				AliasMap: map[string][]string{
					"fingers": []string{finger.Name},
				},
			})
		}
	}

	var err error
	engine.Aliases, err = alias.NewAliases(aliases...)
	if err != nil {
		return err
	}
```

#### AppendAliases

alias提供了接口用来追加用户自定义的别名配置.  

```
func (as *Aliases) AppendAliases(other []*Alias) {
	err := as.Compile(other)
	if err != nil {
		return
	}
}
```

**需要注意的是, 追加的Alias中如果存在同名, 将会覆盖已有的配置.** 

内置的NewEngine的顺序为. 

1. fingers生成的别名
2. aliases.yaml 配置
3. 用户自定义加载的配置

越早加载的配置会被后续的加载的配置覆盖, 因此如果存在同名, 那么用户加载的配置是最高的优先级. 

### Find

#### FindFramework

通过获取到的Framework获得统一的指纹命名.

```
func (as *Aliases) FindFramework(frame *common.Framework) (*Alias, bool) 
```

#### FindAny

通过name查找是否存在统一命名

```
func (as *Aliases) FindAny(name string) (string, *Alias, bool)
```

#### Find 

`FindAny`与`FindFramework`的底层接口

查找Aliases中是否已经配置了指定指纹库中的别名

```
func (as *Aliases) Find(engine, name string) (*Alias, bool)
```

## Framework

Engine的各种Detect或者Match的返回结果要么是`Frameworks`要么是`Framework`.

`Framework`就是fingers中的指纹标准输出格式. 它提供了到CPE标准的转换. 也提供了一些特殊的特性. 

* 支持重点关注指纹标记
* 支持自定义tag
* 支持保留指纹来源
* 支持导出到通用指纹格式

Framework定义:

```
type Framework struct {
    Name        string        `json:"name"`
    From        From          `json:"-"` // 指纹可能会有多个来源, 指纹合并时会将多个来源记录到froms中
    Froms       map[From]bool `json:"froms,omitempty"`
    Tags        []string      `json:"tags,omitempty"`
    IsFocus     bool          `json:"is_focus,omitempty"`
    *Attributes `json:"attributes,omitempty"`
}
```

Attributes即NVD定义的WFN所需要的属性. 
```
type Attributes struct {
	Part      string `json:"part" yaml:"part"`
	Vendor    string `json:"vendor" yaml:"vendor"`
	Product   string `json:"product" yaml:"product"`
	Version   string `json:"version,omitempty" yaml:"version,omitempty"`
	Update    string `json:"update,omitempty" yaml:"update,omitempty"`
	Edition   string `json:"edition,omitempty" yaml:"edition,omitempty"`
	SWEdition string `json:"sw_edition,omitempty" yaml:"sw_edition,omitempty"`
	TargetSW  string `json:"target_sw,omitempty" yaml:"target_sw,omitempty"`
	TargetHW  string `json:"target_hw,omitempty" yaml:"target_hw,omitempty"`
	Other     string `json:"other,omitempty" yaml:"other,omitempty"`
	Language  string `json:"language,omitempty" yaml:"language,omitempty"`
}
```

Framework的大部分api都是基础操作, 请直接参阅代码. 

### 输出

Framework的String()操作将会输出一个预置的格式.  尽可能简单的包含所有信息的输出, 但我也认为它并不是非常美观.

`tomcat:8.5.81:(goby fingers fingerprinthub)`

如果有需要, 可以自己实现一个格式化的函数

### From

指纹来源保留

需要注意的是指纹来源这一部分.  定义了目前内置的各种来源的可能性.  类型为int

```
type From int

const (
	FrameFromDefault From = iota
	FrameFromACTIVE
	FrameFromICO
	FrameFromNOTFOUND
	FrameFromGUESS
	FrameFromRedirect
	FrameFromFingers
	FrameFromFingerprintHub
	FrameFromWappalyzer
	FrameFromEhole
	FrameFromGoby
)
```

1-5是gogo内置的指纹来源, 包括了强制赋予, 主动识别, 图标, 404页面, 猜测, 重定向. 

6-10是第三方指纹引擎的数据.

建议使用时通过枚举值去定义. 

如果自定义指纹库想保留来源, 需要找一个自己喜欢的数字, 例如`666`, 然后将其注册到`FrameFromMap`中

```
var FrameFromMap = map[From]string{
	FrameFromDefault:        "default",
	FrameFromACTIVE:         "active",
	FrameFromICO:            "ico",
	FrameFromNOTFOUND:       "404",
	FrameFromGUESS:          "guess",
	FrameFromRedirect:       "redirect",
	FrameFromFingers:        "fingers",
	FrameFromFingerprintHub: "fingerprinthub",
	FrameFromWappalyzer:     "wappalyzer",
	FrameFromEhole:          "ehole",
	FrameFromGoby:           "goby",
}
```

自定义指纹引擎的代码中添加
```
var CustomSource = common.From(666)
func init() {
	common.FrameFromMap[CustomSource] = "custom"
}
```

### Frameworks

封装了一些较为通用的操作. 

```
type Frameworks map[string]*Framework
```

请查阅代码.

## MoreFingers

目前不提供公开访问

支持的指纹库

* tanggo
* cube
