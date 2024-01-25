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

`zombie -l 1.txt -p google --weakpass`

将会根据 google 关键字生成常见的密码组合, 以 google 为例， 将会生成以下密码

```
google
Google
GOOGLE
gOOGLE
google1
google2
google3
google4
google5
google6
google7
google8
google9
google0
google123
google1234
google12345
google123456
google2018
google2019
google2020
google2021
google2022
...
```

`--weakpass`的规则位于 https://github.com/chainreactors/templates/blob/master/zombie/rule/weakpass.rule , 欢迎提供新规则

## Advance Usage

### 密码生成器

密码生成器是 zombie 最核心的特点, 通过密码生成器, 可以根据场景定制爆破需求, 极大增大爆破成功率.

其具体使用参见

## Example

### SSH

爆破 ssh 密码

`zombie -s ssh -I ip.txt -u root -P pwd.txt `

通过证书批量尝试登录

`zombie -s ssh -I ip.txt -p pk:root.pem`

### SMB

爆破 SMB 密码

`zombie -s smb -I ip.txt -u administrator -P pwd.txt`

使用 hash 批量爆破

`zombie -s smb -I ip.txt -p hash:aad3c435b514a4eeaad3b935b51304fe`

### HTTP Auth

爆破 HTTP Auth

`zombie -s http -I ip.txt -u admin -P pwd.txt`

带路由的 auth 认证

`zombie -s http -I ip.txt -u admin -P pwd.txt --param path=admin.php`

Tomcat 爆破, 设置了默认的账号与密码字典, 是 401 场景的特殊优化, 简化操作

`zombie -s tomcat -I ip.txt `

Kibana 爆破, 与 tomcat 类似, 设置了默认的账号密码字典, 简化操作

`zombie -s kibana -I ip.txt `

### MySQL

爆破 MySQL 密码

`zombie -s mysql -I ip.txt -u root -P pwd.txt`

### MSSQL

爆破 MSSQL 密码

`zombie -s mssql -I ip.txt -u sa -P pwd.txt`

指定 instance

`zombie -s mssql -I ip.txt -u sa -P pwd.txt --param instance=SQLEXPRESS`

### Oracle (WARNNING 未经过充分测试)

爆破 Oracle 密码

`zombie -s oracle -I ip.txt -u system -P pwd.txt`

指定 sid

`zombie -s oracle -I ip.txt -u system -P pwd.txt --param sid=orcl`

指定 service name

`zombie -s oracle -I ip.txt -u system -P pwd.txt --param service_name=orcl`

### MongoDB

爆破 MongoDB 密码

`zombie -s mongodb -I ip.txt -u admin -P pwd.txt`

### Postgre

爆破 Postgre 密码

`zombie -s postgre -I ip.txt -u postgres -P pwd.txt`

指定 dbname

`zombie -s postgre -I ip.txt -u postgres -P pwd.txt --param dbname=postgres`

### Redis

(redis 不需要设置 user)

爆破 Redis 密码

`zombie -s redis -I ip.txt -P pwd.txt`

### FTP

爆破 FTP 密码

`zombie -s ftp -I ip.txt -u admin -P pwd.txt`

### SMTP

爆破 SMTP 密码

`zombie -s smtp -I ip.txt -u admin -P pwd.txt`

### POP3

爆破 POP3 密码

`zombie -s pop3 -I ip.txt -u admin -P pwd.txt`

### LDAP

爆破 LDAP 密码

`zombie -s ldap -I ip.txt -u admin -P pwd.txt`

### Telnet (WARNNING 未经过充分测试) (WARNNING 不支持全部版本)

有失败的情况请提供 issue

爆破 Telnet 密码

`zombie -s telnet -I ip.txt -u admin -P pwd.txt`

### VNC

爆破 VNC 密码

`zombie -s vnc -I ip.txt -u admin -P pwd.txt`

### RDP

爆破 RDP 密码

`zombie -s rdp -I ip.txt -u admin -P pwd.txt`

## Advance
