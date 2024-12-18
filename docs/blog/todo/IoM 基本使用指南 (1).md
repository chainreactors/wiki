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

* **自动化工作流触发**：

  通过命令行传递配置，client能够自动触发GitHub工作流，编译指定类型的malefic。执行完GitHub工作流后，server会从github artifact中下载对应的artifact。

  Github相关配置在client所处主机的~/.config/malice/malice.yaml下进行设置。

  ```
  resources: ""
  tmp: ""
  aliases: []
  extensions:[]
  mals:[]
  settings:
    tables: ""
    autoadult: false
    beacon_autoresults: false
    small_term_width: 0
    always_overflow: false
    vim_mode: false
    default_timeout: 0
    max_server_log_size: 10
    github_repo:                           # malefic的仓库名
    github_owner:                          # github用户名 
    github_token:                          # github的token 
    github_workflow_file: generate.yaml    # workflow的配置文件名
    opsec_threshold: ""
    vt_api_key: ""
  
  ```

  命令示例：

  ```
  action run --profile test --type beacon --target x86_64-pc-windows-msvc
  ```

  为了统一使用，action run的参数命令与docker build的参数基本一致，只是需要使用 `type` 来指定编译阶段。从server上下载action的artifact也与docker的下载流程一致，使用artifact list展示所有artifact时，会使用 `source` 字段区分 `action` 和 `docker ` 。

- **pulse自动link**：

  目前生成pulse，需要使用前置的beacon或bind。

  docker和action生成pulse时，现在需要指定前置beacon或者bind的 `artifact_id` ，当 `artifact_id`为0并且使用的profile中pulse下的 `artifact_id` 也为0时，server会自动编译新的beacon转化成shellcode，并且和pulse绑定。

  ```
  # Github action
  action run --profile test --type pulse --target x86_64-pc-windows-msvc --artifact-id 0
  
  # Docker build 
   build pulse --profile test --target x86_64-pc-windows-gnu --artifact-id 0
  ```

  转换成shellcode的beacon和bind会设置`is_srdi` 为true来和未转换的artifact作为区分。

- **Docker编译队列**：

  由于Docker编译malefic时，会占用大量的cpu和内存，而由于部署server的服务器一般配置都较为有限，这会导致编译过程中的资源争用，影响服务器的其他任务运行。为了避免这种情况，我们引入了Docker编译队列机制，目前编译队列默认允许同时只有一个编译任务运行。
