# Malefic

malefic 是目前IoM提供的默认implant. 

项目地址: https://github.com/chainreactors/malefic

### 架构

rust的crate的结构就是malefic的组成部分

**主体结构:**
- malefic, 主程序, 包含了beacon/bind两种模式的完整功能
- malefic-mutant,  用来实现自动化配置malefic的各种条件编译与特性, 以及生成shellcode, srdi等
- malefic-pulse, 最小化的shellcode模板, 对应CS的artifact, 能编译出只有4kb的上线马, 非常适合被各种loader加载
- malefic-prelude, 多段上线的中间阶段, 可以在这里按需配置权限维持, 反沙箱, 反调试等功能. 
- malefic-srdi, 最先进的srdi技术, 最大程度减少PE特征
**基础库:**
- malefic-modules, 各种模块的具体实现, v0.0.3添加了仅30个原生模块, 覆盖service, registry, taskscheduer, token, wmi等常用功能
- malefic-core, 核心库, 实现beacon/bind与modules的交互, 可以通过core快速实现各种不同模板不同需求的implant.
- malefic-proto, 加密与协议库, 定义了implant与server数据交互的协议与加密方式等
- malefic-helper, 辅助函数库, 也是对接malefic-kits的中间库, kits中的api将会通过FFI在helper中二次包装, 实现对kit中各种功能的调用
**kits**(二进制开源):
- malefic-win-kit, 实现了loadpe, UDRL, SRDI, CLR, 堆栈混淆等等高级特性的OPSEC实现
- 在professional版本中还会提供linux与mac的kit ......

IoM计划提供一整套互相解耦的implant解决方案, 实现各个阶段各种需求不同的二进制文件生成. 

在设计目标中, implant实际上还有更多的内容, 但受限于精力, 我们暂时只将已实现的, 或短期内将实现的功能进行简单的介绍. 后续将随着开发进度逐步补全. 
