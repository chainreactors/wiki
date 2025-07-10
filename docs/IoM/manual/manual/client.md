## generic
### !
Run a command

```
! [command]
```

### broadcast
Broadcast a message to all clients

```
broadcast [message] [flags]
```

**Options**

```
  -n, --notify   notify the message to third-party services
```

### exit
exit client

```
exit
```

### license
show server license info

**Description**

show server license info

```
license
```

**Examples**

~~~
license
~~~

### login
Login to server

![login](/wiki/IoM/assets/login.gif)

```
login
```

### pivot
List all pivot agents

**Description**

List all active pivot agents with their details

```
pivot [flags]
```

**Examples**

List all pivot agents:
~~~
pivot
~~~

**Options**

```
  -a, --all   list all pivot agents
```

### version
show server version

```
version
```

## manage
### background
back to root context

**Description**

Exit the current session and return to the root context.

```
background
```

### history
show log history

**Description**

Displays the specified number of log lines of the current session.

```
history
```

### obverse
observe manager

**Description**

Control observers to listen session in the background.

```
obverse [flags]
```

**Examples**

~~~
// List all observers
observe -l

// Remove observer
observe -r
~~~

**Options**

```
  -l, --list     list all observers
  -r, --remove   remove observer
```

### session
List and Choice sessions

**Description**

Display a table of active sessions on the server, 
allowing you to navigate up and down to select a desired session. 
Press the Enter key to use the selected session. 
Use the -a or --all option to display all sessions, including those that have been disconnected.
		

```
session [flags]
```

**Examples**

~~~
// List all active sessions
session

// List all sessions, including those that have been disconnected
session -a
~~~

**Options**

```
  -a, --all   show all sessions
```

**SEE ALSO**

