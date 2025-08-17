## Server部署

!!! tips "安装脚本并非必须, 若非有本地编译需求, 可以参考quickstart开箱即用"

#### 在linux上使用安装脚本安装:

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

#### 下载release部署

如果在windows或者macos系统上部署server，则前往IoM仓库[下载对应的server release](https://github.com/chainreactors/malice-network/releases/latest)。

![image-20250817220924324](/IoM/assets/usage/deploy/github_release.png)

其中IoM为client端，malice_network为server端。

下载完成后，可以使用以下命令启动服务端。

```bash
./malice-network
```

如果需要server以指定ip启动，则使用`-i` 参数来指定ip。

```
./malice-network -i 123.123.123.123
```

#### 常用配置修改
config.yaml是server端的配置文件，其中包含了一些server以及 `listener` 可选的配置。
若需要修改配置，需要提前到 https://github.com/chainreactors/malice-network/blob/master/server/config.yaml 下载config.yaml，并放到server端可执行文件的同级目录下。

在config.yaml中可以通过server下的 `ip` 字段来修改server指定的外网ip。

```yaml
server:
  ip: 127.0.0.1
```

当在传输大文件时或者网络环境较差时，可以通过修改config下的 `packet_length` 字段来调整server与listener之间的通信数据包大小。

```yaml
config:
  packet_length: 10485760   # 10M
```

IoM还支持了第三方消息通知，目前支持了telegram，钉钉，飞书和微信等第三方软件。可以在config.yaml中的 `notify` 字段来配置。
```yaml
  notify:
    enable: false 
    telegram:         # telegram 配置
	  enable: false
	  api_key:        # telegram api-key
	  chat_id:        # telegram 聊天id
	dingtalk:         # 钉钉消息配置
	  enable: false
	  secret:         # 钉钉第三方secret
	  token:          # 钉钉第三方token
    lark:             # 飞书消息配置
      enable: false
      webhook_url:    # 飞书机器人webhook_url
    serverchan:       # serverchan 微信推送配置
      enable: false
      url:            # serverchan api key
    pushplus:         # PushPlus 消息配置
      enable: false   # 是否启用 PushPlus
      token:          # PushPlus Token
      topic:          # 消息主题
      channel:        # 推送渠道，可选: wechat, email, telegram 等
```

关于listener和编译的配置在[listener](/IoM/manual/usage/listener)和[build](/IoM/manual/usage/build)中说明。
### 启动客户端

服务端启动后会生成两个配置文件, 分别为`listener.auth` 和`admin_[server_ip].auth`，将生成的用户配置文件, 默认为 `admin_[server_ip].auth` 复制到 `Malice-Network` 客户端的所在位置。使用新的用户配置文件时，可以使用以下指令启动客户端：

```powershell
.\iom login [admin_ip.auth]
```

执行命令后，客户端会自动使用新的客户配置文件与服务器连接，并将用户配置文件移动至客户端的用户配置文件夹 (Windows 下为 `C:\Users\user\.config\malice\configs`, Linux 为 `/home/[username]/.config/malice/configs`，MacOS  为 `/Users/[username]/.config/malice/configs`）

下次登录后，客户端会自动显示在用户配置文件夹下所有的用户配置，根据需求，选择对应的用户进行选择。

```
./iom
```

![](/IoM/assets/EEgKb86iwop9xaxBUt8cHZG9n8f.png)

### gui 配置

gui目前以vscode插件形式生成，需要配置vscode使用，在[github release中下载](https://github.com/chainreactors/malice-network/releases/latest/download/iom.vsix)。

在vscode的extensions界面选择install from VSIX将gui插件安装：

![image-20250817194939835](/IoM/assets/usage/deploy/gui_install.png)

安装完成后，在vscode设置中搜索iom

需要配置默认凭证名和iom的client路径：

![image-20250817194339835](/IoM/assets/usage/deploy/gui_setting.png)

!!! tips "默认凭证名只是命令行中使用的默认凭证名，在后续的client登录中还是要先添加对应的登录凭证，然后才能使用。"

设置完成后，在左侧凭证列表点击添加按钮，将server生成的auth文件加入，然后点击auth文件，即可与server连接，使用gui界面。

![image-20250817195039835](/IoM/assets/usage/deploy/gui_add_auth.png)

!!! tips "更具体的部署文档在[deploy](/IoM/manual/manual/deploy)中说明"