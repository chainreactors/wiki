
## Module

module是implant中功能的基本单元, 各种拓展能力(bof,pe,dll)的执行也依赖于module实现. 

### 已实现modules

请见: https://github.com/chainreactors/malefic/blob/master/malefic-modules/Cargo.toml#L24-L58

### Professional Features 🔒

部分module需要依赖各类kits中的高级特性, 在community中只提供了默认特征的版本.

| 目标系统 | 目标架构    | sleep_mask | obfstr | fork&run | thread_stack_spoof | syscall | dynamic_api |
| -------- | ----------- | ---------- | ------ | -------- | ------------------ | ------- | ----------- |
| windows  | x86         | ✗         | ✓     | ✓       | ✗                 | ✓      | ✓          |
|          | x86_64      | ✓         | ✓     | ✓       | ✓                 | ✓      | ✓          |
|          | arm/aarch64 | ✗         | ✓     | ✓       | ✗                 | ✗      | ✓          |
| linux    | intel       | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |
|          | arm         | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |
|          | mips        | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |
| macOS    | intel       | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |
|          | arm         | ✗         | ✓     | ✗       | ✗                 | ✗      | ✗          |

### Dynamic Module

malefic的设计理念之一就是模块化, 自由组装. modules部分的设计也提现了这个理念. 

通过rust自带的`features`相关功能, 可以控制编译过程中的模块组装.  目前提供了三种预设

??? info "modules预设"
```
full = [  
    "fs_ls",  
    "fs_cd",  
    "fs_rm",  
    "fs_cp",  
    "fs_mv",  
    "fs_pwd",  
    "fs_mem",  
    "fs_mkdir",  
    "fs_chmod",  
    "fs_cat",  
    "net_upload",  
    "net_download",  
    "sys_info",  
    "sys_exec",  
    "sys_execute_shellcode",  
    "sys_execute_assembly",  
    "sys_execute_powershell",  
    "sys_execute_bof",  
    "sys_execute_pe",  
    "sys_env",  
    "sys_kill",  
    "sys_whoami",  
    "sys_ps",  
    "sys_netstat",  
]  
  
base = [  
    "fs_ls",  
    "fs_cd",  
    "fs_rm",  
    "fs_cp",  
    "fs_mv",  
    "fs_pwd",  
    "fs_cat",  
    "net_upload",  
    "net_download",  
    "sys_exec",  
    "sys_env",  
]  
  
extend = [  
    "sys_kill",  
    "sys_whoami",  
    "sys_ps",  
    "sys_netstat",  
    "sys_execute_bof",  
    "sys_execute_shellcode",  
    "sys_execute_assembly",  
    "fs_mkdir",  
    "fs_chmod",  
]
```


当然也可以根据喜好自行组装功能模块， 当然， 我们也提供了动态加载及卸载模块的功能， 可以随时添加新模块.


!!! danger "编译时组装的模块无法被卸载" 
	这里有一个好消息与一个坏消息.
	坏消息是编译时组装的模块无法被卸载, 因此请根据自己的使用场景选择合适的预设.
	好消息是虽然无法卸载, 但加载新模块时如选用了同样名称的模块, 新模块将覆盖本体的模块.(在内存中原本的模块依旧会存在)

#### module定义

模块的开发者绝大多数场景下不需要关注除了`run`之外的方法. [开发自定义模块请见文档](/wiki/IoM/manual/develop/#module)

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

#### module管理

就像开始所说的那样， `malefic` 支持编译时组装所需功能模块， 同时也支持启动后动态的加载和卸载所需的功能模块. 我们提供了一组api用来管理模块.  具体的使用请见[使用文档module部分](/wiki/IoM/manual/implant_help/#list_module)

- `list_modules` 命令允许列举当前 `Implant` 所持有的模块
- `load_modules` 命令则支持动态加载本地新组装的模块， 只需要 `load_modules --name xxx --path module.dll` 即可动态加载新的模块， 请注意， 如本体已经含有的模块（生成时组装的模块）， 再次加载将会覆盖该模块的功能， 是的， `load_modules` 允许覆盖本体功能
- `unload_modules` 🛠️ 命令则会卸载使用 `load_modules` 命令所加载的对应 `name` 的模块， 请注意， 生成时确定的模块是无法卸载的， 但这些模块可以被加载的新模块所覆盖
- `refresh_modules` 🛠️ 命令将会卸载所有动态加载的模块， 包括覆盖掉的本体模块， 一切模块将恢复成编译时的初始状态
