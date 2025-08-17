
## listener 配置
listener目前有两种方式控制，config.yaml和root命令行。config.yaml能够配置更多的listener相关信息，root命令行只能负责listener的新增、删除和展示。

当需要修改listener的外网ip时，通过修改对应listener的 `ip` 字段来修改。

```yaml
listeners:
  name: listener  
  ip: 127.0.0.1  
```

也可以使用服务端的启动参数 `-i` ，重新启动服务端来重载ip。

```bash
./malice-network -i 123.123.123.123
```

当listener的凭证信息需要重新指定时，通过listener的 `auth` 字段来修改凭证文件地址。

```yaml
listeners:
  name: listener
  auth: listener.auth  
```

### listener root 命令管理

当您需要添加一个新的listener， 在确保 **Malice-Network** 服务器已经运行后，在终端输入以下指令：

```powershell
.\malice-network listener add [listener_name]
```

执行命令成功后，服务端会输出以下信息并在所处文件夹下生成对应 auth 配置文件：

也可以使用以下命令删除listerner

```
.\malice-network listener del [listener_name]
```

## autobuild 配置
目前启动一个listener时，可以通过autobuild的配置，来控制是否编译与当前listener通信的implant。

如果需要编译pulse artifact，将auitobuild的 `build_pulse` 设为true。

```yaml
  auto_build:
    build_pulse: true
```

您可以根据实际需求，来配置自动编译的implant的架构和通信的pipeline，implant支持的架构在[build](/IoM/manual/implant/build)中有显示。autobuild中的 `pipeline` 字段需要和已有的pipeline名对应。

```yaml
  auto_build:
    target:
      - x86_64-pc-windows-gnu
      - x86_64-unknown-linux-musl
    pipeline:
      - tcp
      - http
```

!!!tips "autobuild的编译平台优先级为docker > github action > saas，若使用saas编译，需确保服务端的config.yaml配置了saas，并且服务端未启动docker，也没有在config.yaml中配置github仓库信息。"
## pipeline 配置
### tcp

当您需要启动一个新的tcp pipeline的时候，可以在config.yaml中的对应listener下增加一个tcp配置。

```yaml
  tcp:
  - name: tcp               # tcp 名字
        port: 5001          # tcp 监听的端口
        host: 0.0.0.0       # tcp 监听的host
        parser: malefic 	# implant协议
        enable: true        # tcp 是否开启
        tls:                # tls配置项
          enable: false
```

也可以在IoM的client端中使用命令添加一个tcp pipeline：

```bash
tcp --listener listener --host 127.0.0.1 --port 5015
```

![image-20250711183324324](/IoM/assets/tcp_new.png)

在gui中，可以在listener界面中点击new pipeline，选择pipeline type为tcp后添加。

![image-20250817171922624](/IoM/assets/usage/listener/tcp_new_gui.png)

### http

当您需要启动一个新的http pipeline的时候，可以在config.yaml中的对应listener下增加一个http配置。

```yaml
  http:	
    - name: http          # http 名字
      enable: true        # http 是否开启
      host: 0.0.0.0       # http 监听的host
      port: 8080          # http 监听的端口
      parser: malefic     # implant协议
      tls:                # tls配置项
        enable: false  
```

也可以在IoM的client端中使用命令添加一个http pipeline：

```bash
http --listener listener --host 127.0.0.1 --port 8083
```

![image-20250712005024285](/IoM/assets/http_new.png)

在gui中，可以在listener界面中点击new pipeline，选择pipeline type为http后添加。
![image-2025081725224752](/IoM/assets/usage/listener/http_new_gui.png)

### website

当您需要启动一个新的website pipeline的时候，并将一些文件挂载website pipeline 服务上时，可以在config.yaml中的对应listener下增加一个website 配置。

```yaml
  websites:             
    - name: test		             # website 名字
      port: 10049		             # website 端口
      root: "/test"		             # website route根目录
      enable: true                  # website 是否开启
      content:			             # website 映射内容
        - path: '\images\1.png'      # 文件在website的映射路径
          file: 'path\to\file'       # 文件的实际路径
          type: raw                  # 文件类型
        - path: '\images\2.png'
          file: 'path\to\file'
          type: raw
```

也可以在IoM的client端中使用命令添加一个website pipeline：
```bash
website web-test --listener listener --port 5080 --root /web
```

![image-20250712011724926](/IoM/assets/website_new.png)

然后再在对应website上传文件
```bash
website add /path/to/file --website web-test --path /path
```

![image-20250712015526853](/IoM/assets/web-content-add.png)

在gui上，需要先在website界面上，点击new website按钮，在website新建按钮中输入对应信息，来新建website pipeline。

![image-20250817173027224752](/IoM/assets/assets/usage/listener/website_new_gui.png)

随后在对应website pipeline的点击add content按钮，填写需要的website content后添加:

![image-20250817173427224752](/IoM/assets/usage/listener/webcontent_add_gui.png)

### bind (Unstable)

当您需要启动一个新的bind pipeline的时候， 可以在config.yaml中的对应listener下增加一个bind配置。

```yaml
  bind:
    -
      name: bind_default            # bind 名字
      enable: true                  # bind 是否开启
```

### rem (Unstable)

