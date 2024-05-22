(gogo 在上周有一个较大的更新: https://github.com/chainreactors/gogo/releases/tag/v2.10.2, 但随后我就阳了, 因此后续相关介绍拖到了这周)



本文主要描述gogo中关于指纹的配置与拓展

## 前言

gogo的绝大部分拓展能力都整合到了 gogo-templates中, 见 https://github.com/chainreactors/gogo-templates

 README中有了大致的介绍与使用方法.

插件编写文件: https://github.com/chainreactors/gogo/blob/master/doc/plugin%E7%BC%96%E5%86%99.md

从nuclei中移植poc文档: https://github.com/chainreactors/gogo/blob/master/doc/poc%E7%BC%96%E5%86%99.md

gogo的几乎每一处功能都经过反复的打磨, 整合了实战中积累的大量经验.

## 编写指纹相关插件

### http指纹插件

一个完整的gogo指纹插件配置如下:

![image-20221216184315339](D:\Programing\blog\chainreactors\拓展gogo的能力.assets\image-20221216184315339.png)

但实际上大部分字段都不需要配置, 仅作为特殊情况下的能力储备.

每个指纹都可以有多个rule, 每个rule中都有一个regexps, 每个regexps有多条不同种类的字符串/正则/hash



**案例1**

在大多数情况下只需要匹配body中的内容。一个指纹插件最简配置可以简化为如下所示:

```
- name: tomcat
  rule:
    - regexps:
        body:
          - Apache Tomcat
```

这里的body为简单的strings.Contains函数, 判断http的body中是否存在某个字符串.



gogo中所有的指纹匹配都会忽略大小写. 

**案例2**

而如果要提取版本号, 配置也不会复杂多少.

```
- name: tomcat
  rule:
    - regexps:
        regexp:
          - <h3>Apache Tomcat/(.*)</h3>
          - <title>Apache Tomcat/(.*)</title>
```



**案例3**

但是有些情况下, 版本号前后并没有可以用来匹配的关键字. 可以采用version字段去指定版本号.

例如:

```
- name: tomcat
  rule:
    - version: v8
      regexps:
        body:
          - <h3>Apache Tomcat/8</h3>
```

这样一来, 只需要匹配到特定的body, 在结果中也会出现版本号.

`[+] https://1.1.1.1:443                 tomcat:v8 [200] Apache Tomcat/8.5.56 `



**案例4**

而一些更为特殊的情况, 版本号与指纹不在同一处出现, 且版本号较多, 这样为一个指纹写十几条规则是很麻烦的事情, gogo也提供了便捷的方法.

看下面例子:

```
- name: tomcat
  rule:
    - regexps:
        regexp:
          - <h3>Apache Tomcat/8</h3>
       	version:
       	  - Tomcat/(.*)</h3>
```

可以通过regexps中的version规则去匹配精确的版本号. version正则, 将会在其他匹配生效后起作用, 如果其他规则命中了指纹, 且没发现版本号时, 就会使用version正则去提取.

这些提取版本号的方式可以按需使用, 大多数情况下前面两种即可解决99%的问题.第三种以备不时之需.



**案例5**

假设情况再特殊一点, 例如需要通过主动发包命中某个路由,且匹配到某些结果. 一个很经典的例子就是nacos. 直接访问是像tomcat 404页面, 且header中无明显特征, 需要带上/nacos路径去访问才能获取对应的指纹.

看gogo中nacos指纹的配置

```
- name: nacos
  focus: true
  rule:
    - regexps:
        body:
          - console-ui/public/img/favicon.ico
      send_data: /nacos
```

其中, send_data为主动发包发送的url, 在tcp指纹中则为socket发送的数据. 

当`http://127.0.0.1/nacos`中存在`console-ui/public/img/favicon.ico`字符串, 则判断为命中指纹. 

这个send_data可以在每个rule中配置一个, 也就是说, 假设某个框架不同版本需要主动发包的url不同, 也可以通过一个插件解决. 

这里还看到了focus字段, 这个字段是用来标记一些重点指纹, 默认添加了一下存在常见漏洞的指纹, 也可以根据自己的0day库自行配置.  在输出时也会带有focus字样, 可以通过`--filter focus` 过滤出所有重要指纹.



**案例6**

而还有情况下, 某些漏洞或信息会直接的以被动的形式被发现, 不需要额外发包. 所以还添加了一个漏洞指纹的功能.

例如gogo中真实配置的tomcat指纹为例:

```
- name: tomcat
  rule:
    - regexps:
        vuln:
          - Directory Listing For
        regexp:
          - <h3>Apache Tomcat/(.*)</h3>
          - <title>Apache Tomcat/(.*)</title>
        header:
          - Apache-Coyote
      favicon:
        md5:
          - 4644f2d45601037b8423d45e13194c93
      info: tomcat Directory traversal
```

regexps中配置了, vuln字段, 这个字典如果命中, 则同时给目标添加上vuln输出, 也就是使用gogo经常看到的输出的末尾会添加`[ info: tomcat Directory traversa]` 

这里也有两种选择, info/vuln, info为信息泄露, vuln为漏洞. 当填写的是vuln, 则输出会改成`[ high: tomcat Directory traversa]` 

这里还有个favicon的配置, favicon支持mmh3或md5, 可以配置多条.



需要注意的是`favicon`与`send_data`字段都只用在命令行开启了`-v`(主动指纹识别)模式下, 才会生效.  且每个指纹, 只要命中了一条规则就会退出, 不会做重复无效匹配. 





### TCP指纹插件

在gogo中的tcp指纹插件并不多, 加起来也只有20条左右. 

在gogo的早期开发中, 一度想过将nmap的指纹全量移植, 但在实践中发现, server指纹有大量主动发包的行为, 并且绝大多数server实战中就算扫到了也没有漏洞去攻击. 为此, 我们想到了一种不需要扫描的指纹识别方式.

也就是经常在gogo中看到了指纹中的guess字段.

![image-20221216190051343](D:\Programing\blog\chainreactors\拓展gogo的能力.assets\image-20221216190051343.png)

这个字段代表, 该指纹是从默认端口配置中猜测的, 而实际上, 需要主动发包扫描的大多数服务也不会更换默认端口. 在经过半年的体验以及一些微小的调整后, 我们认为目前的tcp指纹已经能覆盖99%的渗透测试场景. 如果有必要添加新的tcp指纹, 欢迎提交issue.



以这个rdp服务为例学习gogo中如何编写一个tcp指纹.

```
- name: rdp
  default_port:
    - rdp
  protocol: tcp
  rule:
    - regexps:
        regexp:
          - "^\x03\0\0"
      send_data: b64de|AwAAKiXgAAAAAABDb29raWU6IG1zdHNoYXNoPW5tYXANCgEACAADAAAA
```

指纹的`default_port`可以使用port.yaml中的配置.

port.yaml中的rdp:

```
- name: rdp
  ports:
    - '3389'
    - '13389'
    - '33899'
    - "33389"
```

非常方便的配置guess规则.



另外, rdp服务需要主动发包才能获取到待匹配的数据, 因此, 还需要配置send_data. 

而为了方便在yaml中配置二进制的发包数据, gogo添加了一些简单的装饰器. 分别为:

* b64en , base64编码
* b64de , base64解码
* hex, hex编码
* unhex, hex解码
* md5, 计算md5

在数据的开头添加`b64de|` 即可生效. 如果没有添加任何装饰器, 数据将以原样发送. 需要注意的是yaml解析后的二进制数据可能不是你看到的, **强烈建议二进制数据都使用base64或hex编码后使用**.



这条rdp实际上也是从nmap中移植的, nmap的指纹仓库在这里: https://github.com/nmap/nmap/blob/master/nmap-service-probes

如果熟悉nmap的指纹, 移植指纹并不是一件困难的事情, 甚至也已经有了完全移植nmap指纹库的项目, 不过gogo的tcp指纹(特别是需要主动发包的指纹)未来还是会保持在最小可用状态, 除非必要, 不会添加一些用不到的指纹. 



## 2.10.*新特性

### 指纹来源

之前提到过只有开启了`-v` 的情况下, 才会开启favicon识别与主动指纹探测. 

而不同渠道的指纹来源在老版本会显示多条指纹, 在2.10.*上将会合并显示, 空格分割. 并使用-j重复扫描的时候不会再次添加重复的指纹了. 

当前所有类型的指纹来源包括:

1. finger  被动匹配
2. active 主动探测
3. ico   favicon探测
4. 404 随机目录
5. guess 默认端口猜测(仅限tcp指纹)

并在2.10.0上添加了用来过滤指纹来源的api. 

`gogo -F 1.dat --filter from==active`

`gogo -F 1.dat --filter from!=guess`

###  指纹tag

在最近更新的2.10.0版本中, 添加了framework 的tag, 用来标记指纹的类型, 方便后续的过滤, 归类处理. 特别是对waf/cdn的识别与过滤.

默认的tag是https://github.com/chainreactors/gogo-templates/tree/master/fingers/http 目录下的文件名. 例如`waf.yaml`中的所有指纹都会被自动添加上waf的tag. 也可以在指纹中手动配置不同的tag. 

```
- name: tomcat
  tag: 
    - java
    - tomcat
  rule:
    - regexps:
        regexp:
          - <h3>Apache Tomcat/(.*)</h3>
          - <title>Apache Tomcat/(.*)</title>
```



并添加了对应的过滤条件. 

`gogo -F 1.dat --filter tag==java` 

以及`gogo -F 1.dat --filter tag!=waf`

## 小结

gogo的指纹识别并不单单只有指纹识别. 还包含着各种方便的特性.

1. 支持多种规则配置
2. 支持多种方式的版本号匹配
3. 404/favicon/waf指纹识别
4. 主动指纹识别
5. 默认端口优化
6. 正则预编译
7. 重点指纹标记
8. 指纹来源标记
9. 指纹tag
10. 指纹与poc的联动(将会在后续的文章中讲解)

## 结语

当你环顾四周, 发现没有工具能解决你的问题时候, 不妨来看看gogo. 

我们同样从最简单的一把梭工具走来,  gogo也永远保留一把梭的用法. 但现实情况不是所有的场景都能一把梭， 为此gogo也保留了面向各种复杂场景的解决方案, 可以用不到, 但一定会有.

后续的一系列工具也会是类似的设计.。

