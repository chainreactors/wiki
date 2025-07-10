
在v0.1.1我们添加了证书管理功能，能够通过命令行显示证书列表，生成证书，删除证书，更新证书。你也可以给pipeline指定证书，重新启动pipeline，使用tls功能。目前我们支持自签名证书和用户自行导入证书。

并且在v0.1.1开始，TLS 成为implant的默认选项， 将于cert管理功能深度联动。
本文将会介绍如何给pipeline配置证书。
## 独立部署listener

从项目设计开始，我们就将listener和server解耦，可以独立部署listener，只需将config.yaml中的 `listener-only` 设置为true, 就可以listener形式启动：
```yaml 
listener-only: true 
server:  
	# existing config
listeners:  
  name: listener  
  auth: listener.auth  
  enable: true  
  ip: 127.0.0.1  
  auto_build:  
    enable: true  
    build_pulse: true  
    target:  
      - x86_64-pc-windows-gnu  
    pipeline:  
      - tcp  
      - http  
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
  
  http:  
    - name: http  
      enable: true  
      host: 0.0.0.0  
      port: 8080  
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
      error_page: ""  
  bind:  
    - name: bind_pipeline  
      enable: false  
      encryption:  
        enable: true  
        type: aes  
        key: maliceofinternal  
  website:  
    - name: default-website  
      port: 80  
      root: "/"  
      enable: true  
  
  rem:  
    -  
      name: rem_default  
      enable: true  
      console:
```
![image-2025071020442294](/IoM/assets/listener_start.png)

## 通过config配置证书

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
#### 导入证书

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

### client配置证书
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

### 使用指定证书启动pipeline
当服务器已存储所需证书后，可以通过以下命令，将pipeline使用新的证书配置启动。

```bash
pipeline start tcp --cert-name cert-name
```

![image-20250709213539835](/IoM/assets/cert_pipeline_start.png)

