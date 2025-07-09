# IoM 用法: Cert

在v0.1.1我们添加了证书管理功能，能够通过命令行显示证书列表，生成证书，删除证书，更新证书。你也可以给pipeline指定证书，重新启动pipeline，使用tls功能。目前我们支持自签名证书和用户自行导入证书。用法如下：

并且在v0.1.1开始，TLS 成为implant的默认选项， 将于cert管理功能深度联动


## config配置证书

### 自签名证书：

自签名证书配置如下，只需要将config.yaml中需要对应pipeline的tls的 `enable` 设为true。

![image-20250709205722039](/IoM/assets/self_signed_config.png)

如果有自己的证书生成信息，可按以下配置填写:

![image-20250709205939607](/IoM/assets/subjiect_info.png)



### 导入证书

导入证书配置如下：

![image-20250709210435483](/IoM/assets/import_cert.png)



## 命令行管理证书

### 显示证书

```
cert
```

![image-20250709210941317](/IoM/assets/cert_list.png)

### 添加证书

```bash
cert self_signed
```

![image-20250709210707269](/IoM/assets/generate_self_cert.png)

```bash
cert import --cert /path/to/cert --key /path/to/key --ca-cert /path/to/ca
```

![image-20250709211824315](/IoM/assets/cert_imported.png)

### 下载证书

```bash
cert download cert-name —o file-path
```

![image-20250709211227080](/IoM/assets/cert_download.png)

### 删除证书

```
cert delete cert-name
```

![image-20250709211525047](../../../IoM/assets/cert_delete.png)

### 更新证书

```bash
cert update cert-name  --cert /path/to/cert --key /path/to/key --ca-cert /path/to/ca
```

![image-20250709213311044](../../../IoM/assets/cert_update.png)



## 使用指定证书启动pipeline

```bash
pipeline start pipeline-name --cert-name cert-name
```

![image-20250709213539835](/IoM/assets/cert_pipeline_start.png)

