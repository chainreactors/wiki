IoM是包含了一些仓库, 目前也没有统一的发行包. 对于用户来说可能会有使用上的挑战. 

quickstart中将会提供最小使用说明与文档导航
## 部署server

### 预先准备


IoM的server与client都是通过golang编写的, 打包成二进制文件后不需要任何的依赖环境, 直接运行即可. 

可以从 https://github.com/chainreactors/malice-network/releases/latest 获取最新的server预编译文件.  ([自行编译说明](IoM/deploy/#_6))

但是要执行server二进制文件还需要一个配置文件. 

在这里提供了一个默认配置文件. 可以下载这个配置文件放到server 二进制目录下的 `config.yaml`.

https://github.com/chainreactors/malice-network/blob/master/server/config.yaml

### 运行server

`./server` 

默认将会读取`config.yaml` 也可以通过`-c path/config` 指定任意文件.

**在最简配置下, listener和server同时部署**

这里提供了[完整的配置文件说明]( https://chainreactors.github.io/wiki/IoM/deploy/#server-config)

可以根据自己的需要修改. 

运行成功会显式下面的log

![](assets/VNBYbUKdsokMfexhogfcKSLUnAh.png)

### 运行client

从 https://github.com/chainreactors/malice-network/releases/latest 中获取client相关预编译文件.

在上一步操作中, 我们已经运行了server, 并且会发现在当前目录中生成了一个新的配置文件, `default.yaml`. 这个文件是IoM的认证凭证, 请你保护好这个文件. 

如果非本机登录, 需要将其中的 `lhost: 127.0.0.1` 修改为你的远程服务器地址(后续将会优化这一点)

`./client default.yaml` 即可使用这个配置文件登录到server.

运行成功会进入到交互式命令, 这里将是操作整个IoM的地方. 

![](assets/NI55beE9Bo6ad5xtT3lcMuvunAd.png)

### 编译implant

因为时间问题, 我们暂时还没能把implant的编译嵌入到 client/server的交互中. 因此现在还需要手动编译implant.

这个implant是完整的pe, 如果用户由自己的shellcode loader, 可以使用自己的loader自行加载.

对于rust新手来说, 我们提供了提前准备好的编译环境. 免得复杂的环境搭建劝退.

因为rust环境安装与编译的复杂性, 我们提供了 `Docker` 环境来进行编译, 通过提前配置好的环境一键交叉编译implant.

(后续将会简化这个步骤)

```bash
docker-compose up -d --build
```
随后使用
```bash
docker exec -it implant-builder /bin/bash
```
在其中使用 `make` 命令进行对应环境的编译. (这里暂时win64的编译, 其他操作系统和架构编译见: [implant编译](IoM/implant/#docker-build))
```bash
make community_win64
```

生成的文件将在对应 `target\arch\release\malefic.exe` 中

将其从docker中复制出来运行即可. 

```
./malefic.exe
```

将会在client中看到session的上线记录. 

### 操作implant

使用在client中使用 `sessions` 命令, 将会进入到一个交互式表格中, 可以在这个表格中找到刚才上线的session, 然后运行 回车即可进入到 session的交互上下文.

这个时候输入`help` 将能看到这个session上下文完整可用的命令.  也可以在文档中找到[对应的用法](IoM/help#implant) . 

![](assets/Pasted%20image%2020240819003338.png)

**Enjoy IoM**








