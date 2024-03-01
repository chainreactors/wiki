---
title: zombie · 入门
---

## Feature

!!! example "Feature."

    * 超强的性能, 数倍于hydra
    * 便携且无依赖, 能在绝大多数场景落地
    * 丰富的协议支持
    * 与gogo的完美联动, 一键对gogo扫描结果进行爆破
    * 字典生成器, 根据不同场景自动生成不同字典
    * 多种便捷的输入与输出方式

## Usage

`zombie -h`

```
Usage:
  zombie.exe [OPTIONS]

Input Options:
  -i, --ip=             String, input ip
  -I, --IP=             File, input ip list filename
  -u, --user=           Strings, input usernames
  -U, --USER=           File, input username list filename
      --userword=       String, input username generator dsl
      --userrule=       String, input username generator rule filename
  -p, --pwd=            String, input passwords
  -P, --PWD=            File, input password list filename
      --pwdword=        String, input password generator dsl
      --pwdrule=        String, input password generator rule filename
      --go=             File, input gogo result filename
  -s, --service=        String, input service name
  -S, --filter-service= String, filter service name
      --param=          param

Output Options:
  -f, --file=           File, output result filename
  -O, --file-format=    String, output result file format (default: json)
  -o, --format=         String, output result format (default: string)
Word Options:
      --top=            Int, top n words (default: 0)
      --force-continue  Bool, force continue, not only stop when first success
                        ever host

Misc Options:
  -t=                   Int, threads (default: 100)
  -d, --timeout=        Int, timeout (default: 5)
  -m=                   String, mod (default: clusterbomb)
      --debug           Bool, enable debug

Help Options:
  -h, --help            Show this help message
```

## QuickStart

参考了 hydra 的命令行设计, 小写为命令行输出, 大写为文件输入, 留空为使用默认值.

使用默认字典爆破 ssh 的 root 用户口令

`zombie -i 1.1.1.1 -u root -s ssh`

使用指定的密码批量喷洒 ssh 口令

`zombie -I targets.txt -u root -p password -s ssh`

targets.txt

```
1.1.1.1
2.2.2.2
3.3.3.3
...
```

从文件中自动解析输入

`zombie -I targets.txt`

targets.txt:

```
mysql://user:pass@1.1.1.1:3307  # 指定了用户与密码以及端口, 尝试登录mysql
ssh://user@2.2.2.2              # 自动解析ssh默认端口22, 使用默认密码爆破指定user的ssh
mssql://3.3.3.3:1433            # 未指定user与pass, 自动选用默认的用户与密码字典
```

使用已知的所有用户与密码, 进行笛卡尔积的方式对服务进行最大可能的爆破.

`zombie -I targets.txt -U user.txt -P pass.txt`

targets.txt:

```
mysql://1.1.1.1
ssh://2.2.2.2
mssql://3.3.3.3
```

从 gogo 结果开始扫描

`zombie --gogo 1.dat`

从 json 开始扫描

`zombie -j 1.json`

简单配置自定义密码生成器

`zombie -l 1.txt -p admin --weakpass`

将会根据 google 关键字生成常见的密码组合, 以 admin 为例， 将会生成以下密码

