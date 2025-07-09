# IoM 用法: Build

目前我们精简了build命令，并支持三种编译方式，分别为docker、action和SaaS编译。本文将主要举例如何在IoM环境下进行编译。

## 编译beacon

``` bash
build beacon --profile beacon_profile --target x86_64-unknown-linux-musl
```

![image-20250709172432445](../../../IoM/assets/build_beacon.png)

也可以使用 `--rem` ，将beacon静态链接至rem。

```bash
build beacon --profile beacon_profile --target x86_64-unknown-linux-musl --rem
```

![image-20250709173705716](../../../IoM/assets/build_beacon_rem.png)

![image-20250709174110225](../../../IoM/assets/rem_beacon.png)



## 编译module

目前我们支持编译IoM的插件和第三方插件，使用时必须带上 `--modules` 或 `--3rd` ，来确认所需要编译的插件，否则将无法编译。用法如下：

### 编译IoM插件

```bash
build modules --modules execute_exe,execute_dll --profile module_profile --target x86_64-pc-windows-gnu 
```

![image-20250709184032052](../../../IoM/assets/build_IoM_Module.png)

通过artifact name加载modules（name可通过tab补全）。

```bash
load_module --artifact artifact-name
```

![image-20250709185034428](../../../IoM/assets/load_IoM_module.png)

### 编译第三方插件

目前仅支持ren和curl。

```bash
build modules --3rd rem --profile module_profile --target x86_64-pc-windows-gnu
```

![image-20250709185630326](../../../IoM/assets/build_3rd_modules.png)

同上，通过artifact name加载modules。

![image-20250709185836589](../../../iom/assets/load_module_tab.png)

![image-20250709190034865](../../../IoM/assets/load_rem_modules.png)



## 编译pulse

```bash
build pulse --profile pulse_profile --target x86_64-pc-windows-gnu 
```

![image-20250709192315948](../../../IoM/assets/build_pulse.png)

指定beacon进行编译。

```bash
build pulse --profile pulse_profile --target x86_64-pc-windows-gnu --artifact-id 5
```

![image-20250709202400960](../../../IoM/assets/build_pulse_artifactid.png)



## docker 编译

``` bash
build beacon --profile beacon_profile --target x86_64-pc-windows-gnu --source docker
```

![image-20250709215135306](../../../IoM/assets/build_docker.png)



## github action编译

```
build beacon --profile beacon_profilet --target x86_64-pc-windows-gnu --source action
```

![image-20250709200806489](../../../IoM/assets/build_action.png)



## SaaS 编译

```bash
build beacon --profile beacon_profile --target x86_64-pc-windows-gnu --source saas
```

![image-20250709194852166](../../../IoM/assets/build_saas.png)
