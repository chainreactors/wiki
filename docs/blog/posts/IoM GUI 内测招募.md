---
date:
  created: 2025-02-26
slug: IoM_GUI
---

## Intro

IoM 的v0.1.0 的开发工作还需要一段时间， 但GUI已经开启了抢先测试. 测试不限名额， 发布在 https://github.com/chainreactors/malice-network/releases/tag/nightly

可以参考下面的安装流程安装GUI.

IoM-GUI采用vscode extension的形式实现， 不是传统的GUI client， 也不是WEB GUI。 我们尝试了一种前所未有的C2 GUI形式， 原因有很多: 

* vscode 已经是目前现代化，兼容最多场景的IDE, 它提供的基座让我们能自然而然的实现跨屏与各类场景覆盖
* vscode 集成了文件浏览，终端，远程开发，代理等等功能， 而C2也有这些功能，可以直接接入到vscode实现无缝的交互
* vscode本身就是IDE， 可以进行二次开发， 插件开发等， 可以让开发与后渗透无缝进行
* vscode 提供了最优秀的AI集成，后续会尝试将AI接入到GUI的工作流中
* ......

要从零实现一个GUI大概率会很平庸， 但是我们计划最大程度利用vscode的各种特性，打造一个最好用的C2-GUI。 

**警告:** 

**目前提供的版本是早期测试版，每天都会自动基于最新的commit打包，是极不稳定的状态**

<!-- more -->

数据和api可能每天都会改变，如果用于生产环境请三思。 

有任何建议和反馈， 欢迎在 https://github.com/chainreactors/malice-network/issues 中沟通

或通过wiki中的联系方式发送邮件， 我会手动拉入交流群

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

安装server的命令需要修改为:
```bash
curl -L "https://raw.githubusercontent.com/chainreactors/malice-network/master/install.sh" -o install.sh
sudo MALICE_NETWORK=nightly bash install.sh
```

![](/wiki/IoM/assets/Pasted%20image%2020250220014242.png)

如果已经通过client连接过server， 则会直接显示历史连接过的auth文件. 单击即可进入到交互界面. 

!!! important "请注意server版本,client版本,gui版本一致"

![](/wiki/IoM/assets/Pasted%20image%2020250220013750.png)


## 使用


GUI还未完全实现client的全部功能, 目前只实现了较为重要的功能. 并且在很多交互上还缺乏联动，存在bug等等问题。 请见谅

如果有任何用户体验, bug, 建议， 欢迎提供issue。 我们会尽快处理。

### 配置github action编译

IoM支持通过github action上准备好的编译环境自动化编译

fork https://github.com/chainreactors/malefic

[点击申请github token](https://github.com/settings/tokens/new) ， 需要有以下权限

![](/wiki/IoM/assets/Pasted%20image%2020250220142414.png)

在设置中搜索iom

![](/wiki/IoM/assets/Pasted%20image%2020250220142402.png)


这里的参数填写fork后的仓库所有者和仓库名， 以及刚刚申请的github token

连接任意服务器， 点击`Artifacts` 发现github变为绿点表示github action 自动编译已正确启用，点击Add Profile即可生成implant编译任务
![](/wiki/IoM/assets/Pasted%20image%2020250220142736.png)