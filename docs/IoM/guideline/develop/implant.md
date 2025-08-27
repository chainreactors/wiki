---
title: IoM Implant 开发指南
---

# Implant 开发指南

本指南介绍如何为IoM的Implant组件进行开发和贡献。Implant是基于Rust的跨平台植入物。

!!! info "回到总览"
    返回[开发者贡献指南](index.md) | 查看[Server开发指南](server.md) | 查看[Client开发指南](IoM/guideline/develop/client.md)

## 环境配置

### Rust开发环境

**版本要求**: nightly-2023-09-18-x86_64-pc-windows-msvc

!!! warning "锁定版本要求"
    为了保持对Windows 7的兼容性，community版本锁定了rust toolchain版本

```bash
rustup default nightly-2023-09-18-x86_64-pc-windows-msvc
```

### 支持的目标架构

malefic理论上支持rust能编译的几乎所有平台，当前测试过的target：

- x86_64-apple-darwin
- aarch64-apple-darwin  
- x86_64-unknown-linux-musl
- i686-unknown-linux-musl
- x86_64-pc-windows-msvc
- i686-pc-windows-msvc
- x86_64-pc-windows-gnu
- i686-pc-windows-gnu
- armv7-unknown-linux-musleabihf
- armv7-unknown-linux-musleabi

