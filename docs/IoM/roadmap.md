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

**基于社区的插件生态**

兼容 cobaltstrike 的 cna 插件生态。

实现自己的脚本语言的服务端/客户端插件，通过 lua 或者 yaklang，更或是任意语言的。

 **联动 ASM**

通过 IoM  作为跳板， 将 ASM 引入到内网实现自动化的攻击面探测。

## v0.0.1 下一代C2框架

**短期计划**

预计在2024年8月份发布
### Implant

- [x] 实现melefic调度器
    - [x] 支持异步调度module
    - [x] 实现task管理相关功能
    - [x] 实现module管理相关功能
- [x] 实现基本命令
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
- [x] 实现拓展能力
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
- [x] OPSEC
    - [x] syscall
    - [x] indirect syscall
    - [x] UDRL
    - [x] 内存与静态文件字符串混淆

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
- [x] 实现website相关功能
	- [x] 实现web的增删改查
	- [x] 实现与server/client的交互
- [x] 提供独立的配置listener.yaml 文件


### Client

- [x] 通过交互式的tui尽可能提高cli的用户体验
	- [x] session explore
	- [x] file explore
	- [x] task explore
	- [x] armory explore
- [x] command
	- [x] 实现armory相关功能
		- [x] 实现alias
		- [x] 实现extension
		- [x] 实现armory管理器
  - [x] 实现module相关command
  - [x] 实现与server交互的相关命令
  - [x] 实现pipeline的相关命令
  - [x] 实现website的相关命令

## v0.0.2 the Real Beginning

- [x] 补全因部分测试项未通过导致v0.0.1未能如期发布的功能
- [x] client端重构
	- [x] 从grumble切换到 https://github.com/reeflective/console
	- [x] 优化用户体验
		- [x] 优化TUI体验
		- [x] implant交互的基本命令按照其原本用法重写
	- [x] 支持website
- [x] CI/CD支持
	- [x] 允许用户使用github action/docker等快速编译implant
	- [x] server/client的CI/CD
- [x] implant优化
	- [x] 提供更多的编译选项, MSVC, MUSL等
	- [x] 优化编译时间
- [x] winkit
	- [x] Inline PE
	- [ ] RunPE cross arch  (推迟到v0.0.3)
	- [x] Amsi Etw Community
- [x] 实现mal插件功能
	- [x] 支持lua作为插件脚本语言(后续可能会支持CS的CNA)
	- [x] 创建mals插件索引仓库
	- [x] 添加插件使用文档与插件开发文档  (推迟到v0.0.3)
- [x] 提供默认插件包
	- [x] gogo
	- [x] zombie
	- [x] spray
	- [x] 默认的lua拓展包 (推迟到v0.0.3)
	- [x] 基本Bofs, 参考Havok提供的BOF  (推迟到v0.0.3)
- [x] 添加第三方app通知的支持以及相关api

## v0.0.3 真正意义上的红队基础设施与C2框架

- [ ] client
	- [x] 新增client端插件类型 golang
	- [x] 重构explorer
		- [x] 实现taskschd explorer
		- [x] 实现registry explorer
	- [x] 实现profile, 能自定义自动加载的插件集
	- [x] 初步实现通过client实现的自动化编译
	- [x] 修复 Client bug, https://github.com/chainreactors/malice-network/issues/16
	- [ ] mals 插件仓库
		- [x] 实现插件从github自动下载管理
		- [x] 实现lua插件函数文件
		- [x] 提供lua插件定义文件
		- [ ] 提供默认插件集合
			- [x] default-bof
			- [x] default-elevate
			- [ ] default-stay
			- [x] default-move
			- [x] default-chainreactor
- [ ] server/listener
	- [x] 重构listener的parser, 尝试兼容第三方C2
	- [x] 添加donut, srdi, sgn等rpc, 实现shellcode的自定义操作
- [ ] implant
	- [x] 提供基本的流量加密选项
	- [x] 更优雅的自动化编译
	- [x] 实现Bind模式的implant
	- [x] 新的原生module
		- [x] services操作
		- [x] 注册表操作
		- [x] 计划任务操作
		- [x] token模拟相关实现
		- [x] screenshot (使用bof代替)
		- [x] WMI/COM (待定)
	- [x] StackSpoofer
	- [ ] SleepMask Community , (计划使用新的堆加密技术代替)
	- [x] 实现stage 1 loader
	- [x] 实现autorun, 运行在编译时通过yaml配置一系列自动执行的任务

## v0.0.4 Bootstrapping

