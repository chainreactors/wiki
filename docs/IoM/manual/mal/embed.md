## community
### askcreds

Prompt for credentials

```
askcreds [flags]
```

**Options**

```
  -h, --help                 print help
      --note string          note to display (default "Please verify your Windows user credentials to proceed")
  -f, --output_file string   output file
      --prompt string        prompt to display (default "Restore Network Connection")
      --wait_time int        password to dump credentials for (default 30)
```

### autologon

Dump the autologon credentials

```
autologon [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

### credman

Dump the Credential Manager credentials

```
credman [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

### curl

HTTP client tool <host> [options]

```
curl [flags]
```

**Options**

```
      --body string          request body
      --disable-output       disable output display
      --header string        custom header
  -h, --help                 print help
      --host string          target host
      --method string        HTTP method (GET, POST, PUT, PATCH, DELETE) (default "GET")
      --noproxy              disable proxy usage
  -f, --output_file string   output file
      --port int             target port
      --useragent string     custom user agent
```

### dir

List directory contents [path]

```
dir [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --path string          directory path to list
      --subdirs              include subdirectories (optional)
```

### dump_sam

Dump the SAM, SECURITY and SYSTEM registries [location]

```
dump_sam [flags]
```

**Options**

```
  -h, --help                 print help
      --location string      folder to save (optional) (default "C:\\Windows\\Temp\\")
  -f, --output_file string   output file
```

### dump_wifi



### enum



**SEE ALSO**

* [enum arp](#enum-arp)	 - Enum ARP table
* [enum dc](#enum-dc)	 - Enumerate domain information using Active Directory Domain Services
* [enum dns](#enum-dns)	 - Enum DNS configuration
* [enum dotnet_process](#enum-dotnet_process)	 - Find processes that most likely have .NET loaded.
* [enum drives](#enum-drives)	 - Enumerate system drives
* [enum files](#enum-files)	 - Enumerate files <directory> <pattern> [keyword]
* [enum localcert](#enum-localcert)	 - Enumerate local certificates <store>
* [enum localsessions](#enum-localsessions)	 - Enumerate local user sessions

#### enum arp

Enum ARP table

```
enum arp [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [enum](#enum)	 - 

#### enum dc

Enumerate domain information using Active Directory Domain Services

```
enum dc [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [enum](#enum)	 - 

#### enum dns

Enum DNS configuration

```
enum dns [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [enum](#enum)	 - 

#### enum dotnet_process

Find processes that most likely have .NET loaded.

```
enum dotnet_process [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [enum](#enum)	 - 

#### enum drives

Enumerate system drives

```
enum drives [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [enum](#enum)	 - 

#### enum files

Enumerate files <directory> <pattern> [keyword]

```
enum files [flags]
```

**Options**

```
      --directory string     directory path to search
  -h, --help                 print help
      --keyword string       optional keyword filter
  -f, --output_file string   output file
      --pattern string       search pattern (e.g., *.txt)
```

**SEE ALSO**

* [enum](#enum)	 - 

#### enum localcert

Enumerate local certificates <store>

```
enum localcert [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --store string         certificate store name
```

**SEE ALSO**

* [enum](#enum)	 - 

#### enum localsessions

Enumerate local user sessions

```
enum localsessions [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [enum](#enum)	 - 

### exclusion



**SEE ALSO**

* [exclusion add](#exclusion-add)	 - Add Windows Defender exclusion <type> <data>
* [exclusion delete](#exclusion-delete)	 - Delete Windows Defender exclusion <type> <data>
* [exclusion enum](#exclusion-enum)	 - Enumerate Windows Defender exclusions

#### exclusion add

Add Windows Defender exclusion <type> <data>

```
exclusion add [flags]
```

**Options**

```
      --data string          exclusion data
  -h, --help                 print help
  -f, --output_file string   output file
      --type string          exclusion type (path, process, extension)
```

**SEE ALSO**

* [exclusion](#exclusion)	 - 

#### exclusion delete

Delete Windows Defender exclusion <type> <data>

```
exclusion delete [flags]
```

**Options**

```
      --data string          exclusion data
  -h, --help                 print help
  -f, --output_file string   output file
      --type string          exclusion type (path, process, extension)
```

**SEE ALSO**

* [exclusion](#exclusion)	 - 

#### exclusion enum

Enumerate Windows Defender exclusions

```
exclusion enum [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [exclusion](#exclusion)	 - 

### hashdump

Dump the SAM, SECURITY and SYSTEM registries

```
hashdump [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

### ipconfig

Display network configuration

```
ipconfig [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

### kill_defender

Kill or check Windows Defender <action>

```
kill_defender [flags]
```

**Options**

```
      --action string        action to perform (kill or check)
  -h, --help                 print help
  -f, --output_file string   output file
```

### klist

Interact with cached Kerberos tickets [action] [spn]

```
klist [flags]
```

**Options**

```
      --action string        action to perform (get, purge, or empty to list)
  -h, --help                 print help
  -f, --output_file string   output file
      --spn string           target SPN (required for 'get' action)
```

### ldapsearch

Perform LDAP search <query> [attributes] [result_count] [hostname] [domain]

```
ldapsearch [flags]
```

**Options**

```
      --attributes string     comma separated attributes (empty for all)
      --domain string         Distinguished Name to use (empty for Base domain)
  -h, --help                  print help
      --hostname string       DC hostname or IP (empty for Primary DC)
  -f, --output_file string    output file
      --query string          LDAP query string
      --result-count string   maximum number of results (0 for all) (default "0")
```

### load_prebuild

load full|fs|execute|sys|rem precompiled modules

```
load_prebuild [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

### logonpasswords

Extract logon passwords using mimikatz

```
logonpasswords [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

### memoryinfo

Get system memory information

```
memoryinfo [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

### memreader

Read memory from target process <target-pid> <pattern> [output-size]

```
memreader [flags]
```

**Options**

```
  -h, --help                 print help
      --output-size string   output size limit (default "10")
  -f, --output_file string   output file
      --pattern string       memory pattern to search
      --target-pid string    target process ID
```

### mimikatz

Execute mimikatz with specified commands

```
mimikatz [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

### move



**SEE ALSO**

* [move psexec](#move-psexec)	 - Execute service on target host using psexec <host> <service_name> <local_path>

#### move psexec

Execute service on target host using psexec <host> <service_name> <local_path>

```
move psexec [flags]
```

**Options**

```
  -h, --help                 print help
      --host string          target host
  -f, --output_file string   output file
      --path string          local path to service executable
      --service string       service name
```

**SEE ALSO**

* [move](#move)	 - 

### nanodump

Advanced LSASS memory dumping tool

```
nanodump [flags]
```

**Options**

```
      --chunk-size string                  chunk size in KB (default: 924)
      --duplicate                          duplicate an existing LSASS handle
      --duplicate-elevate                  duplicate and elevate handle
      --elevate-handle                     elevate handle privileges
      --fork                               fork the target process
      --getpid                             get the PID of LSASS and exit
  -h, --help                               print help
  -f, --output_file string                 output file
      --pid string                         target process PID (default: auto-detect LSASS)
      --seclogon-duplicate                 use SecLogon duplicate
      --seclogon-leak-local                use SecLogon leak (local)
      --seclogon-leak-remote               use SecLogon leak (remote)
      --seclogon-leak-remote-path string   path for remote SecLogon leak binary
      --shtinkering                        use LSASS shtinkering technique
      --silent-process-exit                use silent process exit
      --silent-process-exit-path string    path for silent process exit
      --snapshot                           snapshot the target process
      --spoof-callstack                    spoof the call stack
      --valid                              create a minidump with a valid signature
      --write                              write minidump to disk
      --write-path string                  path to write the minidump
```

### net



**SEE ALSO**

* [net user](#net-user)	 - 

#### net user



**SEE ALSO**

* [net](#net)	 - 
* [net user add](#net-user-add)	 - Add a new user account <username> <password>
* [net user enum](#net-user-enum)	 - Enumerate network users [type]
* [net user query](#net-user-query)	 - Query user information <username> [domain]

#### net user add

Add a new user account <username> <password>

```
net user add [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --password string      the password to set
      --username string      the username to add
```

**SEE ALSO**

* [net user](#net-user)	 - 

#### net user enum

Enumerate network users [type]

```
net user enum [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --type string          enumeration type (all, locked, disabled, active) (default "all")
```

**SEE ALSO**

* [net user](#net-user)	 - 

#### net user query

Query user information <username> [domain]

```
net user query [flags]
```

**Options**

```
      --domain string        domain name (optional)
  -h, --help                 print help
  -f, --output_file string   output file
      --username string      username to query
```

**SEE ALSO**

* [net user](#net-user)	 - 

### nslookup

DNS lookup <hostname> [server] [record-type]

```
nslookup [flags]
```

**Options**

```
  -h, --help                 print help
      --host string          hostname or IP to lookup
  -f, --output_file string   output file
      --record-type string   DNS record type (A, NS, CNAME, MX, AAAA, etc.) (default "A")
      --server string        DNS server to use (optional)
```

### pingscan

Ping scan target <target>

```
pingscan [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --target string        IP or hostname(eg. 10.10.121.100-10.10.121.120,192.168.0.1/24)
```

### portscan

Port scan target <target> <ports> [timeout]

```
portscan [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --ports string         ports to scan (e.g., 80,443,8080 or 1-1000)
      --target string        IPv4 ranges and CIDR (eg. 192.168.1.128, 192.168.1.128-192.168.2.240, 192.168.1.0/24)
```

### readfile

Read file content <filepath>

```
readfile [flags]
```

**Options**

```
      --filepath string      path to the file to read
  -h, --help                 print help
  -f, --output_file string   output file
```

### rem_community



**SEE ALSO**

* [rem_community connect](#rem_community-connect)	 - connect to rem
* [rem_community fork](#rem_community-fork)	 - fork rem
* [rem_community load](#rem_community-load)	 - load rem with rem.dll
* [rem_community log](#rem_community-log)	 - get rem log
* [rem_community run](#rem_community-run)	 - run rem
* [rem_community socks5](#rem_community-socks5)	 - serving socks5 with rem
* [rem_community stop](#rem_community-stop)	 - stop rem

#### rem_community connect

connect to rem

```
rem_community connect [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [rem_community](#rem_community)	 - 

#### rem_community fork

fork rem

```
rem_community fork [flags]
```

**Options**

```
  -h, --help                 print help
      --local_url string     local_url
      --mod string           mod
  -f, --output_file string   output file
      --remote_url string    remote_url
```

**SEE ALSO**

* [rem_community](#rem_community)	 - 

#### rem_community load

load rem with rem.dll

```
rem_community load [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [rem_community](#rem_community)	 - 

#### rem_community log

get rem log

```
rem_community log [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [rem_community](#rem_community)	 - 

#### rem_community run

run rem

```
rem_community run [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --pipe string          pipe
```

**SEE ALSO**

* [rem_community](#rem_community)	 - 

#### rem_community socks5

serving socks5 with rem

```
rem_community socks5 [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --pass string          pass
      --port string          port
      --user string          user
```

**SEE ALSO**

* [rem_community](#rem_community)	 - 

#### rem_community stop

stop rem

```
rem_community stop [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [rem_community](#rem_community)	 - 

### route



**SEE ALSO**

* [route print](#route-print)	 - Display routing table

#### route print

Display routing table

```
route print [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [route](#route)	 - 

### screenshot

Command: situational screenshot <filename>

```
screenshot [flags]
```

**Options**

```
      --filename string      filename to save screenshot (default "screenshot.jpg")
  -h, --help                 print help
  -f, --output_file string   output file
```

### systeminfo

Display system information

```
systeminfo [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

### token



**SEE ALSO**

* [token make](#token-make)	 - Create impersonated token from credentials <username> <password> <domain> [type]
* [token steal](#token-steal)	 - Steal access token from a process <pid>

#### token make

Create impersonated token from credentials <username> <password> <domain> [type]

```
token make [flags]
```

**Options**

```
      --domain string        domain for token creation
  -h, --help                 print help
  -f, --output_file string   output file
      --password string      password for token creation
      --type string          logon type (2-Interactive, 3-Network, 4-Batch, 5-Service, 8-NetworkCleartext, 9-NewCredentials) (default "9")
      --username string      username for token creation
```

**SEE ALSO**

* [token](#token)	 - 

#### token steal

Steal access token from a process <pid>

```
token steal [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --pid string           process ID to steal token from
```

**SEE ALSO**

* [token](#token)	 - 

### wifi



**SEE ALSO**

* [wifi dump](#wifi-dump)	 - Dump WiFi profile credentials <profilename>
* [wifi enum](#wifi-enum)	 - Enumerate WiFi profiles

#### wifi dump

Dump WiFi profile credentials <profilename>

```
wifi dump [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
      --profilename string   WiFi profile name to dump
```

**SEE ALSO**

* [wifi](#wifi)	 - 

#### wifi enum

Enumerate WiFi profiles

```
wifi enum [flags]
```

**Options**

```
  -h, --help                 print help
  -f, --output_file string   output file
```

**SEE ALSO**

* [wifi](#wifi)	 - 

