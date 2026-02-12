---
title: IoM Client 开发指南
---

# Client 开发指南

本指南介绍如何为IoM的Client组件进行开发和贡献。Client是用户与IoM系统交互的主要界面。

!!! info "回到总览"
    返回[开发者贡献指南](index.md) | 查看[Server开发指南](server.md) | 查看[Implant开发指南](implant.md)

## 环境配置

环境配置client与server完全一致， 按需取用

??? important "Go开发环境"
	**版本要求**: Go >= 1.20
	
	!!! tip "推荐golang 1.20"
	    golang 1.20是兼容Win7的最后一个版本
	
	```bash
	go version
	```

??? important "protobuf环境"
	=== "Linux"
	
	    使用 `apt` 或 `apt-get`:
	    ```bash
	    apt install -y protobuf-compiler 
	    protoc --version  # 确保版本 >= 3
	    ```
	
	=== "macOS"
	
	    使用 [Homebrew](https://brew.sh/):
	    ```bash
	    brew install protobuf
	    protoc --version
	    ```
	
	=== "Windows"
	
	    使用 [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/):
	    ```bash
	    winget install protobuf 
	    protoc --version
	    ```
	
	**protobuf Go插件 (指定版本)**
	```bash
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0  
	go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.1  
	```
	
	!!! tip "参考官方文档"
	    更多安装选项请参考 [protobuf.dev/installation](https://protobuf.dev/installation/)

??? "项目设置"
	1. **Fork并克隆仓库**
	   ```bash
	   git clone --recurse-submodules https://github.com/your-username/malice-network.git
	   cd malice-network
	   git remote add upstream https://github.com/chainreactors/malice-network.git
	   ```
	
	2. **安装依赖**
	   ```bash
	   go mod tidy
	   ```
	
	3. **生成protobuf文件** (如果修改了proto定义)
	   ```bash
	   go generate ./client
	   ```
	
	4. **编译server**
	   ```bash
	   go build ./client/
	   ```
	
## Client架构

### 核心功能

### 插件管理

Client支持多种插件管理系统：

- **mal**: IoM支持的插件语言带来的拓展能力，当前支持lua
- **addon**: 内存中保存二进制程序，避免重复传输
- **module**: 动态加载的implant module
- **alias**: sliver中的alias，主要用来管理CLR与UDRL的DLL程序
- **extension**: sliver中的extension，主要用来管理BOF与sliver特定格式的dll
- **armory**: sliver的插件包管理工具

这些动态拓展的插件可以满足绝大部分场景， 但对于一些较为复杂，或者需要成为通用能力的功能，需要注册到command中。 本文档主要帮助想要添加新的command

## 开发实践

IoM的命令开发基于三个主要拓展方式：**Command**、**RPC**、**Module**。

### Command开发

包含四个步骤：

#### 1. 编写功能函数

功能函数专注于业务逻辑，与具体命令接口解耦：

```go
func Env(rpc clientrpc.MaliceRPCClient, session *core.Session) (*clientpb.Task, error) {
	task, err := rpc.Env(session.Context(), &implantpb.Request{
		Name: consts.ModuleEnv,
	})
	if err != nil {
		return nil, err
	}
	return task, err
}
```

#### 2. 编写命令包装函数

将功能函数包装为Cobra命令处理函数：

```go
func EnvCmd(cmd *cobra.Command, con *repl.Console) error {
	session := con.GetInteractive()
	task, err := Env(con.Rpc, session)
	if err != nil {
		return err
	}
	session.Console(task, string(*con.App.Shell().Line()))
	return nil
}
```

#### 3. 注册到Mal插件系统

将功能注册到mal插件系统和全局callback中：

```go
func RegisterEnvFunc(con *repl.Console) {
	con.RegisterImplantFunc(
		consts.ModuleEnv,
		Env,
		"benv", // mal中的别名
		func(rpc clientrpc.MaliceRPCClient, sess *core.Session) (*clientpb.Task, error) {
			return Env(rpc, sess)
		},
		output.ParseKVResponse,    // 解析函数
		output.FormatKVResponse)   // 格式化函数

	con.AddCommandFuncHelper(
		consts.ModuleEnv,
		consts.ModuleEnv,
		"env(active())",
		[]string{
			"sess: special session",
		},
		[]string{"task"})
}
```

#### 4. 定义Cobra命令

在`commands.go`中定义Cobra命令接口：

```go
envCmd := &cobra.Command{
	Use:   consts.ModuleEnv,
	Short: "List environment variables",
	RunE: func(cmd *cobra.Command, args []string) error {
		if len(args) == 0 {
			return EnvCmd(cmd, con)
		} else {
			return fmt.Errorf("unknown cmd '%s'", args[0])
		}
	},
	Annotations: map[string]string{
		"depend": consts.ModuleEnv,
		"ttp":    "T1134",
	},
}
```

### 分层架构优势

这种分层设计带来以下优势：

1. **功能复用**: 功能函数可以被多个接口调用
2. **测试友好**: 可以单独测试业务逻辑
3. **插件集成**: 自动集成到mal插件系统
4. **类型安全**: 通过强类型确保接口一致性

### 参数处理模式

#### 简单参数
```go
func SimpleCmd(cmd *cobra.Command, con *repl.Console) error {
	param := cmd.Flags().Arg(0) // 获取位置参数
	session := con.GetInteractive()
	task, err := SimpleFunc(con.Rpc, session, param)
	// ...
}
```

#### 复杂参数
```go
func ComplexCmd(cmd *cobra.Command, con *repl.Console) error {
	flag1, _ := cmd.Flags().GetString("flag1")
	flag2, _ := cmd.Flags().GetBool("flag2")
	session := con.GetInteractive()
	task, err := ComplexFunc(con.Rpc, session, flag1, flag2)
	// ...
}
```

### 命令开发要点

#### Annotations标注
- **depend**: 指定依赖的Module名称
- **ttp**: MITRE ATT&CK技术ID
- **其他**: 可以添加自定义标注

#### 参数处理
- 使用`cobra.ExactArgs(n)`限制参数数量
- 使用`cmd.Flags().Arg(index)`获取位置参数
- 使用`cmd.Flags().GetString("flag")`获取标志参数

#### 复杂参数补全示例

以HTTP Pipeline命令为例，展示完整的参数处理和补全机制：

```go
// 创建复杂命令
httpCmd := &cobra.Command{
	Use:   consts.HTTPPipeline,
	Short: "Register a new HTTP pipeline and start it",
	Long:  "Register a new HTTP pipeline with the specified listener.",
	RunE: func(cmd *cobra.Command, args []string) error {
		return NewHttpPipelineCmd(cmd, con)
	},
	Args: cobra.MaximumNArgs(1),
	Example: `~~~
// Register an HTTP pipeline with the default settings
http --listener http_default

// Register an HTTP pipeline with custom headers and error page
http --name http_test --listener http_default --host 192.168.0.43 --port 8080 --headers "Content-Type=text/html" --error-page /path/to/error.html

// Register an HTTP pipeline with TLS enabled
http --listener http_default --tls --cert_path /path/to/cert --key_path /path/to/key
~~~`,
}

// 绑定多组标志位
common.BindFlag(httpCmd, 
	common.PipelineFlagSet,    // 基础pipeline标志
	common.TlsCertFlagSet,     // TLS证书标志
	common.SecureFlagSet,      // 安全相关标志
	common.EncryptionFlagSet,  // 加密相关标志
	func(f *pflag.FlagSet) {   // 自定义标志
		httpCmd.Flags().StringToString("headers", nil, "HTTP response headers (key=value)")
		httpCmd.Flags().String("error-page", "", "Path to custom error page file")
	})

// 绑定参数补全
common.BindFlagCompletions(httpCmd, func(comp carapace.ActionMap) {
	comp["listener"] = common.ListenerIDCompleter(con)
	comp["host"] = carapace.ActionValues().Usage("http host")
	comp["port"] = carapace.ActionValues().Usage("http port")
	comp["cert"] = carapace.ActionFiles().Usage("path to the cert file")
	comp["key"] = carapace.ActionFiles().Usage("path to the key file")
	comp["tls"] = carapace.ActionValues().Usage("enable tls")
	comp["error-page"] = carapace.ActionFiles().Usage("path to error page file")
	comp["headers"] = carapace.ActionValues().Usage("http headers (key=value)")
	comp["cert-name"] = common.CertNameCompleter(con)
})

// 标记必需参数
httpCmd.MarkFlagRequired("listener")
```

#### 补全系统特性

1. **多类型补全**: 
   - `ActionValues()`: 静态值补全
   - `ActionFiles()`: 文件路径补全
   - 自定义Completer: 动态数据补全

2. **标志位组合**: 
   - 使用`common.BindFlag`组合多个FlagSet
   - 支持复用常见标志位组合

3. **动态补全**: 
   - `ListenerIDCompleter`: 补全可用的监听器ID
   - `CertNameCompleter`: 补全证书名称
   - 基于当前系统状态的智能补全

4. **参数验证**:
   - `MarkFlagRequired()`: 标记必需参数
   - `cobra.MaximumNArgs()`: 参数数量限制
   - 自动验证和错误提示

### 错误处理

命令函数应该返回error，框架会自动处理错误显示：

```go
func ExampleCmd(cmd *cobra.Command, con *repl.Console) error {
	session := con.GetInteractive()
	if session == nil {
		return fmt.Errorf("no active session")
	}
	
	// ... 命令逻辑
	
	return nil // 或返回具体错误
}
```


## 插件生态

### Mal插件

IoM支持基于Lua的客户端插件，详细开发指南将在独立文档中提供。

### Armory兼容

IoM兼容sliver的Armory生态，支持：
- **alias**: 命令别名和预设
- **extension**: BOF和其他扩展

详细使用方法参考[Armory生态文档](https://github.com/sliverarmory/armory)。



## 相关资源

- [IoM设计文档](/IoM/design/) - 了解整体架构
- [Mal插件文档](/IoM/manual/mal/) - 插件开发详细指南
- [Server开发指南](server.md) - 服务端开发
- [Implant开发指南](implant.md) - 植入物开发
- [Armory生态](https://github.com/sliverarmory/armory) - Sliver插件生态

---

[⬅️ 返回开发者指南](index.md)
