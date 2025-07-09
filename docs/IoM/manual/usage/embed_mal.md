## embed mal

在 IoM 的 v0.1.1 中集成了一系列内置的 embed 功能:
![mal_intl_help.png](../../assets/embed/usage/mal_intl_help.png)

可以在[embed 的详细文档](/IoM/manual/mal/embed)中找到所有的相关命令

### logonpassowrds

embed 通过内置 mimikatz 实现了 logonpassowrds
![img_4.png](../../assets/embed/usage/mimikatz_logonpasswords.png)

同时对该命令添加了解析，会在抓取的同时存储到 context/credential 中
![img_3.png](../../assets/embed/usage/context_credential.png)

如果你需要一个 opsec 更高的办法,可以尝试 nanodump

![img_10.png](../../assets/embed/usage/nanodump.png)

### ping/port scan

![img_6.png](../../assets/embed/usage/ping-port-scan.png)

### curl

![img_7.png](../../assets/embed/usage/curl.png)

### 本地信息收集

如 hashdump、ipconfig、route print、systeminfo 等
![img_2.png](../../assets/embed/usage/intl-collect-info.png)

### 分组相关

我们也对功能进行了分组，比如用于枚举信息的 enum,用于横向的 move,netuser 操作,token 相关操作等
![img_8.png](../../assets/embed/usage/intl-group.png)

### load_prebuild

按照命令的分组预打包了各个分组的 module, 用来动态加载. 包括

- full
- fs
- sys
- rem
- net
- execute

如果编译的 nano 的 implant， 可以便捷热加载对应的功能

![](/IoM/assets/Pasted%20image%2020250710034218.png)