??? info "--weakpass 生成的密码"

    ```
    admin
    Admin
    ADMIN
    aDMIN
    admin1
    admin2
    admin3
    admin4
    admin5
    admin6
    admin7
    admin8
    admin9
    admin0
    admin123
    admin1234
    admin12345
    admin123456
    admin2018
    admin2019
    admin2020
    admin2021
    admin2022
    admin01
    admin02
    admin03
    admin04
    admin05
    admin06
    admin07
    admin08
    admin09
    admin10
    admin11
    admin12
    admin13
    admin14
    admin15
    admin16
    admin17
    admin18
    admin19
    admin20
    admin21
    admin22
    admin23
    admin24
    admin25
    admin26
    admin27
    admin28
    admin29
    admin30
    admin31
    admin!
    admin@
    admin#
    admin$
    admin!@
    admin!@#
    admin!@#$
    admin123!
    admin!123
    admin1@
    admin2018!
    admin2019!
    admin2020!
    admin2021!
    admin2022!
    admin!2018
    admin!2019
    admin!2020
    admin!2021
    admin!2022
    admin2018!@#
    admin2019!@#
    admin2020!@#
    admin2021!@#
    admin2022!@#
    admin01!
    admin02!
    admin03!
    admin04!
    admin05!
    admin06!
    admin07!
    admin08!
    admin09!
    admin10!
    admin11!
    admin12!
    admin13!
    admin14!
    admin15!
    admin16!
    admin17!
    admin18!
    admin19!
    admin20!
    admin21!
    admin22!
    admin23!
    admin24!
    admin25!
    admin26!
    admin27!
    admin28!
    admin29!
    admin30!
    admin31!
    Admin1
    Admin2
    Admin3
    Admin4
    Admin5
    Admin6
    Admin7
    Admin8
    Admin9
    Admin0
    Admin123
    Admin1234
    Admin12345
    Admin123456
    Admin2018
    Admin2019
    Admin2020
    Admin2021
    Admin2022
    Admin!
    Admin@
    Admin#
    Admin$
    Admin!@
    Admin!@#
    Admin!@#$
    Admin123!
    Admin!123
    Admin1@
    Admin2018!
    Admin2019!
    Admin2020!
    Admin2021!
    Admin2022!
    Admin!2018
    Admin!2019
    Admin!2020
    Admin!2021
    Admin!2022
    Admin2018!@#
    Admin2019!@#
    Admin2020!@#
    Admin2021!@#
    Admin2022!@#
    Admin01!
    Admin02!
    Admin03!
    Admin04!
    Admin05!
    Admin06!
    Admin07!
    Admin08!
    Admin09!
    Admin10!
    Admin11!
    Admin12!
    Admin13!
    Admin14!
    Admin15!
    Admin16!
    Admin17!
    Admin18!
    Admin19!
    Admin20!
    Admin21!
    Admin22!
    Admin23!
    Admin24!
    Admin25!
    Admin26!
    Admin27!
    Admin28!
    Admin29!
    Admin30!
    Admin31!
    Admin01
    Admin02
    Admin03
    Admin04
    Admin05
    Admin06
    Admin07
    Admin08
    Admin09
    Admin10
    Admin11
    Admin12
    Admin13
    Admin14
    Admin15
    Admin16
    Admin17
    Admin18
    Admin19
    Admin20
    Admin21
    Admin22
    Admin23
    Admin24
    Admin25
    Admin26
    Admin27
    Admin28
    Admin29
    Admin30
    Admin31
    ```

`--weakpass`的规则位于 https://github.com/chainreactors/templates/blob/master/zombie/rule/weakpass.rule , 欢迎提供新规则

等价于

`zombie -l 1.txt -p admin --pwdrule weakpass.rule`

## Advance Usage

### 爆破模式

**ClusterBomb** (默认启用)

会自动填充默认的账号密码字典, 并进行 honeypot 的检查, 通过后会对每个用户都进行 unauth 检查, 通过后才会进行爆破, 并只爆破出任意一个账号密码即停止, 适用于大多数场景

可通过参数`--no-unauth` 与 `--no-check-honeypot` 关闭对应的检查阶段.

**Sniper**

需要`-m sniper` 启用 sniper 模式

只会爆破输入的每个目标, 不会自动选择字典, 也不会进行 unauth 与 honeypot 检查, 适用于已知密码进行批量测试的场景

### 密码生成器

密码生成器是 zombie 最核心的特点, 通过密码生成器, 可以根据场景定制爆破需求, 极大增大爆破成功率.

