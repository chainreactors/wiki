## 安装部署

一键安装脚本:

```
curl -L "https://raw.githubusercontent.com/chainreactors/malice-network/master/install.sh" | sudo bash
```

确保 **IOM** 所在系统符合以下条件：

- **操作系统**：Linux 推荐使用 Ubuntu、Debian 或 CentOS, (后续会适配 mac 与 windows)
- **权限**：需要以 `root` 用户或通过 `sudo` 运行安装脚本。
- **网络连接**：确保能够访问以下资源
    - `github.com`
    - `ghcr.io`
    - `docker.com`

!!! important "网络问题"
iom 项目 releases 中的文件仍然需要从 github 下载, 国内服务器访问 github 容易超时, 建议配置环境变量中的 proxy, 再执行上述操作

	可以映射本机的代理端口到 vps: ssh -R 1080:127.0.0.1:1080 root@vps.ip
	
	```
	export http_proxy="http://127.0.0.1:1080"
	export https_proxy="http://127.0.0.1:1080"
	```

	如果你的当前用户不是 root, 可以使用 sudo -E bash install.sh, 以保持环境变量生效

运行脚本时，将通过交互命令行提供以下信息：

**安装路径** ：

- 需要指定安装的根目录（默认路径为 /iom）：

  ```
  Please input the base directory for the installation [default: /iom]:
  ```

**IP 地址**：

- **install.sh** 会自动检测默认 IP 并提示：

  ```
  Please input your IP Address for the server to start [default: <自动检测的IP>]:
  ```

??? "**install.sh** 将自动完成以下任务："
1. 检查并安装 Docker。
2. 下载并安装 Malice-Network 服务端及客户端, 并添加到环境变量
3. 下载并安装 Malefic 源码及工具
4. 拉取必要的 Docker 镜像, （需要大约8.21GB 空间, 我们正在尝试优化）
		- `ghcr.io/chainreactors/malefic-builder:latest`
5. 配置并启动 Malice-Network 服务（基于 `systemd`）。