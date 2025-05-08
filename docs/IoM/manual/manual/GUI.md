# IoM GUI(内测)

## 安装

### 下载文件
从 [malice-network仓库](https://github.com/chainreactors/malice-network/releases/tag/nightly) 中的release中下载对应的vscode插件`iom.vsix` 以及client文件

![](/IoM/assets/Pasted%20image%2020250220013427.png)

### 从文件安装vscode插件

打开extension或ctrl+sheft+x 并单击如图所示

![](/IoM/assets/Pasted%20image%2020250220013640.png)

### 配置VSCODE插件

IoM: Executable Path 填入从release下载的iom二进制程序

![](/IoM/assets/Pasted%20image%2020250220014015.png)

### 打开IoM 插件

IoM需要 malice-network生成的.auth凭证, 所以在这一步之前请先自行搭建好server

可以参考[quickstart文档](/IoM/quickstart/#server)快速搭建server

安装server的命令需要修改为:
```bash
curl -L "https://raw.githubusercontent.com/chainreactors/malice-network/master/install.sh" -o install.sh
bash install.sh
```

![](/IoM/assets/Pasted%20image%2020250220014242.png)

如果已经通过client连接过server， 则会直接显示历史连接过的auth文件. 单击即可进入到交互界面. 

!!! important "请注意server版本,client版本,gui版本一致"

![](/IoM/assets/Pasted%20image%2020250220013750.png)


## 使用


GUI还未完全实现client的全部功能, 目前只实现了较为重要的功能. 并且在很多交互上还缺乏联动，存在bug等等问题。 请见谅

如果有任何用户体验, bug, 建议， 欢迎提供issue。 我们会尽快处理。

### 配置github action编译

IoM支持通过github action上准备好的编译环境自动化编译

fork https://github.com/chainreactors/malefic

[点击申请github token](https://github.com/settings/tokens/new) ， 需要有以下权限

![](/IoM/assets/Pasted%20image%2020250220142414.png)

在设置中搜索iom

![](/IoM/assets/Pasted%20image%2020250220142402.png)


这里的参数填写fork后的仓库所有者和仓库名， 以及刚刚申请的github token

连接任意服务器， 点击`Artifacts` 发现github变为绿点表示github action 自动编译已正确启用，点击Add Profile即可生成implant编译任务
![](/IoM/assets/Pasted%20image%2020250220142736.png)