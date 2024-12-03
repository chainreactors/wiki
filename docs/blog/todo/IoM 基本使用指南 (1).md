## Intro

IoM通过几个月的快速迭代, 已经具备了一个现代化C2的绝大部分功能. IoM的定位一直是下一代C2, 因此


### 快速编译

基于github action实现快速编译

#todo 操作流程


### mals插件

#todo 通过mals命令下载基本插件，并对插件基本使用介绍





## v0.0.3 patch2 更新日志


### 接入github action

在刚发布的v0.0.3中, 我们使用docker作为自动化编译的解决方案。 但是rust复杂的编译方案不得不准备每个target对应的编译环境。这导致了对CPU, 内存，硬盘都有巨大的占用， 并且我们目前只实现了基于linux的自动化安装。 

比起sliver或者CobaltStrike过于笨重, 这导致上手门槛极大提高。为此， 我们准备了更加轻量的解决方案。 

在v0.0.2中， 提供了使用两行gh命令实现的自动化编译， 在本次patch中，我们将github action的云编译接入到client/server中， 只需要申请一个github token， 即可实现对client/server无任何环境要求的自动化编译


### artifact功能组

为了在提权脚本中更方便使用IoM, 就像CS能直接通过listener生成对应的shellcode一样. patch2将一系列shellcode与artifact操作的函数暴露出来了。

这一组api如下:
* artifact_payload ,对应CobaltStrike中的同名函数， 用于生成stageless的shellcode， 在IoM是SRDI后的beacon
* artifact_stager， 对应CobaltStrike中的同名函数， 用于生成stager的shellcode， 在IoM中式SRDI后的pulse
* donut_dll2shellcode, 基于godonut库与donut实现的dll转shellcode 
* donut_exe2shellcode, 基于godonut库与donut实现的exe转shellcode
* sgn_encode, shellcode sgn混淆
* srdi, 

### 非交互式的client



### 其他更新

* 