* [session group](#session-group)	 - group session
* [session newbind](#session-newbind)	 - new bind session
* [session note](#session-note)	 - add note to session
* [session remove](#session-remove)	 - remove session

#### session group
group session

**Description**

Add a session to a group. If the group does not exist, it will be created.
When using an active session, only provide the group name.

```
session group [group] [session]
```

**Examples**

~~~
// Add a session to a group
group newGroup 08d6c05a21512a79a1dfeb9d2a8f262f

// Add a session to a group when using an active session
group newGroup
~~~

**SEE ALSO**

* [session](#session)	 - List and Choice sessions

#### session newbind
new bind session

```
session newbind [session] [flags]
```

**Options**

```
  -n, --name string       session name
      --pipeline string   pipeline id
  -t, --target string     session target
```

**SEE ALSO**

* [session](#session)	 - List and Choice sessions

#### session note
add note to session

**Description**

Add a note to a session. If a note already exists, it will be updated. 
When using an active session, only provide the new note.

```
session note [note] [session]
```

**Examples**

~~~
// Add a note to specified session
note newNote 08d6c05a21512a79a1dfeb9d2a8f262f

// Add a note when using an active session
note newNote
~~~

**SEE ALSO**

* [session](#session)	 - List and Choice sessions

#### session remove
remove session

**Description**

Remove a specified session.

```
session remove [session]
```

**Examples**

~~~
// remove a specified session
remove 08d6c05a21512a79a1dfeb9d2a8f262f
~~~

**SEE ALSO**

* [session](#session)	 - List and Choice sessions

### use
Use session

**Description**

use

```
use [session]
```

### alias
manage aliases

**Description**


Macros are using the sideload or spawndll commands under the hood, depending on the use case. 

For Linux and Mac OS, the sideload command will be used. On Windows, it will depend on whether the macro file is a reflective DLL or not. 

Load a macro: 
~~~
load /tmp/chrome-dump 
~~~

Sliver macros have the following structure (example for the chrome-dump macro): 

chrome-dump 
* chrome-dump.dll 
* chrome-dump.so 
* manifest.json

It is a directory containing any number of files, with a mandatory manifest.json, that has the following structure: 

~~~
{ 
	"macroName":"chrome-dump", // name of the macro, can be anything
	"macroCommands":[ 
		{ 
			"name":"chrome-dump", // name of the command available in the sliver client (no space)
			"entrypoint":"ChromeDump", // entrypoint of the shared library to execute
			"help":"Dump Google Chrome cookies", // short help message
			"allowArgs":false, // make it true if the commands require arguments
			"defaultArgs": "test", // if you need to pass a default argument
			"extFiles":[ // list of files, groupped per target OS
				{ 
					"os":"windows", // Target OS for the following files. Values can be "windows", "linux" or "darwin" 
					"files":{ 
						"x64":"chrome-dump.dll", 
						"x86":"chrome-dump.x86.dll" // only x86 and x64 arch are supported, path is relative to the macro directory
					} 
				}, 
				{
					"os":"linux", 
					"files":{
						"x64":"chrome-dump.so" 
					} 
				}, 
				{
					"os":"darwin", 
					"files":{ 
						"x64":"chrome-dump.dylib"
						} 
					} 
				], 
			"isReflective":false // only set to true when using a reflective DLL
		} 
	] 
} 
~~~

Each command will have the --process flag defined, which allows you to specify the process to inject into. The following default values are set:
	
	- Windows: c:\windows\system32\notepad.exe 
	- Linux: /bin/bash 
	- Mac OS X: /Applications/Safari.app/Contents/MacOS/SafariForWebKitDevelopment


```
alias
```

**SEE ALSO**

* [alias install](#alias-install)	 - Install a command alias
* [alias list](#alias-list)	 - List all aliases
* [alias load](#alias-load)	 - Load a command alias
* [alias remove](#alias-remove)	 - Remove an alias

#### alias install
Install a command alias

**Description**

See Docs at https://sliver.sh/docs?name=Aliases%20and%20Extensions

```
alias install [alias_file]
```

**Examples**


~~~
// Install a command alias
alias install ./rubeus.exe
~~~

**SEE ALSO**

* [alias](#alias)	 - manage aliases

#### alias list
List all aliases

**Description**

See Docs at https://sliver.sh/docs?name=Aliases%20and%20Extensions

```
alias list
```

**SEE ALSO**

* [alias](#alias)	 - manage aliases

#### alias load
Load a command alias

**Description**

See Docs at https://sliver.sh/docs?name=Aliases%20and%20Extensions

```
alias load [alias]
```

**Examples**


~~~
// Load a command alias
alias load /tmp/chrome-dump
~~~

**SEE ALSO**

* [alias](#alias)	 - manage aliases

#### alias remove
Remove an alias

**Description**

See Docs at https://sliver.sh/docs?name=Aliases%20and%20Extensions

```
alias remove [alias]
```

**Examples**


~~~
// Remove an alias
alias remove rubeus
~~~

**SEE ALSO**

* [alias](#alias)	 - manage aliases

### extension
Extension commands

**Description**

See Docs at https://sliver.sh/docs?name=Aliases%20and%20Extensions

```
extension
```

**SEE ALSO**

* [extension install](#extension-install)	 - Install an extension
* [extension list](#extension-list)	 - List all extensions
* [extension load](#extension-load)	 - Load an extension
* [extension remove](#extension-remove)	 - Remove an extension

#### extension install
Install an extension

**Description**

See Docs at https://sliver.sh/docs?name=Aliases%20and%20Extensions

```
extension install [extension_file]
```

**Examples**


~~~
// Install an extension
extension install ./credman.tar.gz
~~~


**SEE ALSO**

* [extension](#extension)	 - Extension commands

#### extension list
List all extensions

**Description**

See Docs at https://sliver.sh/docs?name=Aliases%20and%20Extensions

```
extension list
```

**SEE ALSO**

* [extension](#extension)	 - Extension commands

#### extension load
Load an extension

**Description**

See Docs at https://sliver.sh/docs?name=Aliases%20and%20Extensions

```
extension load [extension]
```

**Examples**


~~~
// Load an extension
extension load ./credman/
~~~


**SEE ALSO**

* [extension](#extension)	 - Extension commands

#### extension remove
Remove an extension

**Description**

See Docs at https://sliver.sh/docs?name=Aliases%20and%20Extensions

```
extension remove [extension]
```

**Examples**


~~~
// Remove an extension
extension remove credman
~~~


**SEE ALSO**

* [extension](#extension)	 - Extension commands

### armory
Automatically download and install extensions/aliases

![armory](/wiki/IoM/assets/armory.gif)

**Description**

See Docs at https://sliver.sh/docs?name=Armory

```
armory [flags]
```

**Options**

```
      --bundle           install bundle
  -c, --ignore-cache     ignore metadata cache, force refresh
  -I, --insecure         skip tls certificate validation
  -p, --proxy string     specify a proxy url (e.g. http://localhost:8080)
  -t, --timeout string   download timeout
```

**SEE ALSO**

* [armory install](#armory-install)	 - Install a command armory
* [armory search](#armory-search)	 - Search for armory packages
* [armory update](#armory-update)	 - Update installed armory packages

#### armory install
Install a command armory

**Description**

See Docs at https://sliver.sh/docs?name=Armory

```
armory install [armory] [flags]
```

**Examples**


~~~
// Install a command armory
armory install rubeus 
~~~

**Options**

```
  -a, --armory string   name of the armory to install from (default "Default")
  -f, --force           force installation of package, overwriting the package if it exists
```

**Options inherited from parent commands**

```
  -c, --ignore-cache     ignore metadata cache, force refresh
  -I, --insecure         skip tls certificate validation
  -p, --proxy string     specify a proxy url (e.g. http://localhost:8080)
  -t, --timeout string   download timeout
```

**SEE ALSO**

* [armory](#armory)	 - Automatically download and install extensions/aliases

#### armory search
Search for armory packages

**Description**

See Docs at https://sliver.sh/docs?name=Armory

```
armory search [armory]
```

**Options inherited from parent commands**

```
  -c, --ignore-cache     ignore metadata cache, force refresh
  -I, --insecure         skip tls certificate validation
  -p, --proxy string     specify a proxy url (e.g. http://localhost:8080)
  -t, --timeout string   download timeout
```

**SEE ALSO**

* [armory](#armory)	 - Automatically download and install extensions/aliases

#### armory update
Update installed armory packages

**Description**

See Docs at https://sliver.sh/docs?name=Armory

```
armory update [flags]
```

**Options**

```
  -a, --armory string   name of armory to install package from (default "Default")
```

**Options inherited from parent commands**

```
  -c, --ignore-cache     ignore metadata cache, force refresh
  -I, --insecure         skip tls certificate validation
  -p, --proxy string     specify a proxy url (e.g. http://localhost:8080)
  -t, --timeout string   download timeout
```

**SEE ALSO**

* [armory](#armory)	 - Automatically download and install extensions/aliases

### mal
mal commands

```
mal [flags]
```

**Options**

```
      --ignore-cache     ignore cache
      --insecure         insecure
      --proxy string     proxy
      --timeout string   timeout
```

**SEE ALSO**

* [mal install](#mal-install)	 - Install a mal manifest
* [mal list](#mal-list)	 - List mal manifests
* [mal load](#mal-load)	 - Load a mal manifest
* [mal refresh](#mal-refresh)	 - Refresh mal manifests
* [mal remove](#mal-remove)	 - Remove a mal manifest

#### mal install
Install a mal manifest

```
mal install [mal_file] [flags]
```

**Options**

```
      --ignore-cache     ignore cache
      --insecure         insecure
      --proxy string     proxy
      --timeout string   timeout
      --version string   mal version to install (default "latest")
```

**SEE ALSO**

* [mal](#mal)	 - mal commands

#### mal list
List mal manifests

```
mal list
```

**SEE ALSO**

* [mal](#mal)	 - mal commands

#### mal load
Load a mal manifest

```
mal load [mal]
```

**SEE ALSO**

* [mal](#mal)	 - mal commands

#### mal refresh
Refresh mal manifests

```
mal refresh
```

**SEE ALSO**

* [mal](#mal)	 - mal commands

#### mal remove
Remove a mal manifest

```
mal remove [mal]
```

**SEE ALSO**

* [mal](#mal)	 - mal commands

### config
Config operations

```
config
```

**SEE ALSO**

* [config github](#config-github)	 - Show Github config and more operations
* [config notify](#config-notify)	 - Show Notify config and more operations
* [config refresh](#config-refresh)	 - Refresh config

#### config github
Show Github config and more operations

```
config github
```

**SEE ALSO**

* [config](#config)	 - Config operations
* [config github update](#config-github-update)	 - Update Github config

#### config github update
Update Github config

```
config github update [flags]
```

**Options**

```
      --owner string          github owner
      --repo string           github repo
      --token string          github token
      --workflowFile string   github workflow file
```

**SEE ALSO**

* [config github](#config-github)	 - Show Github config and more operations

#### config notify
Show Notify config and more operations

```
config notify
```

**SEE ALSO**

* [config](#config)	 - Config operations
* [config notify update](#config-notify-update)	 - Update Notify config

#### config notify update
Update Notify config

```
config notify update [flags]
```

**Options**

```
      --dingtalk-enable           enable dingtalk
      --dingtalk-secret string    dingtalk secret
      --dingtalk-token string     dingtalk token
      --lark-enable               enable lark
      --lark-webhook-url string   lark webhook url
      --serverchan-enable         enable serverchan
      --serverchan-url string     serverchan url
      --telegram-chat-id int      telegram chat id
      --telegram-enable           enable telegram
      --telegram-token string     telegram token
```

**SEE ALSO**

* [config notify](#config-notify)	 - Show Notify config and more operations

#### config refresh
Refresh config

```
config refresh [flags]
```

**Options**

```
      --client   Refresh client config
```

**SEE ALSO**

* [config](#config)	 - Config operations

### context
Context management

**Description**

Manage different types of contexts (download, upload, credential, etc)

```
context
```

**SEE ALSO**

* [context credential](#context-credential)	 - List credential contexts
* [context download](#context-download)	 - List download contexts
* [context keylogger](#context-keylogger)	 - List keylogger contexts
* [context port](#context-port)	 - List port scan contexts
* [context screenshot](#context-screenshot)	 - List screenshot contexts
* [context upload](#context-upload)	 - List upload contexts

#### context credential
List credential contexts

```
context credential
```

**SEE ALSO**

* [context](#context)	 - Context management

#### context download
List download contexts

```
context download
```

**SEE ALSO**

* [context](#context)	 - Context management

#### context keylogger
List keylogger contexts

```
context keylogger
```

**SEE ALSO**

* [context](#context)	 - Context management

#### context port
List port scan contexts

```
context port
```

**SEE ALSO**

* [context](#context)	 - Context management

#### context screenshot
List screenshot contexts

```
context screenshot
```

**SEE ALSO**

* [context](#context)	 - Context management

#### context upload
List upload contexts

```
context upload
```

**SEE ALSO**

* [context](#context)	 - Context management

### sync
Sync context

**Description**

sync context from server

```
sync [context_id]
```

**Examples**

~~~
sync [context_id]
~~~

### cert
Cert list

```
cert
```

**Examples**

~~~
cert
~~~

**SEE ALSO**

* [cert delete](#cert-delete)	 - 
* [cert download](#cert-download)	 - download a cert
* [cert import](#cert-import)	 - import a new cert
* [cert self_signed](#cert-self_signed)	 - generate a self-signed cert
* [cert update](#cert-update)	 - update a cert

#### cert delete
```

![cert delete](/wiki/IoM/assets/cert_delete.png)
cert delete
```

**Examples**

~~~
// delete a cert
cert delete cert-name
~~~

**SEE ALSO**

* [cert](#cert)	 - Cert list

#### cert download
download a cert

![cert download](/wiki/IoM/assets/cert_download.png)

```
cert download [flags]
```

**Examples**

~~~
// download a cert
cert download cert-name -o cert_path 
~~~

**Options**

```
  -o, --output string   cert save path
```

**SEE ALSO**

* [cert](#cert)	 - Cert list

#### cert import
import a new cert

```
cert import [flags]
```

**Examples**

~~~
// generate a imported cert to server
cert import --cert cert_file_path --key key_file_path --ca-cert ca_cert_path
~~~

**Options**

```
      --ca-cert string   tls ca cert path
      --cert string      tls cert path
      --key string       tls key path
```

**SEE ALSO**

* [cert](#cert)	 - Cert list

#### cert self_signed
generate a self-signed cert

```
cert self_signed [flags]
```

**Examples**

~~~
// generate a self-signed cert without using certificate information
cert selfSign

// generate a self-signed cert using certificate information
cert selfSign --CN commonName --O "Example Organization" --C US --L "San Francisco" --OU "IT Department" --ST California --validity 365
~~~

**Options**

```
      --C string          Certificate Country (C)
      --CN string         Certificate Common Name (CN)
      --L string          Certificate Locality/City (L)
      --O string          Certificate Organization (O)
      --OU string         Certificate Organizational Unit (OU)
      --ST string         Certificate State/Province (ST)
      --validity string   Certificate validity period in days (default "365")
```

**SEE ALSO**

* [cert](#cert)	 - Cert list

#### cert update
update a cert

![cert update](/wiki/IoM/assets/cert_update.png)

```
cert update [flags]
```

**Examples**

~~~
// update a cert
cert update cert-name --cert cert_path --key key_path --type imported
~~~

**Options**

```
      --ca-cert string   tls ca cert path
      --cert string      tls cert path
      --key string       tls key path
      --type string      cert type
```

**SEE ALSO**

* [cert](#cert)	 - Cert list

## listener
### job
List jobs in server

**Description**

Use a table to list jobs on the server

```
job
```

**Examples**

~~~
job
~~~

### listener
List listeners in server

**Description**

Use a table to list listeners on the server

```
listener
```

**Examples**

~~~
listener
~~~

### pipeline
manage pipeline

```
pipeline
```

**SEE ALSO**

* [pipeline delete](#pipeline-delete)	 - Delete a pipeline
* [pipeline list](#pipeline-list)	 - List pipelines in listener
* [pipeline start](#pipeline-start)	 - Start a TCP pipeline
* [pipeline stop](#pipeline-stop)	 - Stop pipeline

#### pipeline delete
Delete a pipeline

```
pipeline delete
```

**SEE ALSO**

* [pipeline](#pipeline)	 - manage pipeline

#### pipeline list
List pipelines in listener

```
pipeline list
```

**Examples**


list all pipelines
~~~
pipeline list
~~~

list pipelines in listener
~~~
pipeline list listener_id
~~~

**SEE ALSO**

* [pipeline](#pipeline)	 - manage pipeline

#### pipeline start
Start a TCP pipeline

**Description**

Start a TCP pipeline with the specified name and listener ID

```
pipeline start [flags]
```

**Examples**

~~~
tcp start tcp_test
~~~

**Options**

```
      --cert-name string   certificate name
```

**SEE ALSO**

* [pipeline](#pipeline)	 - manage pipeline

#### pipeline stop
Stop pipeline

**Description**

Stop pipeline with the specified name and listener ID

```
pipeline stop
```

**Examples**

~~~
pipeline stop tcp_test
~~~

**SEE ALSO**

* [pipeline](#pipeline)	 - manage pipeline

### website
Register a new website

![website](/wiki/IoM/assets/website.gif)

**Description**

Register a new website with the specified listener. If **name** is not provided, it will be generated in the format **listenerID_web_port**.

```
website [flags]
```

**Examples**

~~~
// Register a website with the default settings
website web_test --listener tcp_default --root /webtest

// Register a website with a custom name and port
website web_test --listener tcp_default --port 5003 --root /webtest

// Register a website with TLS enabled
website web_test --listener tcp_default --root /webtest --tls --cert /path/to/cert --key /path/to/key
~~~

**Options**

```
      --acme               auto cert by let's encrypt
      --cert string        tls cert path
      --cert-name string   certificate name
      --domain string      auto cert domain
      --host string        pipeline host, the default value is **0.0.0.0** (default "0.0.0.0")
      --ip string          external ip (default "ip")
      --key string         tls key path
  -l, --listener string    listener id
  -p, --port uint32        pipeline port, random port is selected from the range **10000-15000** 
      --root string        website root path (default "/")
  -t, --tls                enable tls
```

**SEE ALSO**

* [website add](#website-add)	 - Add content to a website
* [website list](#website-list)	 - List website in listener
* [website list-content](#website-list-content)	 - List content in a website
* [website remove](#website-remove)	 - Remove content from a website
* [website start](#website-start)	 - Start a website
* [website stop](#website-stop)	 - Stop a website
* [website update](#website-update)	 - Update content in a website

#### website add
Add content to a website

**Description**

Add new content to an existing website

```
website add [file_path] [flags]
```

**Examples**

~~~
// Add content to a website with default web path (using filename)
website add /path/to/content.html --website web_test

// Add content to a website with custom web path and type
website add /path/to/content.html --website web_test --path /custom/path --type text/html
~~~

**Options**

```
      --path string      web path for the content (defaults to filename)
      --type string      content type of the file (default "raw")
      --website string   website name (required)
```

**SEE ALSO**

* [website](#website)	 - Register a new website

#### website list
List website in listener

**Description**

Use a table to list websites along with their corresponding listeners

```
website list
```

**Examples**

~~~
website [listener]
~~~

**SEE ALSO**

* [website](#website)	 - Register a new website

#### website list-content
List content in a website

**Description**

List all content in a website with detailed information

```
website list-content [website_name]
```

**Examples**

~~~
// List all content in a website with detailed information
website list-content web_test
~~~

**SEE ALSO**

* [website](#website)	 - Register a new website

#### website remove
Remove content from a website

**Description**

Remove content from an existing website using content ID

```
website remove [content_id]
```

**Examples**

~~~
// Remove content from a website using content ID
website remove 123e4567-e89b-12d3-a456-426614174000
~~~

**SEE ALSO**

* [website](#website)	 - Register a new website

#### website start
Start a website

**Description**

Start a website with the specified name

```
website start [name]
```

**Examples**

~~~
// Start a website
website start web_test 
~~~

**SEE ALSO**

* [website](#website)	 - Register a new website

#### website stop
Stop a website

**Description**

Stop a website with the specified name

```
website stop [name] [flags]
```

**Examples**

~~~
// Stop a website
website stop web_test --listener tcp_default
~~~

**Options**

```
      --listener string   listener ID
```

**SEE ALSO**

* [website](#website)	 - Register a new website

#### website update
Update content in a website

**Description**

Update existing content in a website using content ID

```
website update [content_id] [file_path] [flags]
```

**Examples**

~~~
// Update content in a website with content ID
website update 123e4567-e89b-12d3-a456-426614174000 /path/to/new_content.html --website web_test
~~~

**Options**

```
      --type string      content type of the file (default "raw")
      --website string   website name (required)
```

**SEE ALSO**

* [website](#website)	 - Register a new website

### bind
Register a new bind pipeline and start it

```
bind [flags]
```

**Examples**


new bind pipeline
~~~
bind listener
~~~


**Options**

```
      --listener string   listener id
```

### http
Register a new HTTP pipeline and start it

**Description**

Register a new HTTP pipeline with the specified listener.

```
http [flags]
```

**Examples**

~~~
// Register an HTTP pipeline with the default settings
http --listener http_default

// Register an HTTP pipeline with custom headers and error page
http --name http_test --listener http_default --host 192.168.0.43 --port 8080 --headers "Content-Type=text/html" --error-page /path/to/error.html

// Register an HTTP pipeline with TLS enabled
http --listener http_default --tls --cert_path /path/to/cert --key_path /path/to/key
~~~

**Options**

```
      --acme                     auto cert by let's encrypt
      --cert string              tls cert path
      --cert-name string         certificate name
      --domain string            auto cert domain
      --encryption-key string    encryption key
      --encryption-type string   encryption type
      --error-page string        Path to custom error page file
      --headers stringToString   HTTP response headers (key=value) (default [])
      --host string              pipeline host, the default value is **0.0.0.0** (default "0.0.0.0")
      --ip string                external ip (default "ip")
      --key string               tls key path
  -l, --listener string          listener id
      --parser string            pipeline parser (default "default")
  -p, --port uint32              pipeline port, random port is selected from the range **10000-15000** 
  -t, --tls                      enable tls
```

### rem
```
rem
```

**Examples**

~~~
rem
~~~

**SEE ALSO**

* [rem delete](#rem-delete)	 - Delete a REM
* [rem list](#rem-list)	 - List REMs in listener
* [rem new](#rem-new)	 - Register a new REM and start it
* [rem start](#rem-start)	 - Start a REM
* [rem stop](#rem-stop)	 - Stop a REM

#### rem delete
Delete a REM

```
rem delete
```

**Examples**

~~~
rem delete rem_test
~~~

**SEE ALSO**

* [rem](#rem)	 - 

#### rem list
List REMs in listener

**Description**

Use a table to list REMs along with their corresponding listeners

```
rem list [listener]
```

**Examples**

~~~
rem
~~~

**SEE ALSO**

* [rem](#rem)	 - 

#### rem new
Register a new REM and start it

**Description**

Register a new REM with the specified listener.

```
rem new [name] [flags]
```

**Examples**

~~~
// Register a REM with the default settings
rem new --listener listener_id

// Register a REM with a custom name and console URL
rem new --name rem_test --listener listener_id -c tcp://127.0.0.1:19966
~~~

**Options**

```
  -c, --console string    REM console URL (default "tcp://0.0.0.0")
  -l, --listener string   listener id
```

**SEE ALSO**

* [rem](#rem)	 - 

#### rem start
Start a REM

**Description**

Start a REM with the specified name

```
rem start
```

**Examples**

~~~
rem start rem_test
~~~

**SEE ALSO**

* [rem](#rem)	 - 

#### rem stop
Stop a REM

**Description**

Stop a REM with the specified name

```
rem stop
```

**Examples**

~~~
rem stop rem_test
~~~

**SEE ALSO**

* [rem](#rem)	 - 

### tcp
Register a new TCP pipeline and start it

![tcp](/wiki/IoM/assets/tcp.gif)

**Description**

Register a new TCP pipeline with the specified listener.

```
tcp [flags]
```

**Examples**

~~~
// Register a TCP pipeline with the default settings
tcp --listener tcp_default

// Register a TCP pipeline with a custom name, host, and port
tcp --name tcp_test --listener tcp_default --host 192.168.0.43 --port 5003

// Register a TCP pipeline with TLS enabled and specify certificate and key paths
tcp --listener tcp_default --tls --cert_path /path/to/cert --key_path /path/to/key
~~~

**Options**

```
      --acme                     auto cert by let's encrypt
      --cert string              tls cert path
      --cert-name string         certificate name
      --domain string            auto cert domain
      --encryption-key string    encryption key
      --encryption-type string   encryption type
      --host string              pipeline host, the default value is **0.0.0.0** (default "0.0.0.0")
      --ip string                external ip (default "ip")
      --key string               tls key path
  -l, --listener string          listener id
      --parser string            pipeline parser (default "default")
  -p, --port uint32              pipeline port, random port is selected from the range **10000-15000** 
  -t, --tls                      enable tls
```

## generator
### artifact
artifact manage

**Description**

Manage build output files on the server. Use the **list** command to view all available artifacts, **download** to retrieve a specific artifact, and **upload** to add a new artifact to the server.

**SEE ALSO**

* [artifact delete](#artifact-delete)	 - Delete a artifact file in the server
* [artifact download](#artifact-download)	 - Download a build output file from the server
* [artifact list](#artifact-list)	 - list build output file in server
* [artifact show](#artifact-show)	 - show artifact info and profile
* [artifact upload](#artifact-upload)	 - Upload a build output file to the server

#### artifact delete
Delete a artifact file in the server

**Description**

Delete a specify artifact in the server.



```
artifact delete  
```

**Examples**


~~~
artifact delete --name artifact_name
~~~


**SEE ALSO**

* [artifact](#artifact)	 - artifact manage

#### artifact download
Download a build output file from the server

**Description**

Download a specific build output file from the server by specifying its unique artifact name.


```
artifact download [flags]
```

**Examples**


// Download a artifact
	artifact download artifact_name

// Download a artifact to specific path
	artifact download artifact_name -o /path/to/output

// Download an artifact in a specific format (e.g.raw, bin, golang source, C source, etc.)
  	artifact download artifact_name --format raw


**Options**

```
  -f, --format string   the format of the artifact (default "executable")
  -o, --output string   output path
```

**SEE ALSO**

* [artifact](#artifact)	 - artifact manage

#### artifact list
list build output file in server

**Description**

Retrieve a list of all build output files currently stored on the server.

This command fetches metadata about artifacts, such as their names, IDs, and associated build configurations. The artifacts are displayed in a table format for easy navigation.

```
artifact list
```

**Examples**

~~~
// List all available build artifacts on the server
artifact list

// Navigate the artifact table and press enter to download a specific artifact
~~~

**SEE ALSO**

* [artifact](#artifact)	 - artifact manage

#### artifact show
show artifact info and profile

```
artifact show [flags]
```

**Examples**

~~~
artifact show artifact_name

artifact show artifact_name --profile
~~~

**Options**

```
      --profile   show profile
```

**SEE ALSO**

* [artifact](#artifact)	 - artifact manage

#### artifact upload
Upload a build output file to the server

**Description**

Upload a custom artifact to the server for storage or further use.



```
artifact upload [flags]
```

**Examples**

~~~
// Upload an artifact with default settings
artifact upload /path/to/artifact

// Upload an artifact with a specific stage and alias name
artifact upload /path/to/artifact --stage production --name my_artifact

// Upload an artifact and specify its type
artifact upload /path/to/artifact --type DLL
~~~

**Options**

```
  -n, --name string   alias name
  -t, --type string   Set type
```

**SEE ALSO**

* [artifact](#artifact)	 - artifact manage

### build
build

**SEE ALSO**

* [build beacon](#build-beacon)	 - Build a beacon
* [build log](#build-log)	 - Show build log
* [build modules](#build-modules)	 - Compile specified modules into DLLs
* [build pulse](#build-pulse)	 - stage 0 shellcode generate

#### build beacon
Build a beacon

![build beacon](/wiki/IoM/assets/build_beacon.png)

**Description**

Generate a beacon artifact based on the specified profile.


```
build beacon [flags]
```

**Examples**

~~~
// Build a beacon
build beacon --target x86_64-unknown-linux-musl --profile tcp_deafult

// Build a beacon using additional modules
build beacon --target x86_64-pc-windows-msvc --profile tcp_deafult --modules full

// Build a beacon with rem
build beacon --rem --target x86_64-pc-windows-msvc --profile tcp_deafult

// Build a beacon by saas
build beacon --target x86_64-pc-windows-msvc --profile tcp_deafult --source saas
~~~

**Options**

```
      --address string        implant address target
      --interval int          interval /second (default -1)
      --jitter float          jitter (default -1)
  -m, --modules string        Set modules e.g.: execute_exe,execute_dll
      --owner string          github owner
      --profile string        profile name
      --proxy string          Overwrite proxy
      --relink uint32         relink pulse id
      --rem                   static link to rem
      --remove                remove workflow
      --repo string           github repo
      --source string         build source, docker, action, saas
      --target string         build target, specify the target arch and platform, such as  **x86_64-pc-windows-msvc**.
      --token string          github token
      --workflowFile string   github workflow file
```

**SEE ALSO**

* [build](#build)	 - build

#### build log
Show build log

**Description**

Displays the log for the specified number of rows

```
build log [flags]
```

**Examples**


~~~
build log artifact_name --limit 70
~~~


**Options**

```
      --limit int   limit of rows (default 50)
```

**SEE ALSO**

* [build](#build)	 - build

#### build modules
Compile specified modules into DLLs

**Description**

Compile the specified modules into DLL files for deployment or integration.


```
build modules [flags]
```

**Examples**

~~~
// Compile all modules for the Windows platform
build modules --target x86_64-unknown-linux-musl --profile module_profile

// Compile a predefined feature set of modules (nano)
build modules --target x86_64-unknown-linux-musl --profile module_profile --modules nano

// Compile specific modules into DLLs
build modules --target x86_64-pc-windows-msvc --profile module_profile --modules base,execute_dll

// Compile third party module(curl, rem)
build modules --3rd rem --target x86_64-pc-windows-msvc --profile module_profile

// Compile module by saas
build modules --target x86_64-pc-windows-msvc --profile module_profile --source saas
~~~

**Options**

```
      --3rd string            build 3rd-party modules
  -m, --modules string        Set modules e.g.: execute_exe,execute_dll
      --owner string          github owner
      --profile string        profile name
      --remove                remove workflow
      --repo string           github repo
      --source string         build source, docker, action, saas
      --target string         build target, specify the target arch and platform, such as  **x86_64-pc-windows-msvc**.
      --token string          github token
      --workflowFile string   github workflow file
```

**SEE ALSO**

* [build](#build)	 - build

#### build pulse
stage 0 shellcode generate

![build pulse](/wiki/IoM/assets/build_pulse.png)

**Description**

Generate 'pulse' payload,a minimized shellcode template, corresponding to CS artifact, very suitable for loading by various loaders


```
build pulse [flags]
```

**Examples**


~~~
// Build a pulse payload
build pulse --target x86_64-unknown-linux-musl --profile pulse_profile

// Build a pulse payload by specifying artifact
build pulse --target x86_64-pc-windows-msvc --profile pulse_profile --artifact-id 1
~~~


**Options**

```
      --address string        implant address target
      --artifact-id uint32    load remote shellcode build-id
      --owner string          github owner
      --profile string        profile name
      --remove                remove workflow
      --repo string           github repo
      --source string         build source, docker, action, saas
      --target string         build target, specify the target arch and platform, such as  **x86_64-pc-windows-msvc**.
      --token string          github token
      --workflowFile string   github workflow file
```

**SEE ALSO**

* [build](#build)	 - build

### profile
compile profile 

```
profile
```

**SEE ALSO**

* [profile delete](#profile-delete)	 - Delete a compile profile in server
* [profile list](#profile-list)	 - List all compile profile
* [profile load](#profile-load)	 - Load exist implant profile
* [profile new](#profile-new)	 - Create new compile profile with default profile

#### profile delete
Delete a compile profile in server

```
profile delete
```

**Examples**


~~~
profile delete profile_name
~~~


**SEE ALSO**

* [profile](#profile)	 - compile profile 

#### profile list
List all compile profile

```
profile list
```

**Examples**

~~~
// List all compile profiles
profile list
~~~

**SEE ALSO**

* [profile](#profile)	 - compile profile 

#### profile load
Load exist implant profile

**Description**


The **profile load** command requires a valid configuration file path (e.g., **config.yaml**) to load settings. This file specifies attributes necessary for generating the compile profile.


```
profile load [flags]
```

**Examples**

~~~
// Create a new profile using network configuration in pipeline
profile load /path/to/config.yaml --name my_profile --pipeline pipeline_name

// Create a profile with specific modules
profile load /path/to/config.yaml --name my_profile --modules base,sys_full --pipeline pipeline_name

// Create a profile with custom interval and jitter
profile load /path/to/config.yaml --name my_profile --interval 10 --jitter 0.3 --pipeline pipeline_name

// Create a profile for pulse
profile load /path/to/config.yaml --name my_profile --pipeline pipeline_name
~~~

**Options**

```
  -n, --name string       Overwrite profile name
  -p, --pipeline string   Overwrite profile basic pipeline_id
      --rem string        rem pipeline id
```

**SEE ALSO**

* [profile](#profile)	 - compile profile 

#### profile new
Create new compile profile with default profile

```
profile new [flags]
```

**Examples**


~~~
profile new --name my_profile --pipeline default_tcp
~~~


**Options**

```
  -n, --name string       Overwrite profile name
  -p, --pipeline string   Overwrite profile basic pipeline_id
      --rem string        rem pipeline id
```

**SEE ALSO**

* [profile](#profile)	 - compile profile 

### donut
donut cmd

**Description**

Generates x86, x64, or AMD64+x86 position-independent shellcode that loads .NET Assemblies, PE files, and other Windows payloads from memory 

```
donut [flags]
```

**Examples**


  gonut -i c2.dll
  gonut --arch x86 --class TestClass --method RunProcess --args notepad.exe --input loader.dll
  gonut -i loader.dll -c TestClass -m RunProcess -p "calc notepad" -s http://remote_server.com/modules/
  gonut -z2 -k2 -t -i loader.exe -o out.bin


**Options**

```
  -a, --arch int          Target architecture:
                          	1=x86
                          	2=amd64
                          	3=x86+amd64
                          	 (default 3)
  -p, --args string       Optional parameters/command line inside quotations for DLL method/function or EXE.
  -b, --bypass uint32     Bypass AMSI/WLDP/ETW:
                          	1=None
                          	2=Abort on fail
                          	3=Continue on fail
                          	 (default 3)
  -c, --class string      Optional class name. (required for .NET DLL, format: namespace.class)
  -z, --compress uint32   Pack/Compress file:
                          	1=None
                          	2=aPLib         [experimental]
                          	3=LZNT1  (RTL)  [experimental, Windows only]
                          	4=Xpress (RTL)  [experimental, Windows only]
                          	5=LZNT1         [experimental]
                          	6=Xpress        [experimental, recommended]
                          	 (default 1)
  -j, --decoy string      Optional path of decoy module for Module Overloading.
  -d, --domain string     AppDomain name to create for .NET assembly. If entropy is enabled, this is generated randomly.
  -e, --entropy uint32    Entropy:
                          	1=None
                          	2=Use random names
                          	3=Random names + symmetric encryption
                          	 (default 3)
  -x, --exit uint32       Exit behaviour:
                          	1=Exit thread
                          	2=Exit process
                          	3=Do not exit or cleanup and block indefinitely
                          	 (default 1)
  -f, --format int        Output format:
                          	1=Binary
                          	2=Base64
                          	3=C
                          	4=Ruby
                          	5=Python
                          	6=Powershell
                          	7=C#
                          	8=Hex
                          	9=UUID
                          	10=Golang
                          	11=Rust
                          	 (default 1)
  -k, --headers uint32    Preserve PE headers:
                          	1=Overwrite
                          	2=Keep all
                          	 (default 1)
  -i, --input string      Input file to execute in-memory.
  -m, --method string     Optional method or function for DLL. (a method is required for .NET DLL)
  -n, --modname string    Module name for HTTP staging. If entropy is enabled, this is generated randomly.
  -y, --oep uint32        Create thread for loader and continue execution at <addr> supplied. (eg. 0x1234)
  -o, --output string     Output file to save loader. (default "shellcode")
  -r, --runtime string    CLR runtime version. MetaHeader used by default or v4.0.30319 if none available.
  -s, --server string     Server that will host the Donut module. Credentials may be provided in the following format: https://username:password@192.168.0.1/
  -t, --thread            Execute the entrypoint of an unmanaged EXE as a thread.
  -w, --unicode           Command line is passed to unmanaged DLL function in UNICODE format. (default is ANSI)
  -v, --verbose           verbose output
```

