---
title: gogo · 细节
---

## 基础扫描
  红队场景中, 利用的漏洞99%都是TCP协议, udp协议一般用作信息收集, 并且udp协议端口一般都是固定的.因此, gogo只专注于TCP协议的端口探测和指纹识别.只对少数几个UDP服务做了特殊支持, 例如nbtcsan.

gogo使用的是go自带的socket库 + net/HTTP库实现的TCP全连接扫描. 在全连接扫描中, 通过端口状态即可获得大量信息, 如果是HTTP协议, 更是能获得全部红队所需要的基本信息.

## 特殊端口
当然, 针对一些特殊端口, 实际上并不需要刚才提到的那些流程. 例如445(SMB)、22(SSH),  几乎不会有其它服务占用这些端口, 因此可以针对性的做一些定制化的扫描.

**SMB**

使用: `-p smb` or `-p 445`

* ntlm信息收集, smb的信息收集略微冷门, 似乎是在这两年才被武器化, 可以通过ntlm认证的前面两个阶段获取到windows详细版本号、dns主机名以及主机名、域名.
* ms17-010探测, 需开启`-e`探测是否存在ms17-010漏洞以及是否已经被种下doublepulsar后门, 通过smb的一些标志位判断, 不是溢出攻击, 因此该漏洞探测不会对目标系统造成损坏.
* smbghost 需开启`-e`, 探测目标是否存在CVE-2019-0796漏洞, 采用了更加准确的方式, 判断特定的标志位.

**NetBOIS**

使用: `-p nbt` or `-p 137`

主要用来收集域名、shared以及是否为DC的信息.似乎还可以收集到一些其他信息, 正在研究中.

需要注意的是, nbt使用的是udp, 高并发的情况下会产生漏报, 建议启发式扫描结束后, 单独对存活ip进行一次nbt扫描, 确保准确率.

**WMI**

使用: `-p wmi`or `-p 135`

wmi默认收集到的信息与smb默认是一样的, 都是通过ntlm协议获取主机名域名与计算机版本号.

**OXID**

使用: `-p oxid`

wmi端口还能获得网卡信息, 寻找内网中的多网卡机器. 使用的是wmi协议, 为了区分wmi, 使用oxid关键字.

**SNMP**

使用: `-p snmp` or `-p 161`

判断是否是路由器、交换机以及获取设备的名称, 此外, snmp中还有一些惊喜, 可能存在内网拓扑信息, 不过需要使用单独的工具, 如snmpwalk.


## 指纹识别

### 被动识别

这里提到的被动指纹识别不是真的不发包, 而是相对来说不额外发包.因为识别HTTP与HTTPs需要发送一个HTTP GET包, 这个包用来判断HTTPs/HTTP/TCP, 同时还可以用作指纹识别.


实际实现的时候, 发现市面上并没有足够强大、全面的指纹库.

