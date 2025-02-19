# IoM GUI(内测)

## 安装

### 下载文件
从 [malice-network仓库](https://github.com/chainreactors/malice-network/releases/tag/nightly) 中的nightly release中下载对应的vscode插件文件以及client文件

![](/wiki/IoM/assets/Pasted%20image%2020250220013427.png)

### 从文件安装vscode插件

打开extension或ctrl+sheft+x 并单击如图所示

![](/wiki/IoM/assets/Pasted%20image%2020250220013640.png)

### 配置VSCODE插件

IoM: Executable Path 填入从nightly release下载的iom二进制程序

![](/wiki/IoM/assets/Pasted%20image%2020250220014015.png)

### 打开IoM 插件

IoM需要 malice-network生成的.auth凭证, 所以在这一步之前请先自行搭建好server

可以参考[quickstart文档](/wiki/IoM/quickstart/#server)快速搭建server

![](/wiki/IoM/assets/Pasted%20image%2020250220014242.png)

如果已经通过client连接过server， 则会直接显示历史连接过的auth文件. 单击即可进入到交互界面. 

!!! important "请注意server版本,client版本,gui版本一致"

![](/wiki/IoM/assets/Pasted%20image%2020250220013750.png)


## 使用


GUI还未完全实现client的全部功能, 目前只实现了较为重要的功能. 并且在很多交互上还缺乏联动，存在bug等等问题。 请见谅

如果有任何用户体验, bug, 建议， 欢迎提供issue。 我们会尽快处理。