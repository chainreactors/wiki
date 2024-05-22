## 前言

对于poc的设计, 和指纹的设计是差不多的. gogo定位上并不是一个尽可能覆盖的漏扫, 而是一个绝大部分场景在内网的自动化引擎. 因此, gogo没有直接采用全量的xray/goby/nuclei之类的poc库, 而是够用就好.

对于内网场景, 什么样的poc是够用? 

要回答这个问题, 也只能从经验出发, 在实践中, 我们对于内网刷分的抱怨就是枯燥, 其中最枯燥的肯定是找默认密码, 一个一个去试这个过程.  其次就是一些内网常用的横向漏洞, 例如k8s未授权, 一些常见设备漏洞. 而有些服务的漏洞是不太需要的, 比如各种oa的poc, 各种中低危的漏洞等. 

当然 这个是否也有也不能完全由我来定义, 大多数情况下还是根据实际情况是否遇到了再现场添加以备下次使用. 



目前一共有nuclei poc 约50个, 其中包括了十几个最常见服务与设备的默认登录poc, 还有几十个常见的漏洞poc; 通过finger配置的poc 十几个, 多为一些信息泄露漏洞, 通过go代码编写的插件2个, 分别为ms17-010,smbghost.



## 编写 nuclei poc

(原文位于: https://github.com/chainreactors/gogo/edit/master/doc/poc%E7%BC%96%E5%86%99.md)

gogo的poc采用了nuclei的poc, 但删除了部分nuclei的语法. 例如dsl. 并且有部分较新的nuclei语法暂不支持. 

gogo 目前支持tcp(暂不支持tls tcp)与http协议的绝大部分nuclei poc

**gogo与nuclei编写poc的注意事项**

nuclei 官方的poc编写教程 https://nuclei.projectdiscovery.io/templating-guide/

gogo常用于特殊环境下, 因此删除了许多nuclei原有的功能, 例如dsl, oast以及除了http与tcp协议之外的漏洞探测.

nuclei更新较快, 一般情况下gogo会落后nuclei最新版几个月, 所以建议只使用基本的规则, 编写最简的poc, 保证兼容性.

**明确删除并且后续不会添加的功能**

部分功能会以简化的形式重新加入到gogo中
1. dsl 包括match中dsl 以及request的例如`{{base64(base64string)}}`这样的动态生成的功能. 通过encode tag简单代替
2. oast与OOB,这类需要外带的功能, 可以通过探测接口是否存在做一个大致的匹配.
3. workflow, 通过chain简单代替
4. info中的大多数信息, 只保留最基本的信息, 并且不会输出, 建议只保留name, tag, severity三个字段
5. pipeline
6. Race conditions
7. 除了regex之外的extractor. 因为引入多个解析库容易会变得臃肿

**暂时不支持的功能, 但在计划表中的功能**

1. cookie reuse
2. http redirect
3. variables
4. Helper Functions 会简化之后再加入

**nuclei中没有, 只能在gogo中使用的功能**

1. finger字段, 能绑定finger, 提供除了tag之外的绑定finger办法
   ```
   id: poc-id
   finger: fingername
   ```
2. chain字段, 如果match成功后会执行的poc
   ```
   id: poc-id
   chain: 实现
   ```
3. 通过命令行参数替换yaml中的payload, 后续将会支持从文件中读列表 
### 从nuclei templates 迁移poc

https://github.com/projectdiscovery/nuclei-templates

大部分poc仅需简单修改即可在gogo中使用.

#### 示例  迁移apollo-login poc 到gogo

https://github.com/projectdiscovery/nuclei-templates/blob/d6636f9169920d3ccefc692bc1a6136e2deb9205/default-logins/apollo/apollo-default-login.yaml



![image-20220806183221407](D:\Programing\blog\chainreactors\拓展gogo的能力-poc篇.assets\poc-16720450429071.png)



这个poc需要进行一些删减和改动. 

1. 删除一些header信息, 并且根据gogo的指纹重新添加tags
2. 减少不必要的发包, apollo实际上只需要第一个signin的包即可确定是否成功
3. dsl在gogo中已删除, 因为dsl不是必要功能, 大部分场景都能通过正则实现, dsl只是减少复杂场景的使用难度. 因此, 我们可以把这段dsl修改为匹配固定值

#### example 1 apollo login

**step 1** 删除不必要的header, 仅保留如下信息, 并重新添加tags

需要注意的是, tags填写的是fingers中存在的指纹, 如果指纹没有识别到, 将不会自动使用poc. 需要-E poc id 强制指定
```
id: apollo-default-login

info:
  name: Apollo Default Login
  severity: high
  tags: apollo
```



**step2 and step3** 原本的poc中有两个包, 修改为一个. 最终成果

```
id: apollo-default-login

info:
  name: Apollo Default Login
  severity: high
  tags: apollo

requests:
  - raw:
      - |
        POST /signin HTTP/1.1
        Host: {{Hostname}}
        Content-Type: application/x-www-form-urlencoded
        Origin: {{BaseURL}}
        Referer: {{BaseURL}}/signin?
        
        username={{user}}&password={{pass}}&login-submit=Login
    attack: pitchfork
    payloads:
      user:
        - apollo
      pass:
        - admin
    matchers-condition: and
    matchers:
      - type: word
        part: header
        negative: true
        words:
          -  '?#/error'
        condition: and

      - type: status
        status:
          - 302
```

#### example 2 tomcat default login

这是nuclei的tomcat默认漏洞登录poc
```
id: tomcat-default-login

info:
  name: ApahceTomcat Manager Default Login
  author: pdteam
  severity: high
  description: Apache Tomcat Manager default login credentials were discovered. This template checks for multiple variations.
  reference:
    - https://www.rapid7.com/db/vulnerabilities/apache-tomcat-default-ovwebusr-password/
  tags: tomcat,apache,default-login

requests:
  - raw:
      - |
        GET /manager/html HTTP/1.1
        Host: {{Hostname}}
        Authorization: Basic {{base64(username + ':' + password)}}
    payloads:
      username:
        - tomcat
        - admin
        - ovwebusr
        - j2deployer
        - cxsdk
        - ADMIN
        - xampp
        - tomcat
        - QCC
        - admin
        - root
        - role1
        - role
        - tomcat
        - admin
        - role1
        - both
        - admin

      password:
        - tomcat
        - admin
        - OvW*busr1
        - j2deployer
        - kdsxc
        - ADMIN
        - xampp
        - s3cret
        - QLogic66
        - tomcat
        - root
        - role1
        - changethis
        - changethis
        - j5Brn9
        - tomcat
        - tomcat
        - 123456

    attack: pitchfork  # Available options: sniper, pitchfork and clusterbomb

    matchers-condition: and
    matchers:
      - type: word
        part: body
        words:
          - "Apache Tomcat"
          - "Server Information"
          - "Hostname"
        condition: and

      - type: status
        status:
          - 200
```

这是gogo中移植修改完的:
因为不支持动态的dsl, 所以需要将base64预先计算好, extractor 可以视情况保留, gogo支持extractor功能, 但是对于输出目前处理的并不是很优雅, 后续还会对此功能更新优化.

```
id: tomcat-manager-login
info:
  author: pdteam
  name: tomcat-manager-default-password
  severity: high
  tags: tomcat-manager
requests:
  - raw:
      - |
        GET /manager/html HTTP/1.1
        Host: {{Hostname}}
        Authorization: Basic {{auth}}
        User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0
    attack: sniper
    stop-at-first-match: true
    matchers:
      - status:
          - 200
        type: status
      - type: word
        words:
          - Apache Tomcat
    extractors:
      - type: regex
        name: cookie
        internal: true
        part: header
        regex:
          - 'JSESSIONID\..*=([a-z0-9.]+)'
    matchers-condition: and
    payloads:
      auth:
        - dG9tY2F0OnRvbWNhdA==
        - dG9tY2F0OnMzY3JldA==
        - YWRtaW46YWRtaW4=
        - b3Z3ZWJ1c3I6T3ZXKmJ1c3Ix
        - ajJkZXBsb3llcjpqMmRlcGxveWVy
        - Y3hzZGs6a2RzeGM=
        - QURNSU46QURNSU4=
        - eGFtcHA6eGFtcHA=
        - UUNDOlFMb2dpYzY2
        - YWRtaW46dG9tY2F0
        - cm9vdDpyb290
        - cm9sZTE6cm9sZTE=
        - cm9sZTpjaGFuZ2V0aGlz
        - dG9tY2F0OmNoYW5nZXRoaXM=
        - YWRtaW46ajVCcm45
        - cm9sZTE6dG9tY2F0
```

### 测试

因为gogo为了缩减体积, 仅使用了标准json库, 所以需要先将yaml转为json

使用自带的脚本 `yaml2json.py`.

`python yaml2json.py apollo-login.yml -f apollo-login.json` 


指定ef文件加载poc

`gogo.exe -ef .\poc.json -ip 127.0.0.1 -e -p 80 -debug`

如果需要配合burp调试, 请使用proxifier代理, 代理gogo的流量到burp

![image-20220806194210422](D:\Programing\blog\chainreactors\拓展gogo的能力-poc篇.assets\run-16720450686213.png)

### 高级用法

### payload

会发现gogo中的所有logon类的poc都通过payload字段去配置账号密码, 这是为了应对非默认密码的场景. 

在gogo中, 可以使用`--payload` 重载payload参数中的值, 这样如果找到一些非默认密码, 可以快速用gogo对内网的全部相同应用过一遍.  就像是那些专门爆破服务器弱口令的工具一样, 随着密码本不断滚动. 

`gogo -l list.txt -E poc_name --payload username=custom --payload password=custom`

当然也可能是多个用户名, 对应多个密码, `gogo -l list.txt -E poc_name --payload username=user.txt --payload password=pass.txt` , username与password的值如果存在同名文件名, 会优先从文件中读. 

需要一提的是在启用`--payload`时nuclei中的`attack-type`会修改为clusterbomb(笛卡尔积) , 也可以通过`--attack-type sniper`  手动修改.

### extract

gogo中, 可以使用`gogo -i 1.1.1.1 --extract version(.*)` 自定义正则表达式去提取一些数据, 

也有一些预设的提取表达式, 例如` gogo -i 1.1.1.1 --extracts ip,url,js` .

而对于nuclei poc, 他原本就有extractors功能, 因此将其和gogo的extract融合到了一起. 

如果需要从某些特殊的应用中提取一些有效信息, 可以在extractors中配置, 在命中指纹后, 会自动提取对应的数据到gogo的结果中. 

例如vcenter_version.yml这个poc中.

```
id: vmware-detect
finger:
  - Vmware Center
info:
  name: VMware Detection
  author: elouhi
  severity: info
  description: Sends a POST request containing a SOAP payload to a vCenter server to obtain version information
  tags: vcenter,vmware

requests:
  - raw:
      - |
        POST /sdk/ HTTP/1.1
        Host: {{Hostname}}

        <?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
           <soap:Header>
              <operationID>00000001-00000001</operationID>
           </soap:Header>
           <soap:Body>
              <RetrieveServiceContent xmlns="urn:internalvim25">
                 <_this xsi:type="ManagedObjectReference" type="ServiceInstance">ServiceInstance</_this>
              </RetrieveServiceContent>
           </soap:Body>
        </soap:Envelope>
    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200

      - type: word
        part: body
        words:
          - 'ha-folder-root'
          - 'RetrieveServiceContentResponse'
        condition: or

      - type: word
        part: header
        words:
          - "text/xml"

    extractors:
      - type: regex
        name: version
        part: body
        group: 1
        regex:
          - "<version>(.*?)</version>"
      - type: regex
        name: os
        part: body
        group: 1
        regex:
          - "<osType>(.*?)</osType>"
      - type: regex
        name: build
        part: body
        group: 1
        regex:
          - "<build>(.*?)</build>"
```

主动向`/sdk/` 发包, 并获取版本号, 发行号,操作系统等重要数据, 并在gogo的结果中呈现. 

## 编写go插件

实际上编写go插件并不会比编写nuclei的yaml复杂多少, 只是go插件使用起来更不方便, 每次都需要重写编译, 测试也往往需要配合ide打开debug.



在gogo中每个端口探测生命周期有一个贯穿始终的result变量, 需要在dispatch中添加触发某个插件的逻辑, 并在插件的具体实现中修改result变量即可完成插件的编写.

没有做过多的抽象, 希望最核心的可拓展能力还是以yaml的dsl为主.

一个简单的例子, `v2/pkg/plugin/wmiScan.go`

```
func wmiScan(result *pkg.Result) {
	result.Port = "135"
	target := result.GetTarget()
	conn, err := pkg.NewSocket("tcp", target, RunOpt.Delay)
	if err != nil {
		return
	}
	defer conn.Close()

	result.Open = true
	ret, err := conn.Request(data, 4096)
	if err != nil {
		return
	}

	off_ntlm := bytes.Index(ret, []byte("NTLMSSP"))
	if off_ntlm != -1 {
		result.Protocol = "wmi"
		result.Status = "WMI"
		tinfo := utils.ToStringMap(ntlmssp.NTLMInfo(ret[off_ntlm:]))
		result.AddNTLMInfo(tinfo, "wmi")
	}
}
```

没有做过多的包装, 只需要多result的一些属性做出修改, 即可完成一个简易的poc.

大部分常见的特殊端口都已经覆盖, 如果额外的需求可以在新建issue. 更建议协助我们维护[gogo-templates](https://github.com/chainreactors/gogo-templates) 仓库.

## 特殊的poc

poc的用法不仅限用来探测漏洞, 很多时候还可以用来实现最小发包原则. 

### 减少主动HTTP指纹识别

### 减少主动TCP指纹识别

### 提取信息



## 结语

越写文档越发现在持续两年的修修改改, 不断添加功能中, gogo已经积累了非常复杂的用法, 隐含了非常多的细节. 很难通过一两篇的文档去完整的介绍整个gogo的功能. 

后续将会加快文档的整理, 并通过一个单独的网站提供查阅. 