- implant
	- [x] 修复对win7兼容性  (部分解决)
		- [x] execute/inline_assembly win7 兼容(目前使用donut临时解决)
		- [x] MSVC win7兼容
		- [x] GNU win7 兼容
	- [x] 解决TLS问题
	- [x] 去掉netstat2， sysinfo， whoami， wmi库依赖， 转为内部实现
	- [x] malefic-sRDI
	- [x] DLLSpawn
	- [x] Makefile 重构
	- [ ] bug修复
- client/server
	- [x] 新增artifact相关命令和lua api
	- [x] 新增action 命令组， 控制github action 编译
	- [x] 新增donut命令，实现donut v1.1的全部功能
	- [x] 重构并简化docker编译
		- [x] pulse 自动联动编译
		- [x] modules自动联动编译
		- [x] 编译队列
	- [x] sgn和malefic-mutant转为编译时嵌入
	- [x] client非交互模式


## v0.0.5 代替CobaltStrike的最后四块碎片

原本计划从v0.0.4直接跨越到v0.1.0， 但是需要实现的功能比预期多得多。

- Server
	- [x] 实现Context相关RPC
		- [x] port
		- [ ] cred
		- [x] screenshot
		- [x] pivoting
		- [x] upload
		- [x] download
	- [x] 添加REM pipeline
	- [x] 数据库重构
- Client
	- [x] 接入REM
		- [x] reverse
		- [x] proxy
		- [x] portforward
		- [x] portfoward local
	- [x] 插件系统正式版
	- [ ] 插件完成生态迁移
	- [x] Client 命令渲染重构
	- [x] GUI 测试开启
- Implant
	- [ ] malefic-SRDI与Donut 合并，重构
	- [ ] 修复Inline local 
	- [ ] OLLVM 落地
	- [x] 去掉所有第三方依赖
	- [ ] 实现linux-kit
		- [ ] memfd
		- [ ] linux bof
		- [ ] execute_elf
		- [ ] execute_so
	- [ ] 3rd module
		- [x] rem-static
		- [x] rem-reflection
		- [ ] keylogger
		- [ ] vnc


## v0.1.0 (Professional release)

预计在2025年前发布, 此时IoM将具有一个下一代C2应有的能力.   并具有商业化的潜力, 赋能所有攻击模拟需求用户.

经过三个版本的迭代, 已经实现了绝大部分必要的组件, 我们终于有精力腾出手去实现 professional 

professional 同样以implant源码的方式(不包含win-kit)交付给使用者, 共用server/listener/client基建

TODO list

与Community对比新增的功能:

* OPSEC特性
	* 专属的堆加密
	* 定制indirect-syscall, alloc等各种细节
	* 专属的进程注入方式
	* 专属的SRDI
	* 专属的PE loader
	* 专属shellcode template
	* 提供MSVC+GNU版本, 更自由的选择编译工具链
	* ollvm(第一个版本可能来不及实现)
	* 密码学前向后向安全
	* 反沙箱
	* 反调试
* 额外功能
	* Professional 专属OPSEC工具包
	* linux-kit
	* 内置流量工具rem, 支持所有技术的代理与端口转发技术


**v0.1.0 的主要工作将是完善文档, linux kit, ollvm, GUI** 

TODO list

- client
	- [ ] 完善golang插件, 实现更自由的插件系统
	- [ ] 实现基本的GUI client
- implant
	- [ ] 添加更丰富的编译选项, 实现对implant每个细节的控制
	- [ ] 实现llvm pass插件, 适配ollvm
	- [ ] 实现linux-kit
		- [ ] memfd
		- [ ] linux bof
		- [ ] execute_elf
		- [ ] execute_so
	- [ ] HVNC
	- [ ] 适配rem
	- [ ] 可组装的loader
	- [ ] 反沙箱
	- [ ] 反调试
	- [ ] webshell implant的初步实现
		- [ ] jsp
		- [ ] aspx
- [ ] 文档
	- [ ] malefic-helper api文档
	- [ ] 二次开发文档
	- [ ] 插件的开发与迁移文档
	- [ ] 各个功能的最佳实践文档
	- [ ] 3-5篇技术细节文档
	- [ ] OPSEC文档
	- [ ] 重构设计文档
	- [ ] 优化自动生成的插件与help文档
## v1.0.0

**终极目标**


预计在2025年内发布, 此时的IoM将能作为一体化平台的一部分, 提供Post-Exploit部分能力. 

(todo list 暂未细化, 施工中)

- [ ] 提供GUI
- [ ] 与一体化攻击平台集成
- [ ] ATT&CK
	- [ ] 基于ATT&CK建立自己的OPSEC矩阵
	- [ ] 添加ATT&CK攻击路线图自动生成
- [ ] OPSEC 模型
