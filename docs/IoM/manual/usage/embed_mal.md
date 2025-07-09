# embed mal

在IoM的v0.1.1中集成了一系列内置的embed功能:
![mal_intl_help.png](../../assets/embed/usage/mal_intl_help.png)

## 用法示例

我们目前包含了一些常见功能, 
- logonpasswords
- curl
- ipconfig
- systeminfo
- hashdump
- ...

### logonpassowrds
embed通过内置mimikatz实现了logonpassowrds
![img_4.png](../../assets/embed/usage/mimikatz_logonpasswords.png)

同时对该命令添加了解析，会在抓取的同时存储到context/credential中
![img_3.png](../../assets/embed/usage/context_credential.png)

如果你需要一个opsec更高的办法,可以尝试nanodump

![img_10.png](../../assets/embed/usage/nanodump.png)


### ping/port scan
![img_6.png](../../assets/embed/usage/ping-port-scan.png)

### curl
![img_7.png](../../assets/embed/usage/curl.png)

### 本地信息收集
如hashdump、ipconfig、route print、systeminfo等
![img_2.png](../../assets/embed/usage/intl-collect-info.png)

### 分组相关
我们也对功能进行了分组，比如用于枚举信息的enum,用于横向的move,netuser操作,token相关操作等
![img_8.png](../../assets/embed/usage/intl-group.png)