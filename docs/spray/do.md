---
title: spray (内部测试) · 实战
---

## 最常用的工作流

### step1 常见目录字典扫描

常见目录字典来源互联网上有不少, 但大多缺乏维护更新. 需要使用者自行组合一个适合自己的字典.

`spray -u http://example.com -d common.txt -a`

使用spray打开所有插件(包括爬虫, 通用文件, 备份文件, 信息收集等), 进行一次完整的网站信息收集

但如果面对一个404页面的nginx服务器, 这种方式大概率收集不到任何信息, 需要使用其他方法.

### step2 对于反代的探测

对反代一般有两种方式

**host爆破**

通过子域名数据, 将子域名作为字典, 爆破其反代的host配置

`spray -u http://example.com -m host -d subdomain.txt`

**随机目录爆破**

通过spray的字典生成器, 生成一些常用的随机字典, 进行爆破.

`spray -u http://example.com -w '{$l#4}' -a`

1-4位随机小写目录是比较常见的配置, 在很多项目中都找到了惊喜.

根据一些其他来源的信息, 例如被动的url收集, 发现反代路由的命名规律, 使用spray的字典生成器构造对应的字典, 能发现更多内容. 

### step3 java权限绕过的探测

从其他渠道扫描的结果中, 将中间件或语言为java相关的结果导出, 重复1-2步骤. 然后可以得到一批url.

再将这批url采用spray的append-rule去生成对应的权限绕过payload, fuzz是否可能存在权限绕过.

`spray -l 1.txt --append-rule authbypass --recon`

## 使用场景

*为了更好的介绍spray的功能, 案例中将会包含一定的演绎成分.* 

### 场景1 反代中间件

### 场景2 某CMS

### 场景3 CDN