详细架构支持参考[cross-rust](https://github.com/chainreactors/cross-rust)

### 项目设置

1. **克隆仓库** (必须递归克隆子项目)
   ```bash
   git clone --recurse-submodules https://github.com/chainreactors/malefic
   cd malefic
   ```

   !!! warning "必须递归克隆"
       IoM项目包含多个子模块，必须使用`--recurse-submodules`参数。如果已经clone但没有子模块，运行`git submodule update --init --recursive`补充下载。

2. **下载resources**
   
   [下载对应版本的resources.zip](https://github.com/chainreactors/malefic/releases/latest)，包含了编译需要的预编译malefic-win-kit lib/a库文件。
   
   解压到源码目录下的resources文件夹。

## 本机编译环境

### 安装Rust

=== "Linux"

    ```bash
    curl https://sh.rustup.rs -sSf | sh
    ```

=== "Windows"

    三种方式选一:
    ```bash
    # 1. 直接下载: https://www.rust-lang.org/tools/install
    # 2. scoop
    scoop install rustup
    # 3. winget  
    winget install rustup
    ```

### 安装锁定toolchain
```bash
rustup default nightly-2023-09-18
```

### 环境依赖

=== "Linux"

    ```bash
    sudo apt install -y openssl libssl-dev libudev-dev cmake llvm clang musl-tools build-essential
    ```

=== "Windows"

    根据target选择配置msvc或gnu环境，详细步骤参考[build文档](/IoM/manual/implant/build/)

!!! tip "交叉编译小技巧"
    使用[zigbuild](https://github.com/rust-cross/cargo-zigbuild)可以简化交叉编译：
    ```bash
    pip install cargo-zigbuild
    cargo zigbuild --release -p malefic --target x86_64-pc-windows-gnu
    ```

### 编译测试
```bash
# 添加目标架构
rustup target add x86_64-pc-windows-gnu

# 编译测试
cargo build --release -p malefic --target x86_64-pc-windows-gnu
```

## Module开发

### Module示例

以环境变量操作功能为例编写Module:

#### 1. 简单Module (环境变量获取)

```rust
use crate::prelude::*;

pub struct Env {}

#[async_trait]
#[module_impl("env")]
impl Module for Env {}

#[async_trait]
impl ModuleImpl for Env {
    async fn run(&mut self, id: u32, receiver: &mut malefic_proto::module::Input, _sender: &mut malefic_proto::module::Output) -> ModuleResult {
        let _ = check_request!(receiver, Body::Request)?;

        let mut env_response = Response::default();
        for (key, value) in std::env::vars() {
            env_response.kv.insert(key, value);
        }

        Ok(TaskResult::new_with_body(id, Body::Response(env_response)))
    }
}
```

#### 2. 带参数Module (设置环境变量)

```rust
pub struct Setenv {}

#[async_trait]
#[module_impl("env_set")]
impl Module for Setenv {}

#[async_trait]
impl ModuleImpl for Setenv {
    async fn run(&mut self, id: u32, receiver: &mut malefic_proto::module::Input, _sender: &mut malefic_proto::module::Output) -> ModuleResult {
        let request = check_request!(receiver, Body::Request)?;

        let args = check_field!(request.args, 2)?; // 校验args参数长度为2
        if let [k, v] = &args[..] {
            std::env::set_var(k, v);
        }

        Ok(TaskResult::new(id)) // 返回简单成功结果
    }
}
```



### Module注册

要将模块集成到malefic中，需要进行模块注册：

#### 1. 在Cargo.toml中添加Feature

在[malefic-modules/Cargo.toml](https://github.com/chainreactors/malefic/blob/master/malefic-modules/Cargo.toml)中添加feature：

```toml
[features]
# ... 其他features
env = []
env_set = []  
env_unset = []
```

#### 2. 在lib.rs中注册模块

在[malefic-modules/src/lib.rs](https://github.com/chainreactors/malefic/blob/master/malefic-modules/src/lib.rs)中注册模块：

```rust
// 导入模块
#[cfg(feature = "env")]
pub mod env;

// 在register_modules函数中注册
pub fn register_modules() -> MaleficModules {
    let mut modules: MaleficModules = HashMap::new();
    
    #[cfg(feature = "env")]
    register_module!(modules, "env", env::Env);
    
    #[cfg(feature = "env_set")]  
    register_module!(modules, "env_set", env::Setenv);
    
    #[cfg(feature = "env_unset")]
    register_module!(modules, "env_unset", env::Unsetenv);
    
    modules
}
```

#### 3. 模块文件结构

```
malefic-modules/src/
├── lib.rs          # 模块注册入口
├── env/
│   └── mod.rs      # 环境变量相关模块
└── ...
```


### 编译独立modules

malefic支持动态加载module，可以编译单个或一组module：

```bash
# 生成配置
malefic_mutant generate modules "execute_powershell execute_assembly"

# 编译modules
malefic_mutant build modules --target x86_64-pc-windows-gnu
```

编译结果为`target/[arch]/release/modules.dll`，可以使用`load_module`热加载。

!!! important "动态加载限制"
    Module动态加载目前只支持Windows，Linux与macOS将随着对应的kit发布

### 常见使用场景

1. 编译一个不带任何modules的malefic，保持最小特征与体积
2. 根据场景快速开发module，然后动态加载到malefic中
3. 长时间静默场景可以卸载所有modules，进入sleepmask状态

## 3rd Module开发

对于需要引入第三方依赖的模块，IoM提供了专门的3rd module开发框架。在Malefic本体中采用了最小化依赖的设计模式，因此所有需要第三方库的功能都在3rd模块中实现。

### 使用模板创建3rd模块

1. **克隆模板仓库**
   ```bash
   git clone https://github.com/chainreactors/malefic-3rd-template.git
   cd malefic-3rd-template
   ```

2. **项目结构**
   ```
   malefic-3rd-template/
   ├── Cargo.toml           # 项目配置文件
   ├── src/
   │   ├── lib.rs          # 主库文件，模块注册入口
   │   ├── prelude.rs      # 公共导入
   │   └── example/        # 示例模块
   │       └── mod.rs      # 示例模块实现
   └── README.md
   ```

3. **构建模块**
   ```bash
   cargo build -r
   ```
   
   构建完成后，DLL文件位于`target/release/malefic_3rd.dll`

4. **加载模块**
   ```bash
   # 在IoM client中执行
   load_module --path target/release/malefic_3rd.dll
   ```

### 开发自定义3rd模块

#### 1. 添加新模块

创建模块目录和文件：
```
src/your_module/
└── mod.rs
```

#### 2. 配置Features

在`Cargo.toml`中添加feature：
```toml
[features]
default = ["as_cdylib", "example"]
as_cdylib = []
example = []
your_module = []  # 新增模块feature
```

#### 3. 注册模块

在`src/lib.rs`中注册模块：
```rust
pub mod your_module;

pub extern "C" fn register_3rd() -> MaleficBundle {
    let mut map: MaleficBundle = HashMap::new();
    
    #[cfg(feature = "example")]
    register_module!(map, "example", example::Example);
    
    #[cfg(feature = "your_module")]
    register_module!(map, "your_module", your_module::YourModule);
    
    map
}
```

#### 4. 实现模块

```rust
use crate::prelude::*;

pub struct YourModule {}

#[async_trait]
#[module_impl("your_module")]
impl Module for YourModule {}

#[async_trait]
impl ModuleImpl for YourModule {
    async fn run(&mut self, id: u32, receiver: &mut crate::Input, sender: &mut crate::Output) -> ModuleResult {
        let request = check_request!(receiver, Body::Request)?;
        
        // 处理请求逻辑...
        
        let mut response = Response::default();
        response.output = "your module output".to_string();
        Ok(TaskResult::new_with_body(id, Body::Response(response)))
    }
}
```

### 选择性构建

可以通过指定features来选择性构建模块：

```bash
# 只构建example模块
cargo build -r --features "example"

# 构建多个模块
cargo build -r --features "example,your_module"
```

### 3rd模块与普通模块的区别

- **普通模块**: 编译时静态链接到malefic本体，不能使用第三方依赖
- **3rd模块**: 独立编译为动态库，可以使用任意第三方依赖，运行时动态加载


## 相关资源

- [Implant构建文档](/IoM/manual/implant/build/) - 详细编译指南
- [Module文档](/IoM/manual/implant/modules/) - 所有可用模块
- [Mutant文档](/IoM/manual/implant/mutant/) - 配置工具详解
- [Server开发指南](server.md) - 服务端开发
- [Client开发指南](IoM/guideline/develop/client.md) - 客户端开发

---

[⬅️ 返回开发者指南](index.md)
