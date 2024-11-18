
## Module

module是implant中功能的基本单元, 各种拓展能力(bof,pe,dll)的执行也依赖于module实现. 

### 已实现modules

请见: https://github.com/chainreactors/malefic/blob/master/malefic-modules/Cargo.toml#L24-L58

### Dynamic Module

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
  
net = []  
net_full = ["upload", "download"]  
  
upload = []  
download = []
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