当您需要启动一个新的rem pipeline的时候， 可以在config.yaml中的对应listener下增加一个rem配置。

```yaml
  rem:                     
    - name: rem_default              # rem 名字
      enable: true                   # rem 是否开启
      console: tcp://0.0.0.0:12345   # rem 控制台监听地址和连接协议
```

## 高级功能
### pipeline的tls配置

当您的需要tcp、http和website pipeline使用tls时，您可以通过config.yaml或者命令行的方式来配置tls。
#### config配置tls
使用config.yaml配置tls时，只需在对应的pipeline下增加tls证书配置，以下是示例config：

```yaml
  tcp:
  - name: tcp               
        port: 5001          
        host: 0.0.0.0       
        parser: malefic 	
        enable: true        
        tls:                              # tls配置项
          enable: true
```

当您没有证书时，只需要将config.yaml中需要对应pipeline的tls的 `enable` 设为true，即可使用随即生成自签名证书。
若您已经有证书，并希望pipeline使用该证书，则可以将证书路径填入tls配置中，以下时示例config：
```yaml
  tcp:
  - name: tcp               
        port: 5001          
        host: 0.0.0.0       
        parser: malefic 	
        enable: true        
        tls:                              # tls配置项
          enable: true
          cert_file: path\to\cert         # 证书文件路径，支持PEM格式的证书文件
          key_file: path\to\key           # 私钥文件路径，支持PEM格式的私钥文件
          ca_file: path\to\ca             # CA证书文件路径(可选)，用于验证客户端证书的CA证书
```

#### client配置tls
使用client配置tls，需要保证服务器已经存储了需要的证书。
若您需要服务端生成自签名证书，可以用该命令生成自签名证书。

```bash
cert self_signed
```

![image-20250709210707269](/IoM/assets/generate_self_cert.png)

gui则是在certificates界面点击Generate Self-signed Certificate按钮后，服务端会生成自签名证书。

![image-20250817173627224752](/IoM/assets/usage/listener/selfcert_add_gui.png)

若您需要服务端存储您的已有证书，可以用该命令将证书上传至服务端。

```bash
cert import --cert /path/to/cert --key /path/to/key --ca-cert /path/to/ca
```

 ![image-20250709211824315](/IoM/assets/cert_imported.png)
gui则是在certificates界面点击Imported Certificate按钮后，证书上传至服务端。
 ![image-20250817173827224752](/IoM/assets/usage/listener/inportedCert_gui.png)
当服务器已存储所需证书后，可以通过以下命令，将pipeline使用新的证书配置启动。

```bash
pipeline start tcp --cert-name cert-name
```

![image-20250709213539835](/IoM/assets/cert_pipeline_start.png)

具体tls配置可以在[listener](/IoM/manual/manual/listener)查看。
### Parser

当您需要使用pipline和pulse类型的implant通信时，需要修改 `parser` 字段，设置为pulse即可。以下是pulse配置示例:

```yaml
    tcp:
	- name: shellcode
      port: 5002
      host: 0.0.0.0
      parser: pulse    # 对应malefic-pulse上线
      enable: true
      encryption:
        enable: true
        type: xor
        key: maliceofinternal
```

具体Parser配置可以在[listener](/IoM/manual/manual/listener)查看。
### Encryption
若您需要添加pipeline和implant的通信加密时，在config.yaml下对应的pipeline下添加新的encryption字段，即可配置加密协议。

```yaml
    tcp:
	- name: shellcode
      port: 5002
      host: 0.0.0.0
      parser: pulse    
      enable: true
      encryption:
        - enable: true               # 是否启用该加密方式
          type: aes                  # 加密类型 (支持: aes / xor)
          key: maliceofinternal      # 密钥 (implant 需一致)
```

具体Encryption配置可以在[listener](/IoM/manual/manual/listener)查看。
### http自定义响应内容

当您需要对http pipeline自定义配置对应的响应内容,可以在config.yaml中配置。
```yaml
 http:	
    - name: http         
      enable: true        
      host: 0.0.0.0       
      port: 8080          
      parser: malefic     
      tls:                
        enable: true  
      headers:                               # 自定义响应头 (map[string][]string)
        Server: ["nginx/1.22.0"]
        Content-Type: ["text/html; charset=utf-8"]
        Cache-Control: ["no-cache"]
      error_page: "/var/www/error.html"       # 404/500 错误页面路径
      body_prefix: "<!-- prefix marker -->"   # 每个 HTTP 响应 body 前缀内容 
      body_suffix: "<!-- suffix marker -->"   # 每个 HTTP 响应 body 后缀内容
```
- **`headers`**：  
    可以定义多个 HTTP 响应头，例如伪装成 Nginx/Apache，或者返回自定义的 Content-Type。
- **`error_page`**：  
    指定一个文件路径作为错误页面，返回时可替代默认的错误内容。
- **`body_prefix` / `body_suffix`**：  
    在 HTTP 响应体的最前/最后拼接额外内容，用于混淆流量或伪装网页。
### 独立部署listener

从项目设计开始，我们就将listener和server解耦，可以通过启动命令独立部署listener。
```bash
./malice-network --listener-only
```

![image-20250710233407269](/IoM/assets/listener_start.png)

