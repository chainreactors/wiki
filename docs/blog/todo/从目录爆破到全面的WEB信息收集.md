

## 前言

之前在 [为什么我们需要收集URL?](https://mp.weixin.qq.com/s?__biz=Mzg4MzgyNTA3NA==&mid=2247483716&idx=1&sn=7d8c322e9880194deabe88543ce52033&chksm=cf40c199f837488f9afff13cf4a6f51a556c63ad95885800717fb6467471518f5a6509a27c27&token=193774039&lang=zh_CN#rd) 发布了两个工具, 分别是用来爆破目录的[spray](https://github.com/chainreactors/spray) 和用来被动收集url的 [urlfounder](https://github.com/chainreactors/urlfounder).  

urlfounder在发布后基本没进行更新,  但是spray经过一年的进化, 迎来了v1.0.0版本. 定位也从一个目录爆破工具变成了全面全能的WEB信息收集工具. 

它拥有目前最强大的性能与最智能的算法. 几乎能覆盖dirsearch + httpx + 指纹识别 + fuff的全部功能.

## 指纹识别的最佳实践


## 改动

spray 经过了36个版本的迭代。 平均每个版本都会有1-3个feature. 不到一年时间, 已经是"面目全非"了. 

spray从社区中接收了大量的提议(大部分都在社交软件上直接沟通了, 后续的项目管理中还是得将其他渠道接受的提议留存一份在issue中).

现在版本号来到了v1.0.1.

### 重点改动

* 默认使用模式变成了信息收集模式, 爆破现在只是spray的一种用法， 而不是全部。
* 极大加强了指纹能力, 指纹能力的详情在前一天的[指纹识别的终极解决方案](todo)中介绍. 
* 重构了输出显示与日志, spray的输出与输入是被诟病最多的地方. 现在这两个点都得到了极大的优化
* 新增了与加强后的neutron引擎的联动, 现在的spray还可以用来探测poc
* 支持了diesearch的绝大部分特性并采用dirsearch的默认字典


## 设计

### UI与交互



#### 更多的输入方式

**从http raw文件读取**

**支持cidr**

**支持port**

### 指纹能力



### 新特性

#### words 更新

#### 支持配置文件

#### 兼容dirsearch字典

#### 其他更新

* 支持socks5/http代理
* 支持自定义HTTP method
* 支持标准输出的json输出
* 优化爬虫的规则、输出、作用域等
* 大量bug修复

## TODO

* 更强大的extract配置, 能能打HaE的效果. 或者说spray实际上是想实现主动版本的HaE+CaA. 
* 与外部漏洞库的联动
* 云提供的功能, 请见: https://github.com/chainreactors/spray/issues/43
* 更丰富的预设， 例如403 bypass, auth bypass, 备份文件发现等

## CRTM