words 项目提供了两种密码生成器, 一种是基于掩码的生成器, 一种是基于规则的生成器. 生成器的用法请见 [words 文档](https://chainreactors.github.io/wiki/words/)

基于规则生成

`zombie -i ssh://123.123.123.123 -u root -p root --pwdrule rockyou30000.rule`

爆破 123.123.123.123 的 ssh 服务, 使用 rockyou30000 的规则库基于 root 生成 30000 个密码字典

同理, 可为 user 生成用户名

`zombie -i ssh://123.123.123.123 -u root --userrule user.rule -p root --pwdrule weakpass.rule`

!!! danger "注意"
	密码生成器生成后的字典大小可能超过预期

### 服务爆破 

通过`--params` 可控制一些特殊的参数与爆破模式, 具体请见每个 plugin 中的用例

#### SSH

爆破 ssh 密码

`zombie -s ssh -I ip.txt -u root -P pwd.txt `

通过证书批量尝试登录

`zombie -s ssh -I ip.txt -p pk:root.pem`

#### SMB

爆破 SMB 密码

`zombie -s smb -I ip.txt -u administrator -P pwd.txt`

使用 hash 批量爆破

`zombie -s smb -I ip.txt -p hash:aad3c435b514a4eeaad3b935b51304fe`

#### HTTP Auth

爆破 HTTP Auth

`zombie -s http -I ip.txt -u admin -P pwd.txt`

带路由的 auth 认证

`zombie -s http -I ip.txt -u admin -P pwd.txt --param path=admin.php`

Tomcat 爆破, 设置了默认的账号与密码字典, 是 401 场景的特殊优化, 简化操作

`zombie -s tomcat -I ip.txt `

Kibana 爆破, 与 tomcat 类似, 设置了默认的账号密码字典, 简化操作

`zombie -s kibana -I ip.txt `

#### MySQL

爆破 MySQL 密码

`zombie -s mysql -I ip.txt -u root -P pwd.txt`

#### MSSQL

爆破 MSSQL 密码

`zombie -s mssql -I ip.txt -u sa -P pwd.txt`

指定 instance

`zombie -s mssql -I ip.txt -u sa -P pwd.txt --param instance=SQLEXPRESS`

#### Oracle (WARNNING 未经过充分测试)

爆破 Oracle 密码

`zombie -s oracle -I ip.txt -u system -P pwd.txt`

指定 sid

`zombie -s oracle -I ip.txt -u system -P pwd.txt --param sid=orcl`

指定 service name

`zombie -s oracle -I ip.txt -u system -P pwd.txt --param service_name=orcl`

#### MongoDB

爆破 MongoDB 密码

`zombie -s mongodb -I ip.txt -u admin -P pwd.txt`

#### Postgre

爆破 Postgre 密码

`zombie -s postgre -I ip.txt -u postgres -P pwd.txt`

指定 dbname

`zombie -s postgre -I ip.txt -u postgres -P pwd.txt --param dbname=postgres`

#### Redis

(redis 不需要设置 user)

爆破 Redis 密码

`zombie -s redis -I ip.txt -P pwd.txt`

#### FTP

爆破 FTP 密码

`zombie -s ftp -I ip.txt -u admin -P pwd.txt`

#### SMTP

爆破 SMTP 密码

`zombie -s smtp -I ip.txt -u admin -P pwd.txt`

#### POP3

爆破 POP3 密码

`zombie -s pop3 -I ip.txt -u admin -P pwd.txt`

#### LDAP

爆破 LDAP 密码

`zombie -s ldap -I ip.txt -u admin -P pwd.txt`

#### Telnet (WARNNING 未经过充分测试) (WARNNING 不支持全部版本)

有失败的情况请提供 issue

爆破 Telnet 密码

`zombie -s telnet -I ip.txt -u admin -P pwd.txt`

#### VNC

爆破 VNC 密码

`zombie -s vnc -I ip.txt -u admin -P pwd.txt`

#### RDP

爆破 RDP 密码

`zombie -s rdp -I ip.txt -u admin -P pwd.txt`
