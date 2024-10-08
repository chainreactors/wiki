---
title: Internal of Malice · 路线图
---

## 整体方向

**webshell 支持**

我们将结合 webshell 中最先进的技术，以共享同一套插件基建的方式去兼容 webshell 中的各种技术。

**互联互通**

IoM  上的流量隧道不只是点对点的， 还将是网状的，甚至是构建一个受控机器的虚拟网络。

**GUI**

受限于各种原因， 我们暂时没有实现一个 GUI，但高效的工具必定会有一个用户体验较好的 GUI。

**服务端插件**

兼容 cobaltstrike 的 cna 插件生态。

实现自己的脚本语言的服务端/客户端插件，通过 lua 或者 yaklang，更或是任意语言的。

 **联动 ASM**

通过 IoM  作为跳板， 将 ASM 引入到内网实现自动化的攻击面探测。

## v0.0.1

**短期计划**

预计在2024年8月份发布
### Implant

- [ ] 实现melefic调度器
    - [x] 支持异步调度module
    - [x] 实现task管理相关功能
    - [x] 实现module管理相关功能
- [ ] 实现基本命令
    - [x] cp
    - [x] mv
    - [x] cat
    - [x] rm
    - [x] mkdir
    - [x] ls
    - [x] cd
    - [x] pwd
    - [x] chmod
    - [x] chown
    - [x] env/setenv/unsetenv
    - [x] kill
    - [x] ps
    - [x] netstat
    - [x] upload
    - [x] download
    - [x] exec
- [ ] 实现拓展能力
    - [x] execute_assembly
    - [x] execute_shellcode
    - [x] unmanaged powershell
    - [x] execute_pe
    - [x] execute_dll
    - [x] inline_assembly
    - [x] inline_shellcode
    - [x] inline_pe
    - [x] inline_dll
    - [x] execute-bof
    - [ ] memfd
    - [x] 实现module热加载
    - [x] 兼容sliver armory extension的dll加载
- [x] 实现profile, 能自定义opsec特征
- [x] 进程操作
    - [x] 进程镂空（process hollowing）
    - [x] 进程注入（process inject）
        - [x] 基本进程注入操作
        - [x] poolparty
    - [x] 牺牲进程 （sacrifice process ）
    - [x] 父进程欺骗 （spoof parent process）
    - [x] 侧加载（sideload）
    - [x] bypass ETW
    - [x] bypass AMSI
    - [x] BlockDLL
- [ ] OPSEC
    - [x] syscall
    - [x] indirect syscall
    - [x] UDRL
    - [ ] 内存与静态文件字符串混淆

### Server

server是所有数据汇总处理的核心.

- [x] 通过grpc实现全部的通讯
- [x] 实现session, client, listener,job, event, task, connection的管理
- [x] 重构数据库
- [x] 解耦listener
- [x] 实现session的message持久化存储, 并能从缓存中恢复
- [x] 记录所有的操作, 并提供审计日志
- [x] 实现deamon
- [x] 实现rootrpc, 实现一系列高权限管理操作
- [x] 证书管理与随机化证书特征
- [x] 支持config管理server配置

#### Listener

listener是独立部署的组件, 通过pipeline解析并转发implant的数据到server

- [x] 实现基本命令
- [x] 实现pipeline相关功能
	- [x] 实现TCP pipeline
	- [x] 实现pipeline的wrap TLS
	- [x] 实现pipeline的wrap encryption
- [x] 实现与server/client的交互
- [ ] 实现website相关功能
	- [x] 实现web的增删改查
	- [ ] 实现与server/client的交互
- [x] 提供独立的配置listener.yaml 文件


### Client

- [ ] 通过交互式的tui尽可能提高cli的用户体验
	- [x] session explore
	- [x] file explore
	- [x] task explore
	- [x] armory explore
- [ ] command
	- [ ] 实现armory相关功能
		- [x] 实现alias
		- [ ] 实现extension
		- [x] 实现armory管理器
  - [x] 实现module相关command
  - [x] 实现与server交互的相关命令
  - [x] 实现pipeline的相关命令
  - [x] 实现website的相关命令

## v0.0.2

- [x] 补全因部分测试项未通过导致v0.0.1未能如期发布的功能
- [ ] client端重构
	- [x] 从grumble切换到 https://github.com/reeflective/console
	- [x] 优化用户体验
		- [x] 优化TUI体验
		- [x] implant交互的基本命令按照其原本用法重写
	- [x] 支持website
