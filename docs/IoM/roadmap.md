## v0.0.1

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
    - [ ] 兼容sliver armory extension的dll加载

- [x] 实现profile, 能自定义opsec特征

- [ ] token模拟相关实现

- [x] 进程操作

    - [x] 进程镂空（process hollowing）
    - [x] 进程注入（process inject）
        - [x] 基本进行注入操作
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
- [x] 解耦listener
- [x] 实现session的message持久化存储, 并能从缓存中恢复
- [x] 记录所有的操作， 并提供审计日志
- [x] 实现deamon
- [x] 实现rootrpc, 实现一系列高权限管理操作
- [x] 证书管理与随机化证书特征
- [x] 支持config管理server配置

#### Listener

listener是独立部署的组件, 通过pipeline解析并转发implant的数据到server

- [x] 实现pipeline相关功能
  - [x] 实现TCP pipeline
  - [x] 实现pipeline的wrap TLS
  - [x] 实现pipeline的wrap encryption
  - [ ] 实现与server/client的交互
- [ ] 实现website相关功能
  - [x] 实现web的增删改查
  - [ ] 实现与server/client的交互

### Client

- [ ] 通过交互式的tui尽可能提高cli的用户体验
  - [x] session explore
  - [x] file explore
  - [x] task explore
  - [x] armory explore

- [ ] command
  - [ ] 实现armory相关功能
    - [x] 实现alias
    - [x] 实现extension
    - [x] 实现armory管理器

  - [x] 实现module相关command
  - [x] 实现与server交互的相关命令
  - [ ] 实现pipeline的相关命令
  - [ ] 实现website的相关命令





## v0.1.0



## v1.0.0