写这篇文档的时候,有个足够强大的指纹库了:[HTTPs://github.com/0x727/FingerprintHub](HTTPs://github.com/0x727/FingerprintHub).可惜历史遗留问题直接兼容这个指纹库可能效果不会更好, 所以保留了原有的指纹库, 而且这个指纹库只限于HTTP的各种指纹, 不支持TCP指纹.

也因为这指纹库中的指纹多但是质量并不一定高, 所以选择了筛选部分高价值指纹的方式合并.

还有一个细节, 在指纹识别的时候, 不只是返回识别ture or false的布尔值, 也可以获取一些版本号信息, 例如tomcat 会在报错页面留下版本号, 指纹识别的同时可以提取该信息.gogo也做了对应的优化与快捷实现的方式.

**HTTP指纹**

支持header、body、正则、hash四种匹配方式, 并且对正则进行了预编译.

指纹库来自:

- [HTTPs://github.com/0x727/FingerprintHub](HTTPs://github.com/0x727/FingerprintHub)
- [HTTPs://github.com/TideSec/TideFinger](HTTPs://github.com/TideSec/TideFinger)
- 自行收集的上百个指纹
- fofa/goby指纹
- ...


**TCP指纹**

TCP也有一个经验公式, 大多数TCP端口会开放在默认端口且一个TCP端口通常只有一个服务.因此HTTP协议扫描到一个指纹后不会停止, 而TCP协议会停止指纹识别.

之前也提到了, 我使用的是TCP的socket发送HTTP GET包, 某些情况下一些TCP端口也会返回一些二进制数据, 甚至某些端口建立连接后会主动返回一些信息. 前者例如mysql, 后者例如redis.

如果TCP的精准指纹识别失效, 根据另外一个经验公式, 大多数TCP不会修改默认端口来根据port.yaml中配置的端口号反向猜测服务, 通过这种方式猜测出来的指纹将会带上一个星号.

TCP指纹有一个非常强大的指纹库来自nmap: [HTTPs://raw.githubusercontent.com/nmap/nmap/master/nmap-service-probes](HTTPs://raw.githubusercontent.com/nmap/nmap/master/nmap-service-probes)

因此大部分TCP指纹从nmap中迁移.

由于人力有限只实现了少部分指纹, 有重点指纹需求的可以联系我.


### 主动识别
主动指纹是另外一个维度了, 需要发送合适的数据包, 而且会产生很大的资源负担.为了解决这些问题, 我也做了各种优化.

**HTTP指纹**

HTTP有主动发包有一些通用指纹, 例如favicon.ico.市面上也有一些favicon.ico的hash库并且做成了hash表, 匹配速度极快.favicon.ico的hash主要有md5和mmh3, 目前会同时匹配这两种(为了兼容市面上的指纹库), hash指纹库也是同时维护这两种hash.

其次, 404页面也可能带有一些正常情况下识别不到的指纹.

最后, 特定的带有指纹的特定路由需要通过类似目录爆破的手段进行指纹识别.但这种指纹不宜过多, 每添加一个都会在开启`-v`时对所有HTTP协议的目标发送一个请求.带来的性能损耗是非常巨大的, 所以gogo的原则是非必要不添加, 后续一些主动指纹将会迁移到nuclei poc的方式, 先匹配前置指纹再进行主动发包获取更重要的指纹.以Weblogic为例, 先识别到Weblogic, 再通过nuclei poc去识别console, 而非现在的全部HTTP协议发送`/console`的请求.

此外, 某些URL存在或者某些字段代表着存在漏洞, 为此做了一些特殊处理, 可以在指纹库中配置漏洞指纹, 将会在结果中特殊标记, 目前对Tomcat和Weblogic做了对应的优化, 这一部分后续将会迁移到nuclei poc中.

如果HTTP主动指纹库过大, 耗时可能会特别长, 因此我加入了指纹优先级的概念, 当前默认被动指纹优先级为0, 主动指纹均为1, 预留了大于1的指纹用作大规模目录爆破或者通过js指纹识别, 目前还没有实装.

如果输入的值带host, 例如`gogo -i baidu.com ` 或cert信息中存在数据,  那么在开启`-v`时将会额外添加一个阶段, 将会带上host去请求, 并对比与基础数据是否存在不同. 如果host扫描的结果发现新的数据, 那么nuclei poc扫描阶段将会带上host.

小结:

- favicon 指纹
- 目录爆破识别指纹
- 404指纹(todo)
- host指纹

**TCP指纹**

TCP的主动指纹也是另一个维度.刚才提到了TCP的经验公式, 那么使用这个经验公式, 在主动识别阶段也可以进行一些优化.

大部分TCP端口需要主动发包, 根据这个经验, 可以做一些优化, 优先发送默认端口的探测数据包,  如果匹配到了任意一个指纹, 就不进行后续发包.

主动发包的TCP指纹库主要也来自nmap.

**使用**

被动指纹将会自动启用, 不需要添加参数, 而使用主动探测的指纹需要添加`-v`参数


## 漏洞探测
使用: `-e`

一些漏洞探测使用go的形式实现, 例如ms17-010, shiro.smbghost, snmp的探测.原因是这些需要多次交互或者动态生成一些参数, 而大部分poc则使用了nuclei.

最初   至可以直接从burp中复制包就可以完成一个poc的编写.


自行开发的插件可以使用`gogo -ef file`加载插件文件

扫描的时候, 打全量poc是一件很蠢的行为, 因此`-e`参数实际上是等于`-E auto`, 也就是设置成自动漏扫模式, 这个模式将会先识别到指纹再调用对应的漏洞. 

以Weblogic为例, 只有探测到Weblogic指纹, 才会识别iiop与t3, 只有扫到Weblogic console, 才会进行Weblogic弱口令爆破.通过yaml中的chains, 将多个poc串成一个工作流, 以最少的发包达到最大的成果.

当然, 也有这种打全poc的需求, 所以预留了对应的使用方式.`-E all` ,**慎用**



??? important "通过finger与插件配置的漏洞"
    | 通过finger配置的vuln类型漏洞 | 通过finger配置的信息泄露漏洞 | 通过finger配置的tcp协议漏洞 | 通过插件配置的漏洞 |
    | ---------------------------- | ---------------------------- | --------------------------- | ------------------ |
    | k8s_api_unauth               | 普元EOS_console_leak         | redis_unauthorized          | smbghost           |
    | elasticsearch_unauth         | weblogic_console_leak        | zookeeper_unauthorized      | ms17-010           |
    | hadoop_unauth                | sourcemap-leak               | memcahce_unauthorized       | oxid-leak          |
    | docker_unauth                | swagger leak                 | dubbo_unauthorized          | netbois-leak       |
    | etcd_unauth                  | druid leak                   | socks5_unauthorized         | wmi-leak           |
    | flink_unauth                 | iis Directory traversal      | socks4_unauthorized         | snmp-public        |
    |                              | apache Directory traversal   |                             | smb-leak           |
    |                              | bigip_console_leak           |                             |                    |
    |                              | solr_admin_leak              |                             |                    |



??? important "通过nuclei配置的漏洞"
	```
	├─bigip
    │      f5-cve-2022-1388.yml
    ├─cloud
    │      couchdb_CVE-2017-12635.yaml
    │      harbor-public-images.yaml
    │      nacos-unauth.yml
    │      yapi-register.yaml
    ├─component
    │      ueditor_file_upload.yml
    ├─device
    │      hikvision-cve-2021-36260.yml
    │      ruijie_rce.yml
    ├─gitlab
    │      gitlab-cve-2021-22205.yml
    │      gitlab-login.yml
    │      gitlab-public-register.yml
    │      gitlab-public-repos.yml
    │      gitlab-user-enum.yml
    ├─grafana
    │      grafana-cve-2022-26148.yml
    │      grafana-login.yml
    ├─http
    │      shiro-default-key.yml
    │      shiro-detect.yml
    ├─iis
    │      iis_put.yaml
    ├─login
    │      activemq-login.yml
    │      apisix-login.yaml
    │      apollo-login.yml
    │      canal-login.yaml
    │      druid-login.yaml
    │      dubbo-login.yaml
    │      h3c-router-msr-login.yml
    │      hikvision-camera-login.yml
    │      huawei-ibmc-login.yml
    │      jenkins_login.yml
    │      minio-default-login.yaml
    │      nacos-login.yml
    │      nexus-default-login.yaml
    │      rabbitmq-login.yml
    │      ruijie_ap_login.yml
    │      xxljob-default-login.yaml
    ├─spring
    │      spring-CVE-2016-4977.yml
    │      spring-CVE-2018-1271.yml
    │      spring-CVE-2018-1273.yml
    │      springboot-actuator-h2-rce.yml
    │      springboot-actuator-jolokia-rce.yml
    │      springboot-actuator-logview-rce.yml
    │      springboot-actuator.yml
    │      springcloud-actuator-gateway-rce.yml
    │      springcloud-lfi.yml
    ├─tomcat
    │      tomcat_login.yml
    │      tomcat_manager_leak.yml
    ├─vmware
    │      vcenter-CVE-2021-21972.yml
    │      vcenter-CVE-2021-21985.yml
    │      vcenter-CVE-2021-22005.yml
    │      vcenter_version.yml
    │      vmware-CVE-2022-22954.yml
    ├─weblogic
    │      weblogic-CVE-2020-14883.yml
    │      weblogic-CVE-2022-21371.yml
    │      weblogic-xmldecode-rce.yml
    │      weblogic_console_leak.yml
    │      weblogic_iiop_detect.yml
    │      weblogic_login.yml
    │      weblogic_t3_detect.yml
    │
    └─zabbix
            zabbix-cve-2022-23231.yml
            zabbix-login.yml
	```

## 启发式扫描原理

**启发式扫描让扫描A段成为可能！**

!!! info "背景"
    这几年遇到非常多的项目都需要在几天甚至几个小时内完成内网刷分的任务.在没有之前报告或者内鬼报信的情况下, 内网资产测绘只能使用传统的扫描器一点一点探测, 其性能与效率都非常低下.fscan、kscan之类的工具略微改善了条件, 将内网的探测从几个c段提高了整个b段, 利用go的goroutine轻松达到了数千的并发, 完成了之前难以实现的并发速度.但是在面对一个a段甚至某些大型内网的数十个a段还是无能为力.


面对这种情况, 在2020年与几个大哥们商讨出了一个解决方案, 并在接近一年的实战中检验了这个方案的可行性.

根据经验我们会发现, 入口点的C段以及周边的几个C段通常会存在大量资产.

因此, 可以做出猜想：如果某个C段存在任意一个资产, 那么这个C段就可能存在更多资产.

启发式扫描的设计将根据这个猜想进行, 对于一些实现的具体细节及各种各样的优化, 具体的下面会提到.


### B段的启发式扫描

对于B段来说, 一共有65535个IP, 256个C段.

从所有C段找到存活的C段, 可以采用TCP\udp\icmp协议进行请求.如果某个C段中存在任意一个回应, 那就将这个C段标记为存活, 之后就不再扫描这个C段了.

根据以上思路, 如果我们以80端口作为标志只需要扫描65535次.对于go来说, 1000个并发是很轻松的事情, 消耗不了多少资源(大概是一核2G服务器 50MB内存,10%CPU), 在老的Linux发行版上就算有fd限制也是1024, 如果是新发行版, 则跑个10000并发也很轻松.

计算一下时间, 以2秒为默认超时(实战中测试出来能尽可能的发现目标, 但不影响结果的最短超时时间, icmp为1秒), 1000并发. 65535*2/1000 = 130秒.非常快, 探测一整个b段的存活C段只需要2分钟.如果是在linux上, 我常用4000的并发, 大概只需要30秒.

在喷洒出存活的C段后, 再对存活的C段进行具体的端口探测, 可以使用`-p`参数指定任意的端口号.这样, 扫描耗时就变成了130秒 + 存活的C段数*(256*指定的端口数×2)/1000.如果存活10个C段, 指定了100个端口, 测绘整个B段的耗时 130+10×(256×100×2)/1000 = 642秒, 大概十分钟.


当然, 这还可以优化, 例如

1. 通过算法以C段优先生成例如 1.1.1.1, 1.1.2.1, 1.1.3.1这样任务顺序, 按照安全圈的命名习惯, 应该叫做C段喷洒(C class Spray)
2. 如果某个C段标记为存活, 这不进行后续发包, 也就是说存活的C段越多耗时越短
3. 输出结果会保留探测存活的IP/24的形式(而不是1.1.1.0/24), 方便二次验证
4. 可配置的探测指标, gogo中有个参数smart-probe, 即`-sp 80,icmp,445`(默认80)  ,将同时使用三个标志验证, 当然耗时也会乘3(会保留123中提到的优化)
5. 添加`-no`参数, 只进行C段喷洒, 不进行进一步的存活C段端口扫描

### A段的启发式扫描

A段中一共有256个B段, 65535个C段

这里会发现一个问题, 如果指定的是A段, 那这种喷洒方式的耗时就会变成65535×256, 大概是一千六百多万个IP, 耗时大约是16776960×2/1000=33553秒=9个小时

光进行C段喷洒, 就需要9个小时, 那资产测绘就更无从谈起了.


还好, 这也是有解决办法的.

刚才提到了以喷洒C段实现的B段启发式扫描, 把这个思路扩大一级, 可以对A段使用.可以将C段作为存活单位, IP作为存活标志位进行B段喷洒,  对每个C段的第一个IP进行`-sp`指定的端口探测.

这样, 对A段进行B段喷洒的耗时就可以计算到, 同样是(65535×2/1000)=130秒

在探测到存活B段的情况下, 再单独进行B段的启发扫描, 大概是梯度下降的思路.对A段进行这种方式的C段喷洒耗时则是 (65535×2/1000)×n(存活的B段)×130秒.最坏情况下需要9个小时, 正常情况1个小时即可完成对A段的C段存活测绘.

可以优化：B段的启发式扫描优化同样适用与这里, 还添加了一些针对性的优化：

1. 添加`ip-probe`参数, `-ipp 1,254`(默认1), 指定C段中的标志IP.
2. 添加`-no`参数, 只进行B段喷洒, 不进行进一步的C段喷洒与端口扫描.
3. 在进行B段喷洒的时候, 默认端口为icmp, 使用`-sp`指定任意端口或协议.
4. 在`-p`只指定了1~2个端口的时候, 不进行C段喷洒, 直接进行端口扫描( C段喷洒约等于进行一次单端口全扫描).

!!! danger "缺点"
    1. 这样大规模的跨网段扫描, 是很难逃过流量设备与蜜罐的检测的, 所以使用这种方法扫描的时候需要考虑失去这个点的后果.不过蜜罐大多不会部署在网关ip, 因此启发式扫描不失为一种绕过蜜罐的扫描方式.
    2. 为了效率可能存在一定程度的漏报, 例如, 某个办公段没有80端口开启, 这种情况下可能会漏报, 但实际上极少发生, 选择合适的启发式扫描配置可以规避这样的漏报.
