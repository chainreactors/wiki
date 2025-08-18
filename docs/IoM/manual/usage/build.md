
### profile 准备

当您需要编译implant的时候，首先要确保服务端是否用有您需要的profile，目前在pipeline启动时会自动生成一份能和该pipeline通信的profile。
若您需要添加一份符合您需求的profile，可以使用 `profile load` ，将您修改后的profile上传到服务端。添加profile时，需要指定一个pipeline，以保证编译出来的implant能和pipeline通信:
```bash
profile load path/to/config.yaml --name test --pipeline tcp
```

![image-20250817183127224752](/IoM/assets/usage/build/profile_load.png)

在 gui 中添加 profile 时，您需要在artifacts页面上，点击add profile，选择已有的 profile 文件进行记载。
![image-20250817182727224752](/IoM/assets/usage/build/profile_new.png)
### 编译选项

当您需要编译implant时，可以在client端中使用以下命令来build implant，需要选定对应的profile:

```bash
build beacon --profile tcp_default --target x86_64-unknown-linux-musl
```

![image-20250709172432445](/IoM/assets/build_beacon.png)

若您需要指定编译平台，可以使用 `--source` 来指定，目前可以指定docker/action/saas，若没有指定，则会寻找可用的编译平台来编译。

```bash
build beacon --profile tcp_default --target x86_64-unknown-linux-musl --source docker
```

#### beacon 选项

在编译beacon的时候，您可以通过 `--modules` 带上需要添加的额外modules。
```bash
build beacon --target x86_64-pc-windows-gnu --profile tcp_default --modules execute_full
```

您也可以通过 `--interval` 和 `--jitter` 字段来控制beacon和prelude的回连时间，`interval` 参数控制固定回连的时间间隔（秒），`jitter` 参数控制在 interval 基础上增加的随机扰动比例，避免过于规律的回连。

```bash
build beacon --profile tcp_default --target x86_64-unknown-linux-musl --interval 1 --jitter 0.2
```

若您需要在beacon中使用rem插件时，可以使用 `--rem` 来配置。
```bash
build beacon --profile tcp_default --target x86_64-unknown-linux-musl --rem
```

在gui上，您需要在artifacts页面，在对应的profile行上点击build，选择beacon后，根据需求，在对应配置行上填入信息，进行编译。
![image-20250817183527224752](/IoM/assets/usage/build/build_beacon_gui.png)
#### modules选项

当您需要编译modules时，可以通过 `--modules` 来指定需要的modules进行编译。
```bash
build modules --modules execute_exe,execute_dll --profile tcp_default --target x86_64-pc-windows-gnu 
```

您也可以使用 `--3rd` 来编译第三方插件，目前Implant支持curl和rem这两个第三方插件。
```bash
build modules --3rd rem --profile tcp_default --target x86_64-pc-windows-gnu
```

在gui上，您需要在选择modules后，在对应的插件行上填入需要的插件，然后进行编译。

![image-20250817183827224752](/IoM/assets/usage/build/build_modules_gui.png)

![image-20250817183927224752](/IoM/assets/usage/build/build_3rd_gui.png)

#### pulse选项

编译pulse时，可以指定`--artifact-id`  来指定pulse链接的beacon。
```bash
build pulse --profile tcp_default --target x86_64-pc-windows-gnu --artifact-id 3
```

在gui上，您需要在选择pulse后，填入artifact-id后进行编译。

![image-20250817184427224752](/IoM/assets/usage/build/build_pulse_artifactID_gui.png)

#### prelude选项

编译prelude时，需要使用 `--autorun` 指定包含autorun.yaml和resources文件夹的zip压缩包路径。
详细的autorun.yaml和zip压缩格式在[build](/IoM/manual/manual/build)中说明。
编译命令如下：
```bash
build prelude  --profile prelude-profile  --target x86_64-pc-windows-gnu --autorun path/to/dir.zip
```

在gui上，您需要在选择prelude后，填入zip文件路径后进行编译。

![image-20250817185927224752](/IoM/assets/usage/build/build_prelude_gui.png)

### artifact 

编译完成后，您可以使用 `artifact list` 命令查看所有的artifact。

```bash
artifact list
```

![img_8.png](/IoM/assets/artifact_list.png)

在artifact表格中选中对应artifact，即可将artifact源文件下载到client端。

您也可以使用 `artifact download` 来指定想要下载的artifact，也可以指定 `--format` 来设置artifact的下载格式。

例如，下载artifact的shellcode格式：

```bash
artifact download artifact-name --format raw
```
更多的format格式在[build](/IoM/manual/manual/build)中说明。

在gui上，您需要在artifact页面上点击对应的artifact行上的download按钮，即可下载artifact源文件到指定路径。
![image-20250817190327224752](/IoM/assets/usage/build/artifact_download.png)

当artifact编译失败时，可以通过以下命令来查看log(目前支持查看docker，后续会加上saas）：

```bash
build log artifact_name
```

![image-20250817192027224752](/IoM/assets/usage/build/build_log.png)

在gui中，可以右击对应artifact行，点击Show Artifact Log, 可以查看log。

![image-20250817192327224752](/IoM/assets/usage/build/build_log_gui.png)
