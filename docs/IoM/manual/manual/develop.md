---
title: Internal of Malice · 开发
---

!!! danger "当前IoM位于早期阶段, 各种API都能会进行不兼容重构"
	暂时不建议对IoM进行二次开发,  到v0.1.0之后, 我们对API调整时会考虑兼容性

## 拓展 proto

server与implant通过共享子模块定义通讯协议. 其中描述implant部分的请见: https://github.com/chainreactors/proto/blob/master/implant/implantpb/implant.proto

对于绝大部分场景,  `implant.proto` 提供了一组通用Message, 能描述绝大部分文本输出的数据. 不需要新增message. 使用已有的proto即可. 

```protobuf
message Request {  
  string name = 1;  
  string input = 2;  
  repeated string args = 3;  
  map<string, string> params = 4;  
}  
  
message Response {  
  string output = 1;  
  string error = 2;  
  map<string, string> kv = 3;  
}
```


#### 新增message

如果没有创建自定义的message, 可以跳过这个步骤. 

如果新增了message, 则需要通用数据包`Spite`中新增body类型, 并且在server中添加对应的解析代码与常量. 

!!! tips "新增message的操作较为复杂"
	如果第一次尝试编写module, 建议先跳过这个步骤. 新增message需要在server,client,implant多出进行修改. 
	这是一个有一点点挑战性的工作.

**修改proto文件**

在项目中的 `proto/implant/implantpb/implant.proto` 中修改

新增一个message

```
message Example {
	string example = 1; 
}
```

将message添加到spite的body oneof中

```protobuf
message Spite {  
  string name = 1;  
  uint32 task_id = 2;  
  bool  async = 3;  
  uint64 timeout = 4;  
  uint32 error = 5;  
  Status status = 6;  
  
  oneof body {  
    Empty empty = 10;  
    Block block = 11;  
    AsyncACK async_ack = 13;  
    SysInfo sysinfo = 20;  
    Register register = 21;  
    Ping ping = 22;  
    Suicide suicide = 23;  
    Request request = 24;  
    Response response = 25;  
	...
	Example example = 999;    
	}
```

这时候我们就可以在server/client/implant中使用这个message了

**修改server**

server中有个常量表定义了所有用到的message.

`helper/types/message.go`

```go
MsgUnknown          MsgName = "unknown"  
MsgNil              MsgName = "nil"  
MsgEmpty            MsgName = "empty"  
MsgRequest          MsgName = "request"
...
MsgExample          MsgName = "example"
```

并在buildspite中添加对应的message, 用来让server动态解析对应的数据. 

```go
func BuildSpite(spite *implantpb.Spite, msg proto.Message) (*implantpb.Spite, error) {  
    switch msg.(type) {  
    case *implantpb.Request:  
       spite.Name = msg.(*implantpb.Request).Name  
       spite.Body = &implantpb.Spite_Request{Request: msg.(*implantpb.Request)}  
    case *implantpb.Block:  
       spite.Name = MsgBlock.String()  
       spite.Body = &implantpb.Spite_Block{Block: msg.(*implantpb.Block)}
    ...
    case *implantpb.Example:
	   spite.Name = MsgExample.String()
       spite.Body = &implantpb.Spite_Example{Example: msg.(*implantpb.Example)} 
```

如果只是个中间message, 不需要暴露到client作为命令使用, 则不需要更多的修改. 如果要在client中也使用到这个message.  还需要在consts的模块常量表中添加. 

```go
ModuleUpdate           = "update"  
ModuleExecution        = "exec"  
ModuleExecuteAssembly  = "execute_assembly"  
ModuleInlineAssembly   = "inline_assembly"
...
ModuleExample = "example"
```

**添加protobuf rpc**

在`proto/services/clientrpc/service.proto` 中添加client与server交互的rpc

```protobuf
service MaliceRPC {  
  ...

  rpc Pwd(implantpb.Request) returns (clientpb.Task);  
  rpc Ls(implantpb.Request) returns (clientpb.Task);  
  rpc Cd(implantpb.Request) returns (clientpb.Task);  
  rpc Rm(implantpb.Request) returns (clientpb.Task);  
  rpc Mv(implantpb.Request) returns (clientpb.Task);  
  rpc Cp(implantpb.Request) returns (clientpb.Task);
  ...
  rpc ExampleRpc(implant.Request) returns (clientpb.Task);
```

我们之前定义的example message 可以作为请求值也可以作为返回值. 

