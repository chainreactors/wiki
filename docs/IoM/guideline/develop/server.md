---
title: IoM Server 开发指南
---

# Server 开发指南

本指南介绍如何为IoM的Server组件进行开发和贡献。Server是IoM的核心数据处理和交互服务。

!!! info "回到总览"
    返回[开发者贡献指南](index.md) | 查看[Client开发指南](IoM/guideline/develop/client.md) | 查看[Implant开发指南](IoM/guideline/develop/implant.md)

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
	   go build ./server/
	   ```
	

## 开发实践

### 扩展Proto协议

为了适用大部分场景中， 我们添加两个较为通用的proto。适配绝大部分场景， 如果可以满足你的需求， 请优先使用这两个proto

```protobuf
message Request {  
  string name = 1;  
  string input = 2;  
  repeated string args = 3;  
  map<string, string> params = 4;  
  bytes bin = 5;  
}  
  
message Response {  
  string output = 1;  
  string error = 2;  
  map<string, string> kv = 3;  
  repeated string array =4;  
}
```

如果这两个通用的proto无法满足， 才需要考虑修改proto

1. **修改proto文件**

在`proto/implant/implantpb/implant.proto`中添加新的message：

```protobuf
message NewCommand {
    string param = 1; 
}
```

将message添加到Spite的body oneof中：

```protobuf
message Spite {  
  // ... 其他字段
  oneof body {  
    // ... 其他消息类型
    NewCommand new_command = 999;    
  }
}
```

2. **修改server常量**

在`helper/types/message.go`中添加：

```go
MsgNewCommand MsgName = "new_command"
```

在`buildSpite`中添加对应的message处理：

```go
case *implantpb.NewCommand:
   spite.Name = MsgNewCommand.String()
   spite.Body = &implantpb.Spite_NewCommand{NewCommand: msg.(*implantpb.NewCommand)} 
```

3. **添加protobuf rpc**

在`proto/services/clientrpc/service.proto`中添加：

```protobuf
service MaliceRPC {  
  // ... 其他RPC
  rpc NewCommandRpc(implantpb.NewCommand) returns (clientpb.Task);
}
```



### 添加新的RPC接口

Server端提供两种类型的RPC实现：普通RPC和流式RPC。

#### 1. 普通RPC

适用于简单的请求-响应模式：

```go
func (rpc *Server) NewCommand(ctx context.Context, req *implantpb.Request) (*clientpb.Task, error) {
	greq, err := newGenericRequest(ctx, req)
	if err != nil {
		return nil, err
	}
	ch, err := rpc.asyncGenericHandler(ctx, greq)
	if err != nil {
		return nil, err
	}

	go greq.HandlerAsyncResponse(ch, types.MsgResponse)
	return greq.Task.ToProtobuf(), nil
}
```

#### 2. 流式RPC

适用于需要分块传输或实时数据流的场景：

**Execute示例 (实时输出流)**:

```go
func (rpc *Server) Execute(ctx context.Context, req *implantpb.ExecRequest) (*clientpb.Task, error) {
	greq, err := newGenericRequest(ctx, req)
	if err != nil {
		return nil, err
	}
	
	if !req.Realtime {
		// 非实时模式：普通RPC
		ch, err := rpc.GenericHandler(ctx, greq)
		if err != nil {
			return nil, err
		}
		go greq.HandlerResponse(ch, types.MsgExec)
	} else {
		// 实时模式：流式RPC
		greq.Count = -1  // 无限流
		_, out, err := rpc.StreamGenericHandler(ctx, greq)
		if err != nil {
			return nil, err
		}

		go func() {
			for {
				resp := <-out
				exec := resp.GetExecResponse()
				
				// 验证响应
				err := handler.AssertSpite(resp, types.MsgExec)
				if err != nil {
					greq.Task.Panic(buildErrorEvent(greq.Task, err))
					return
				}
				
				// 处理响应
				err = greq.HandlerSpite(resp)
				if err != nil {
					return
				}
				
				// 检查是否结束
				if exec.End {
					greq.Task.Finish(resp, "")
					break
				}
			}
		}()
	}

	return greq.Task.ToProtobuf(), nil
}
```



### Listener开发

Listener与Server是解耦的，可以独立部署。开发新的Listener类型：

1. **实现Pipeline接口**
2. **实现Parser接口** 
3. **实现Cryptor接口** 

参考现有的TCP/HTTP实现进行开发。

#todo


## 相关资源

- [IoM设计文档](/IoM/design/) - 了解整体架构
- [Proto仓库](https://github.com/chainreactors/proto) - 协议定义
- [Client开发指南](IoM/guideline/develop/client.md) - 客户端开发
- [Implant开发指南](IoM/guideline/develop/implant.md) - 植入物开发

---

[⬅️ 返回开发者指南](index.md)
