
## InternalModule

internal module是一组在malefic-core中定义的基本module, 用于module管理, addon管理, sleep管理, 初始化等等功能.

### basic

* sleep, 调整sleep间隔
* suicide, 退出implant进程
* ping, 交换心跳包
* clear, 清除所有额外加载的modules与addons
* init, 用于bind模式下的初始化
### ### module管理

module是malefic功能的基本单元, 每个spite都会选择一个对应的module进行各种各样的操作. 

malefic 提供了一套动态加载组装的机制, 让用户可以根据使用场景自行组装module

!!! danger "编译时添加的模块无法被卸载" 
	这里有一个好消息与一个坏消息.
	坏消息是编译时组装的模块无法被卸载, 因此请根据自己的使用场景选择合适的预设.
	好消息是虽然无法卸载, 但加载新模块时如选用了同样名称的模块, 新模块将覆盖本体的模块.(在内存中原本的模块依旧会存在)

- `list_module` 命令列出当前所有module
- `load_module` 命令则支持动态加载本地新组装的模块， 只需要 `load_modules --name xxx --path module.dll` 即可动态加载新的模块， 请注意， 如本体已经含有的模块（生成时组装的模块）， 再次加载将会覆盖该模块的功能， 是的， `load_modules` 允许覆盖本体功能
- `refresh_module`  命令将会卸载所有动态加载的模块， 包括覆盖掉的本体模块， 一切模块将恢复成编译时的初始状态

> client的使用请见[使文档module部分](/wiki/IoM/manual/implant_help/#module)
### addon 管理
addon 是为了减少数据重复传输, 提供了将数据临时加密保存在内存中的机制. 

	* list_addon ,列出已加载的addon
	* load_addon , 加载新addon
	* execute_addon , 执行已加载的addon
	* refresh_addon , 清除已加载的addon

> client的使用请见[使文档addon部分](/wiki/IoM/manual/implant_help/#addon)

### task管理

* query_task , 查询task状态
* cancel_task, 取消task, 实际上是软取消， 只是不再处理相关任务的输入和返回

> client的使用请见[使文档task部分](/wiki/IoM/manual/implant_help/#task)
## Module

module是implant中功能的基本单元, 各种拓展能力(bof,pe,dll)的执行也依赖于module实现. 

### module定义
#### trait

```rust
#[async_trait]
pub trait Module {
    fn name() -> &'static str where Self: Sized;
    fn new() -> Self where Self: Sized;
    fn new_instance(&self) -> Box<MaleficModule>;
	async fn run(&mut self, 
				id: u32, 
				receiver: &mut crate::Input, 
				sender: &mut crate::Output) -> Result 
```

我们已经实现了一个过程宏 `module_impl`, 只需要关注具体功能实现 `run` 函数, 无需编写重复杂余代码.

#### run函数定义

`id` : 即为 Task_id， 在前面的段落中我们提到，每一个用户提交的任务都被视为一个 `Task`, 并通过唯一的 `Task_id` 来进行任务状态管理

`receiver`: 用于接收传入数据, 大部分情况只需要调用一次获取一个message. 对于多个请求包或者持续性的流式输入的场景, 可以调用多次receiver, 持续获得传入数据. 

`sender`: 将所需要传出的数据发送给数据处理模块，如果需要多次返回数据的函数通过sender持续返回, 如果任务结束则通过return返回.

#### 返回值

```rust
#[derive(Clone)]  
pub struct TaskResult {  
    pub task_id: u32,    # taskid
    pub body: Body,      # protobuf中对应的Body类型
    pub status: Status   # 任务状态,成功与否, 错误原因等
}
```

#### Error

module 共用同一套错误信息, 正常运行的module返回的状态码为0

```
TaskError::OperatorError { .. } => 2,   // module内部错误
TaskError::NotExpectBody => 3,          // body与预期不匹配
TaskError::FieldRequired { .. } => 4,   // 缺少参数
TaskError::FieldLengthMismatch { .. } => 5,  // 参数长度不匹配
TaskError::FieldInvalid { .. } => 6,         // 参数错误
TaskError::NotImpl => 99,                    // 未实现的module
```

### 已实现 Modules

请见: https://github.com/chainreactors/malefic/blob/master/malefic-modules/Cargo.toml#L24-L58

malefic的设计理念之一就是模块化, 自由组装. modules部分的设计也提现了这个理念. 

通过rust自带的`features`相关功能, 可以控制编译过程中的模块组装.  

??? info "modules预设"
```
default = ["full"]  
  
nano = []  
  
full = ["fs_full", "execute_full", "net_full", "sys_full"]  
  
base = [  
    "ls", "cd", "rm", "cp", "mv", "pwd", "cat", "upload", "download", "exec", "env", "info"  
]  
  
extend = [  
    "bypass", "kill", "whoami", "ps", "netstat", "registry", "service", "taskschd", "wmi",  
    "execute_bof", "execute_shellcode", "execute_assembly", "execute_armory",  
    "execute_exe", "execute_dll", "execute_local", "mkdir", "chmod"  
]  
  
fs_full = [  
    "ls", "cd", "rm", "cp", "mv", "pwd", "mem", "mkdir", "chown", "chmod", "cat", "pipe"  
]  
  
ls = []  
cd = []  
rm = []  
cp = []  
mv = []  
pwd = []  
mem = []  
mkdir = []  
chmod = []  
chown = []  
cat = []  
pipe = []  
  
sys_full = [  
    "info", "ps", "id", "env", "whoami", "kill", "bypass", "netstat", "wmi", "service",  
    "registry", "taskschd", "getsystem", "runas", "privs", "inject"  
]  
  
info = []  
ps = []  
id = []  
env = []  
whoami = []  
kill = []  
bypass = []  
netstat = []  
wmi = []  
service = []  
registry = []  
taskschd = []  
getsystem = []  
runas = []  
privs = []  
inject = []  
  
execute_full = [  
    "exec", "execute_shellcode", "execute_assembly", "execute_powershell",  
    "execute_bof", "execute_armory", "execute_exe", "execute_dll", "execute_local"  
]  
  
exec = []  
execute_shellcode = []  
execute_assembly = []  
execute_bof = []  
execute_powershell = []  
execute_armory = []  
execute_exe = []  
execute_dll = []  
execute_local = []  
  
net_full = ["upload", "download"]  
  
upload = []  
download = []
```


> 关于这些module的具体配置请见 [build](/wiki/IoM/implant/build)