如果作为返回值, IoM整体都需要通过Task进行回调. 所以与implant交互的rpc的返回值统一为Task. 如果.

如果作为请求值, 则可以使用在rpc的请求定义中, 例如

```protobuf
  rpc ExampleRpc(implant.Example) returns (clientpb.Task);
```

好了, 定义部分现在就完成了, 可以编写对应的代码.

## 拓展rpc

与malefic的module类似. server端的代码也是高度模板化的.

实际上, 我们几乎所有module的server端代码都是通过copilot生成的. 

```go
func (rpc *Server) Cat(ctx context.Context, req *implantpb.Request) (*clientpb.Task, error) {
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

因为rpc的传入值通过rpc定义, 所以只需要显示校验返回值.  也就是这一行中的`types.MsgResponse`

```
	go greq.HandlerAsyncResponse(ch, types.MsgResponse)
```

在cat中, 使用了通用返回值`Response`.

## 新增command

贯彻IoM统一的设计风格, client端代码也是模板化的. 

然后在client添加相关实现

```go
func CatCmd(ctx *grumble.Context, con *console.Console) {  
    session := con.GetInteractive()  
    if session == nil {  
       return  
    }  
    fileName := ctx.Flags.String("name")  
    catTask, err := con.Rpc.Cat(con.ActiveTarget.Context(), &implantpb.Request{  
       Name:  consts.ModuleCat,  
       Input: fileName,  
    })  
    if err != nil {  
       console.Log.Errorf("Cat error: %v", err)  
       return  
    }  
    con.AddCallback(catTask.TaskId, func(msg proto.Message) {  
       resp := msg.(*implantpb.Spite).GetResponse()  
       con.SessionLog(session.SessionId).Consolef("File content: %s\n", resp.GetOutput())  
    })  
}
```

在`client/command/filesystem/commands.go` 中定义命令行接口.  后续可能会从grumble切换到其他的命令行交互的库, 但是代码编写上不会有太大改动

```go
...
		&grumble.Command{
			Name: consts.ModuleCat,
			Help: "Print file content",
			Flags: func(f *grumble.Flags) {
				f.String("n", "name", "", "File name")
			},
			LongHelp: help.GetHelpFor(consts.ModuleCat),
			Run: func(ctx *grumble.Context) error {
				CatCmd(ctx, con)
				return nil
			},
			HelpGroup: consts.ImplantGroup,
		},
...
```


## 拓展 module 

当然， 也可以自行编写自己别具特色的 `Module` ， 我们提供了灵活的编写接口的模板, 最大程度减轻开发者的工作量

module相关定义请见
#### module 示例

接下来我们以 `cat` 功能为例编写一个 `Module` :)

首先我们需要定义 `Module` 并继承拓展我们的接口, 使用proto中的 `Response` 和 `Request` 的 `proto` 传输数据的协议

接下来我们将其修改为 `cat` 的基本框架. 简单的module只需要10行以内代码就可以完成. 

```rust
use async_trait::async_trait;
use malefic_trait::module_impl;
use crate::{check_request, Module, Result, check_field, TaskResult};
use crate::protobuf::implantpb::spite::Body;

pub struct Cat{}

#[async_trait]
#[module_impl("cat")]
impl Module for Cat {
    #[allow(unused_variables)]
    async fn run(&mut self, id: u32, recviver: &mut crate::Input, sender: &mut crate::Output) -> Result {
        let request = check_request!(recviver, Body::Request)?; # 校验传入request是否合法

        let filename = check_field!(request.input)?; # 校验input参数是否不为空
        let content = std::fs::read_to_string(filename)?; # 使用std库读取对应的文件

        let mut response = crate::protobuf::implantpb::Response::default(); # 生成对应的response
        response.output = content;

        Ok(TaskResult::new_with_body(id, Body::Response(response))) # 返回TaskResult
    }
}
```

我们通过大量的宏简化了代码, 在Cat这个module中. 实际上的功能相关的只有一行. 
```
 let content = std::fs::read_to_string(filename)?; 
```


如果任务需要**多次数据接收和结果发送**， 可以多次调用 `check_request!(recviver, Body::Request)?;` 来获取数据， 使用 `sender.send()` 函数多次发送 `TaskResult` 响应


### 编写client端代码

**好了, 现在我们就成功编写了一个模块, 并打通了三端!**


## 自定义alias/extension 开发

alias/extension 完全保留了sliver的特性, 可以在这里找到对应的文档

https://github.com/BishopFox/sliver/wiki/Aliases-&-Extensions

