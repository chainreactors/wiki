


!!! tips "在v0.1.1开始，TLS 成为implant的默认选项， 将于cert管理功能深度联动"
	在v0.1.1我们添加了证书管理功能，能够通过命令行显示证书列表，生成证书，删除证书，更新证书。你也可以给pipeline指定证书，重新启动pipeline，使用tls功能。目前我们支持自签名证书和用户自行导入证书。



# pipeline 管理

pipeline 负责与implant的通讯，可以与server分离部署， 也可以同时部署。

当前支持多种信道， 以及基于rem实现的拓展信道。 
- 基本信道
	- tcp
	- http
- rem: 支持rem支持的所有信道 https://wiki.chainreactors.red/rem/ 
	- udp
	- http
	- tcp
	- tls
	- smb
	- unix
	- websocket
	- icmp
	- ...
- bind, 用于正向连接
- website, 用于分发artifact与挂载文件

## 基本用法
### 新建tcp

```bash
tcp --listener listener --host 127.0.0.1 --port 5015
```

![image-20250711183324324](/IoM/assets/tcp_new.png)
#### 新建tcp并开启tls

!!! tips "其他pipeline打开tls方式相同"

```bash
tcp --listener listener --host 127.0.0.1 --port 5015 --tls --cert-name cert-name
```

![image-20250712012328952](/IoM/assets/tcp_new_tls.png)

### 新建http
```bash
http --listener listener --host 127.0.0.1 --port 8083
```

![image-20250712005024285](/IoM/assets/http_new.png)

```bash
http --listener listener --host 192.168.110.72 --port 8083 --tls --cert-name DETERMINED_NIECE
```

![image-20250712012622744](/IoM/assets/http_new_tls.png)

### 新建rem
```bash
rem new rem_test --listener listener  -c tcp://127.0.0.1:19966
```

![image-20250712010224957](/IoM/assets/rem_new.png)

### 新建website
```bash
website web-test --listener listener --port 5080 --root /web
```

![image-20250712011724926](/IoM/assets/website_new.png)

```bash
website web-test --listener listener --port 5080 --root /web --tls --cert-name GOOD_BEETLE
```

![image-20250712012826116](/IoM/assets/web_new_tls.png)
#### 在对应website上传文件
```bash
website add /path/to/file --website web-test --path /path
```

![image-20250712015526853](/IoM/assets/web-content-add.png)

## 高级功能
### 证书管理
当前证书管理支持通过多种方式配置证书。

- 随机生成自签名证书
- 指定参数生成自签名证书
- 导入已有证书
- ACME自动签名
#### 通过config配置证书
目前config.yaml主要由TLS的相关配置来控制证书。具体TLS配置如下:
```yaml
tls:  
  enable: true                    # 启用TLS加密传输
  # 自签名证书配置
  CN: "test"                      # 证书通用名称(Common Name)，通常为域名或IP地址
  O: "Sharp Depth"                # 证书组织名称(Organization)
  C: "US"                         # 证书国家代码(Country)，使用ISO 3166-1标准
  L: "Houston"                    # 证书地区/城市名称(Locality)
  OU: "Persistent Housework, Limited"  # 证书组织单位名称(Organizational Unit)
  ST: "State of Texas"            # 证书州/省名称(State/Province)

  # 导入证书配置
  cert_file: path\to\cert         # 证书文件路径，支持PEM格式的证书文件
  key_file: path\to\key           # 私钥文件路径，支持PEM格式的私钥文件
  ca_file: path\to\ca             # CA证书文件路径(可选)，用于验证客户端证书的CA证书
```

#### 自签名证书：

自签名证书配置如下，只需要将config.yaml中需要对应pipeline的tls的 `enable` 设为true。

```yaml
tcp:  
  - name: tcp  
    enable: true  
    port: 5001  
    host: 0.0.0.0  
    protocol: tcp  
    parser: auto  
    tls:  
      enable: true  
    encryption:  
      - enable: true  
        type: aes  
        key: maliceofinternal  
      - enable: true  
        type: xor  
        key: maliceofinternal
```

如果有自己的证书生成信息，可按以下配置填写:
```yaml
tcp:  
  - name: tcp  
    enable: true  
    port: 5001  
    host: 0.0.0.0  
    protocol: tcp  
    parser: auto  
    tls:  
	  enable: true
      CN: "test"
      O: "Sharp Depth"
      C: "US"
      L: "Houston"
      OU: "Persistent Housework, Limited"
      ST: "State of Texas"  
    encryption:  
      - enable: true  
        type: aes  
        key: maliceofinternal  
      - enable: true 
	    type: xor
		key: maliceofinternal
```
#### 导入已有证书

导入证书配置如下：
```yaml
tcp:  
  - name: tcp  
    enable: true  
    port: 5001  
    host: 0.0.0.0  
    protocol: tcp  
    parser: auto  
    tls:  
      enable: true  
      cert_file: path\to\cert  
      key_file: path\to\key  
      ca_file: path\to\ca    (非必须填写)
    encryption:  
      - enable: true  
        type: aes  
        key: maliceofinternal  
      - enable: true  
        type: xor  
        key: maliceofinternal
```

#### client配置证书
启动listener之后，可以给已有的pipeline使用新的证书，使用新的证书前，需要保证服务器已经存储了需要的证书。

**添加自签名证书**

```bash
cert self_signed
```

![image-20250709210707269](/IoM/assets/generate_self_cert.png)

**添加导入证书**
```bash
cert import --cert /path/to/cert --key /path/to/key --ca-cert /path/to/ca
```

 ![image-20250709211824315](/IoM/assets/cert_imported.png)
 
 如果不确认证书信息，可以list证书，来确认是否是需要的证书。

```bash
cert
```


![image-20250709211525047](/IoM/assets/cert_list.png)

#### 使用指定证书启动pipeline
当服务器已存储所需证书后，可以通过以下命令，将pipeline使用新的证书配置启动。

```bash
pipeline start tcp --cert-name cert-name
```

![image-20250709213539835](/IoM/assets/cert_pipeline_start.png)

### Parser
### Encryption
### Secure

## 独立部署listener

从项目设计开始，我们就将listener和server解耦，可以通过启动命令独立部署listener。
```bash
./malice-network --listener-only
```

![image-20250710233407269](/IoM/assets/listener_start.png)

