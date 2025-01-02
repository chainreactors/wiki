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

### login
Login to server

![login](/wiki/IoM/assets/login.gif)

```
login
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
mal install [mal_file]
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

## listener
### bind
manage bind pipeline to a listener

```
bind
```

**SEE ALSO**

* [bind new](#bind-new)	 - Register a new bind pipeline and start it

#### bind new
Register a new bind pipeline and start it

```
bind new [name] [flags]
```

**Examples**


new bind pipeline
~~~
bind new listener
~~~


**Options**

```
      --listener string   listener id
```

**SEE ALSO**

* [bind](#bind)	 - manage bind pipeline to a listener

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
* [pipeline stop](#pipeline-stop)	 - Stop a TCP pipeline

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
pipeline start
```

**Examples**

~~~
tcp start tcp_test
~~~

**SEE ALSO**

* [pipeline](#pipeline)	 - manage pipeline

#### pipeline stop
Stop a TCP pipeline

**Description**

Stop a TCP pipeline with the specified name and listener ID

```
pipeline stop
```

**Examples**

~~~
pipeline stop tcp_test
~~~

**SEE ALSO**

* [pipeline](#pipeline)	 - manage pipeline

### tcp
List tcp pipelines in listener

![tcp](/wiki/IoM/assets/tcp.gif)

**Description**

Use a table to list TCP pipelines along with their corresponding listeners

```
tcp
```

**Examples**

~~~
tcp listener
~~~

**SEE ALSO**

* [tcp new](#tcp-new)	 - Register a new TCP pipeline and start it

#### tcp new
Register a new TCP pipeline and start it

**Description**

Register a new TCP pipeline with the specified listener.
If **name** is not provided, it will be generated in the format **listenerID_tcp_port**.

```
tcp new [name]  [flags]
```

**Examples**

~~~
// Register a TCP pipeline with the default settings
tcp register --listener tcp_default

// Register a TCP pipeline with a custom name, host, and port
tcp register --name tcp_test --listener tcp_default --host 192.168.0.43 --port 5003

// Register a TCP pipeline with TLS enabled and specify certificate and key paths
tcp register --listener tcp_default --tls --cert_path /path/to/cert --key_path /path/to/key
~~~

**Options**

```
      --cert string              tls cert path
      --encryption-enable        whether to enable encryption
      --encryption-key string    encryption key
      --encryption-type string   encryption type
      --host string              pipeline host, the default value is **0.0.0.0** (default "0.0.0.0")
      --key string               tls key path
  -l, --listener string          listener id
  -p, --port uint                pipeline port, random port is selected from the range **10000-15000**
  -t, --tls                      enable tls
```

**SEE ALSO**

* [tcp](#tcp)	 - List tcp pipelines in listener

### website
website manager

![website](/wiki/IoM/assets/website.gif)

```
website
```

**SEE ALSO**

* [website add](#website-add)	 - Add content to a website
* [website list](#website-list)	 - List website in listener
* [website list-content](#website-list-content)	 - List content in a website
* [website new](#website-new)	 - Register a new website
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

* [website](#website)	 - website manager

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

* [website](#website)	 - website manager

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

* [website](#website)	 - website manager

#### website new
Register a new website

**Description**

Register a new website with the specified listener. If **name** is not provided, it will be generated in the format **listenerID_web_port**.

```
website new [name] [flags]
```

**Examples**

~~~
// Register a website with the default settings
website new --listener tcp_default --root /webtest

// Register a website with a custom name and port
website new web_test --listener tcp_default --port 5003 --root /webtest

// Register a website with TLS enabled
website new --listener tcp_default --root /webtest --tls --cert /path/to/cert --key /path/to/key
~~~

**Options**

```
      --cert string       tls cert path
      --host string       pipeline host, the default value is **0.0.0.0** (default "0.0.0.0")
      --key string        tls key path
  -l, --listener string   listener id
  -p, --port uint         pipeline port, random port is selected from the range **10000-15000**
      --root string       website root path (default "/")
  -t, --tls               enable tls
```

**SEE ALSO**

* [website](#website)	 - website manager

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

* [website](#website)	 - website manager

#### website start
Start a website

**Description**

Start a website with the specified name

```
website start [name] [flags]
```

**Examples**

~~~
// Start a website
website start web_test --listener tcp_default
~~~

**Options**

```
      --listener string   listener ID
```

**SEE ALSO**

* [website](#website)	 - website manager

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

* [website](#website)	 - website manager

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

* [website](#website)	 - website manager

## generator
### artifact
artifact manage

**Description**

Manage build output files on the server. Use the **list** command to view all available artifacts, **download** to retrieve a specific artifact, and **upload** to add a new artifact to the server.

**SEE ALSO**

* [artifact delete](#artifact-delete)	 - Delete a artifact file in the server
* [artifact download](#artifact-download)	 - Download a build output file from the server
* [artifact list](#artifact-list)	 - list build output file in server
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

// Download a artifact by srdi
	artifact download artifact_name -s


**Options**

```
  -o, --output string   output path
  -s, --srdi            download srdi
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
  -n, --name string    alias name
  -s, --stage string   Set stage
  -t, --type string    Set type
```

**SEE ALSO**

* [artifact](#artifact)	 - artifact manage

### build
build

**SEE ALSO**

* [build beacon](#build-beacon)	 - Build a beacon
* [build bind](#build-bind)	 - Build a bind payload
* [build log](#build-log)	 - Show build log
* [build modules](#build-modules)	 - Compile specified modules into DLLs
* [build prelude](#build-prelude)	 - Build a prelude payload
* [build pulse](#build-pulse)	 - stage 0 shellcode generate

#### build beacon
Build a beacon

**Description**

Generate a beacon artifact based on the specified profile.


```
build beacon [flags]
```

**Examples**

~~~
// Build a beacon
build beacon --target x86_64-unknown-linux-musl --profile beacon_profile

// Build a beacon using additional modules
build beacon --target x86_64-pc-windows-msvc --profile beacon_profile --modules full

// Build a beacon using SRDI technology
build beacon --target x86_64-pc-windows-msvc --profile beacon_profile --srdi

~~~

**Options**

```
  -a, --address string    implant address
      --ca string         custom ca file
      --interval int      interval /second (default -1)
      --jitter float      jitter (default -1)
  -m, --modules strings   Set modules e.g.: execute_exe,execute_dll
      --profile string    profile name
      --srdi              enable srdi (default true)
      --target string     build target, specify the target arch and platform, such as  **x86_64-pc-windows-msvc**.
```

**SEE ALSO**

* [build](#build)	 - build

#### build bind
Build a bind payload

**Description**

Generate a bind payload that connects a client to the server.

```
build bind [flags]
```

**Examples**

~~~
// Build a bind payload
build bind --target x86_64-pc-windows-msvc --profile bind_profile

// Build a bind payload with additional modules
build bind --target x86_64-unknown-linux-musl --profile bind_profile --modules base,sys_full

// Build a bind payload with SRDI technology
build bind --target x86_64-pc-windows-msvc --profile bind_profile --srdi

~~~

**Options**

```
  -a, --address string    implant address
      --ca string         custom ca file
      --interval int      interval /second (default -1)
      --jitter float      jitter (default -1)
  -m, --modules strings   Set modules e.g.: execute_exe,execute_dll
      --profile string    profile name
      --srdi              enable srdi (default true)
      --target string     build target, specify the target arch and platform, such as  **x86_64-pc-windows-msvc**.
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
build log builder_name --limit 70
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

// Compile modules with srdi
build modules --target x86_64-pc-windows-msvc --profile module_profile --srdi
~~~

**Options**

```
  -a, --address string    implant address
      --ca string         custom ca file
      --interval int      interval /second (default -1)
      --jitter float      jitter (default -1)
  -m, --modules strings   Set modules e.g.: execute_exe,execute_dll
      --profile string    profile name
      --srdi              enable srdi (default true)
      --target string     build target, specify the target arch and platform, such as  **x86_64-pc-windows-msvc**.
```

**SEE ALSO**

* [build](#build)	 - build

#### build prelude
Build a prelude payload

**Description**

Generate a prelude payload as part of a multi-stage deployment.
	

```
build prelude [flags]
```

**Examples**

~~~
	// Build a prelude payload
	build prelude --target x86_64-unknown-linux-musl --profile prelude_profile --autorun /path/to/autorun.yaml
	
	// Build a prelude payload with additional modules
	build prelude --target x86_64-pc-windows-msvc --profile prelude_profile --autorun /path/to/autorun.yaml --modules base,sys_full
	
	// Build a prelude payload with SRDI technology
	build prelude --target x86_64-pc-windows-msvc --profile prelude_profile --autorun /path/to/autorun.yaml --srdi
	~~~

**Options**

```
  -a, --address string    implant address
      --autorun string    set autorun.yaml
      --ca string         custom ca file
      --interval int      interval /second (default -1)
      --jitter float      jitter (default -1)
  -m, --modules strings   Set modules e.g.: execute_exe,execute_dll
      --profile string    profile name
      --srdi              enable srdi (default true)
      --target string     build target, specify the target arch and platform, such as  **x86_64-pc-windows-msvc**.
```

**SEE ALSO**

* [build](#build)	 - build

#### build pulse
stage 0 shellcode generate

**Description**

Generate 'pulse' payload,a minimized shellcode template, corresponding to CS artifact, very suitable for loading by various loaders


```
build pulse [flags]
```

**Examples**


~~~
// Build a pulse payload
build pulse --target x86_64-unknown-linux-musl --profile pulse_profile

// Build a pulse payload with additional modules
build pulse --target x86_64-pc-windows-msvc --profile pulse_profile --modules base,sys_full
	
// Build a pulse payload with SRDI technology
build pulse --target x86_64-pc-windows-msvc --profile pulse_profile --srdi

// Build a pulse payload by specifying artifact
build pulse --target x86_64-pc-windows-msvc --profile pulse_profile --artifact-id 1
~~~


**Options**

```
  -a, --address string       implant address
      --artifact-id uint32   load remote shellcode build-id
      --profile string       profile name
      --srdi string          enable srdi
      --target string        build target
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
profile delete --name profile_name
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
profile load /path/to/config.yaml --name my_profile --pipeline pipeline_name --pulse-pipeline pulse_pipeline_name
~~~

**Options**

```
  -n, --name string             Overwrite profile name
  -p, --pipeline string         Overwrite profile basic pipeline_id
      --pulse-pipeline string   Overwrite profile pulse pipeline_id
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
  -n, --name string             Overwrite profile name
  -p, --pipeline string         Overwrite profile basic pipeline_id
      --pulse-pipeline string   Overwrite profile pulse pipeline_id
```

**SEE ALSO**

* [profile](#profile)	 - compile profile 

