

- [words](https://chainreactors.github.io/wiki/libs/words/) , 使用 go 重写了 hashcat 中的 mask/rule 字典生成器, 并添加了一些新功能

- [templates](https://github.com/chainreactors/templates) , gogo 的指纹库, poc 库等; 也为 spray,kindred 等工具提供指纹识别功能

- [neutron](https://chainreactors.github.io/wiki/libs/neutron/) 使用纯 go 实现并去掉所有第三方依赖的轻量级 nuclei 引擎, 可以无副作用的集成到任意工具中而不会带来额外的依赖.

- [fingers](https://chainreactors.github.io/wiki/libs/fingers/)  templates, wappalyzer, fingerprinthub等指纹库的go实现,  支持添加各类第三方指纹库

- [parsers](https://github.com/chainreactors/parsers), 封装了 chainreactor 工具链上的各个工具输入输出的解析相关的代码.

- [proxyclient](https://chainreactors.github.io/wiki/libs/proxyclient) golang 代理客户端, 支持http/https, socks5/socks4/socks4a, ssh, shadowsocks, neoreg, suo5