- [ ] CI/CD支持
	- [x] 允许用户使用github action/docker等快速编译implant
	- [x] server/client的CI/CD
- [ ] implant优化
	- [x] 提供更多的编译选项, MSVC, MUSL等
	- [x] 优化编译时间
- [ ] winkit
	- [x] Inline PE
	- [ ] RunPE cross arch  (推迟到v0.0.3)
	- [x] Amsi Etw Community
- [ ] 实现mal插件功能
	- [x] 支持lua作为插件脚本语言(后续可能会支持CS的CNA)
	- [x] 创建mals插件索引仓库
	- [ ] 添加插件使用文档与插件开发文档  (推迟到v0.0.3)
- [ ] 提供默认插件包
	- [x] gogo
	- [x] zombie
	- [x] spray
	- [ ] 默认的lua拓展包 (推迟到v0.0.3)
	- [ ] 基本Bofs, 参考Havok提供的BOF  (推迟到v0.0.3)
- [x] 添加第三方app通知的支持以及相关api

## v0.0.3

- [ ] client
	- [x] 新增client端插件类型 golang
	- [x] 重构explorer
		- [ ] 实现process explorer
		- [ ] 实现netstat explorer
		- [ ] 实现services explorer
	- [ ] 实现profile, 能自定义自动加载的插件集
	- [ ] 初步实现通过client实现的自动化编译
	- [ ] mals 插件仓库
		- [ ] 实现插件从github自动下载管理
		- [ ] 提供默认插件集合
- [ ] server/listener
	- [ ] 重构listener的parser, 尝试兼容第三方C2
	- [ ] 添加donut, srdi, sgn等rpc, 实现shellcode的自定义操作
- [ ] implant
	- [ ] 提供多运行时支持, tokio, futures
	- [ ] 提供基本的流量加密选项
	- [ ] 更优雅的自动化编译
	- [ ] 新的原生module
		- [ ] services操作
		- [ ] 注册表操作
		- [ ] 计划任务操作
		- [ ] token模拟相关实现
		- [ ] screenshot
		- [ ] WMI/COM (待定)
	- [ ] StackSpoofer
	- [ ] SleepMask Community 
	- [ ] 实现stage 1 loader
	- [ ] 实现autorun, 运行在编译时通过yaml配置一系列自动执行的任务


## 发布Professional

预计9-10月发布

Professinal 同样以implant源码的方式(不包含win-kit)交付给使用者, 共用server/listener/client基建.

与Community对比新增的功能:

* OPSEC
	* 定制特征的SleepMask
	* 堆栈混淆(StackSpoofer)
* 提供新的编译工具链
	* 基于cross的交叉编译工具, 
	* 通过xargo定制std以及其中特征
	* ollvm(第一个版本可能来不及实现)
* professinal版本的win-kit,
	*  允许定制indirect-syscall, alloc等各种细节
	* 提供MSVC+GNU版本, 更自由的选择编译工具链
* 嵌入流量工具 rem
* stage 0 generator



## v0.1.0

**中期计划**

预计在2025年前发布, 此时IoM将具有一个下一代C2应有的能力.   并具有商业化的潜力, 赋能所有攻击模拟需求用户.

对于IoM来说, 在计划中但是还未实现功能实在太多了, 多到没办法通过Todo List展示. 

我们添加了[roadmap.md](wiki/IoM/roadmap.md)用来管理IoM的进度.


*(todo list 暂未细化)*

- [ ] generator loader 
- [ ] 自定义的ollvm 编译器
- [ ] OPSEC
	- [ ] sleep mask
	- [ ] 堆栈混淆
	- [ ] 定制化的OPSEC相关功能
- [ ] 解耦rpc与melefic的关联, 并提供自定义implant的api与文档
- [ ] HVNC
- [ ] 使用rem作为内置流量控制器
- [ ] 提供与server交互的SDK
- [ ] 初步支持webshell
- [ ] 提供完整的文档说明
	- [ ] 用户手册
	- [ ] 插件开发文档
	- [ ] SDK文档


## v1.0.0

**终极目标**


预计在2025年内发布, 此时的IoM将能作为一体化平台的一部分, 提供Post-Exploit部分能力. 

(todo list 暂未细化, 施工中)

- [ ] 提供GUI
- [ ] 与一体化攻击平台集成
- [ ] ATT&CK
	- [ ] 基于ATT&CK建立自己的OPSEC矩阵
	- [ ] 添加ATT&CK攻击路线图自动生成
