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
Session manager

**SEE ALSO**

* [session del](#session-del)	 - del session
* [session group](#session-group)	 - group session
* [session newbind](#session-newbind)	 - new bind session
* [session note](#session-note)	 - add note to session

#### session del
del session

**Description**

Del a specified session.

```
session del [session]
```

**Examples**

~~~
// Delete a specified session
del 08d6c05a21512a79a1dfeb9d2a8f262f
~~~

**SEE ALSO**

* [session](#session)	 - Session manager

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

* [session](#session)	 - Session manager

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

* [session](#session)	 - Session manager

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

* [session](#session)	 - Session manager

### sessions
List and Choice sessions

**Description**

Display a table of active sessions on the server, 
allowing you to navigate up and down to select a desired session. 
Press the Enter key to use the selected session. 
Use the -a or --all option to display all sessions, including those that have been disconnected.
		

```
sessions
```

**Examples**

~~~
// List all active sessions
sessions

// List all sessions, including those that have been disconnected
sessions -a
~~~

**Options**

```
  -a, --all   show all sessions
```

**SEE ALSO**

* [sessions info](#sessions-info)	 - show session info

#### sessions info
show session info

**Description**

Displays the specified session info.

```
sessions info
```

**Options inherited from parent commands**

```
  -a, --all   show all sessions
```

**SEE ALSO**

* [sessions](#sessions)	 - List and Choice sessions

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

* [pipeline list](#pipeline-list)	 - List pipelines in listener
* [pipeline start](#pipeline-start)	 - Start a TCP pipeline
* [pipeline stop](#pipeline-stop)	 - Stop a TCP pipeline

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
- If **name** is not provided, it will be generated in the format **listenerID_tcp_port**.
- If **host** is not specified, the default value will be **0.0.0.0**.
- If **port** is not specified, a random port will be selected from the range **10000-15000**.
- If TLS is enabled, you can provide file paths for the certificate and key.
- If no certificate or key paths are provided, the server will automatically generate a TLS certificate and key.

```
tcp new [name]  [flags]
```

**Examples**

~~~
// Register a TCP pipeline with the default settings
tcp register listener

// Register a TCP pipeline with a custom name, host, and port
tcp register listener --name tcp_test --host 192.168.0.43 --port 5003

// Register a TCP pipeline with TLS enabled and specify certificate and key paths
tcp register listener --tls --cert_path /path/to/cert --key_path /path/to/key
~~~

**Options**

```
      --cert string              tls cert path
      --encryption-enable        whether to enable encryption 
      --encryption-key string    encryption key
      --encryption-type string   encryption type
      --host string              pipeline host (default "0.0.0.0")
      --key string               tls key path
  -l, --listener string          listener id
  -p, --port uint                pipeline port
  -t, --tls                      enable tls
```

**SEE ALSO**

* [tcp](#tcp)	 - List tcp pipelines in listener

### website
List website in listener

![website](/wiki/IoM/assets/website.gif)

**Description**

Use a table to list websites along with their corresponding listeners

```
website
```

**Examples**

~~~
website [listener]
~~~

**SEE ALSO**

* [website new](#website-new)	 - Register a new website and start it
* [website start](#website-start)	 - Start a website
* [website stop](#website-stop)	 - Stop a website

#### website new
Register a new website and start it

**Description**

Register a new website with the specified listener.
- You must provide a web route path and the static file path. Currently, only one file can be registered.
- If **name** is not provided, it will be generated in the format **listenerID_web_port**.
- If **port** is not specified, a random port will be selected from the range **15001-20000**.
- If **content_type** is not specified, the default value will be **text/html**.
- If TLS is enabled, you can provide file paths for the certificate and key.
- If no certificate or key paths are provided, the server will automatically generate a TLS certificate and key.

```
website new [listener_id] [route_path] [content_path] [flags]
```

**Examples**

~~~
// Register a website with the default settings
website register name /webtest /path/to/file

// Register a website with a custom name, port, and content type
website register name /webtest /path/to/file --name web_test --port 5003 --content_type text/html
			
// Register a website with TLS enabled and specify certificate and key paths
website register name /webtest /path/to/file --tls --cert /path/to/cert --key /path/to/key
~~~

**Options**

```
      --cert string              tls cert path
      --content_type string      website content type
      --encryption-enable        whether to enable encryption 
      --encryption-key string    encryption key
      --encryption-type string   encryption type
      --host string              pipeline host (default "0.0.0.0")
      --key string               tls key path
  -l, --listener string          listener id
  -p, --port uint                pipeline port
  -t, --tls                      enable tls
```

**SEE ALSO**

* [website](#website)	 - List website in listener

#### website start
Start a website

**Description**

Start a website with the specified name and listener ID

```
website start [flags]
```

**Examples**

~~~
website start web_test 
~~~

**Options**

```
      --listener string   listener ID
```

**SEE ALSO**

* [website](#website)	 - List website in listener

#### website stop
Stop a website

**Description**

Stop a website with the specified name and listener ID

```
website stop [flags]
```

**Examples**

~~~
website stop web_test listener
~~~

**Options**

```
      --listener string   listener ID
```

**SEE ALSO**

* [website](#website)	 - List website in listener

## generator
### artifact
artifact manage

**Description**

Manage build output files on the server. Use the **list** command to view all available artifacts, **download** to retrieve a specific artifact, and **upload** to add a new artifact to the server.

**SEE ALSO**

* [artifact download](#artifact-download)	 - Download a build output file from the server
* [artifact list](#artifact-list)	 - list build output file in server
* [artifact upload](#artifact-upload)	 - Upload a build output file to the server

#### artifact download
Download a build output file from the server

**Description**

Download a specific build output file from the server by specifying its unique artifact name.

The following flag is supported:
- **--output**, **-o**: Specify the output path where the downloaded file will be saved. If not provided, the file will be saved in the current directory.

```
artifact download [flags]
```

**Options**

```
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

#### artifact upload
Upload a build output file to the server

**Description**

Upload a custom artifact to the server for storage or further use.

The following flags are supported:
- **--stage**, **-s**: Specify the stage for the artifact (eg.,: **loader**, **prelude**, **beacon**, **bind**, **modules**)
- **--type**, **-t**: Define the type of the artifact
- **--name**, **-n**: Provide an alias name for the uploaded artifact. If not provided, the server will use the original file name.

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
* [build modules](#build-modules)	 - Compile specified modules into DLLs
* [build pulse](#build-pulse)	 - stage 0 shellcode generate

#### build beacon
Build a beacon

**Description**

Generate a beacon artifact based on the specified profile.

The **target** flag is required to specify the arch and platform for the beacon, such as **x86_64-unknown-linux-musl** or **x86_64-pc-windows-msvc**.
- If **profile_name** is provided, it must match an existing compile profile. Otherwise, the command will use default settings for the beacon generation.
- Additional modules can be added to the beacon using the **modules** flag, separated by commas.

```
build beacon [flags]
```

**Examples**

~~~
// Build a beacon with specified settings
build beacon --target x86_64-unknown-linux-musl --profile_name beacon_profile

// Build a beacon for the Windows platform
build beacon --target x86_64-unknown-linux-musl

// Build a beacon using a specific profile and additional modules
build beacon --target x86_64-pc-windows-msvc --profile_name beacon_profile --modules full
~~~

**Options**

```
  -a, --address string    implant address
      --ca string         custom ca file
      --interval int      interval /second (default -1)
      --jitter float      jitter (default -1)
  -m, --modules strings   Set modules e.g.: execute_exe,execute_dll
      --profile string    profile name
      --srdi string       enable srdi
      --target string     build target
```

**SEE ALSO**

* [build](#build)	 - build

#### build bind
Build a bind payload

**Description**

Generate a bind payload that connects a client to the server.

The **target** flag is required to specify the target arch and platform, such as **x86_64-unknown-linux-musl** or **x86_64-pc-windows-msvc**.
- If **profile_name** is provided, it must match an existing compile profile.
- Use additional flags to include functionality such as modules or custom configurations.

```
build bind [flags]
```

**Examples**

~~~
// Build a bind payload for the Windows platform
build bind --target x86_64-unknown-linux-musl

// Build a bind payload with a specific profile
build bind --target x86_64-pc-windows-msvc --profile_name bind_profile

// Build a bind payload with additional modules
build bind --target x86_64-pc-windows-msvc --modules base,sys_full
~~~

**Options**

```
  -a, --address string    implant address
      --ca string         custom ca file
      --interval int      interval /second (default -1)
      --jitter float      jitter (default -1)
  -m, --modules strings   Set modules e.g.: execute_exe,execute_dll
      --profile string    profile name
      --srdi string       enable srdi
      --target string     build target
```

**SEE ALSO**

* [build](#build)	 - build

#### build modules
Compile specified modules into DLLs

**Description**

Compile the specified modules into DLL files for deployment or integration.

The **target** flag is required to specify the platform for the modules, such as **x86_64-unknown-linux-musl** or **x86_64-pc-windows-msvc**,
- The **profile_name** flag is optional; if provided, it must match an existing compile profile, allowing the modules to inherit relevant configurations such as interval, jitter, or proxy settings.
- Additional modules can be explicitly defined using the **modules** flag as a comma-separated list (e.g., base,execute_dll). This allows fine-grained control over which modules are compiled. If **modules** is not specified, the default value will be **full**, which includes all available modules.

```
build modules
```

**Examples**

~~~
// Compile all modules for the Windows platform
build modules --target x86_64-unknown-linux-musl

// Compile a predefined feature set of modules (nano)
build modules --target x86_64-unknown-linux-musl --modules nano

// Compile specific modules into DLLs
build modules --target x86_64-pc-windows-msvc --modules base,execute_dll

// Compile modules using a specific profile
build modules --target x86_64-pc-windows-msvc --profile_name my_profile --modules full
~~~

**SEE ALSO**

* [build](#build)	 - build

#### build pulse
stage 0 shellcode generate

**Description**

Generate 'pulse' payload

```
build pulse [flags]
```

**Examples**


~~~
build pulse --target x86_64-pc-windows-msvc --srdi --address 127.0.0.1:5002
~~~


**Options**

```
  -a, --address string    implant address
      --ca string         custom ca file
      --interval int      interval /second (default -1)
      --jitter float      jitter (default -1)
  -m, --modules strings   Set modules e.g.: execute_exe,execute_dll
      --profile string    profile name
      --srdi string       enable srdi
      --target string     build target
```

**SEE ALSO**

* [build](#build)	 - build

### profile
compile profile 

```
profile
```

**SEE ALSO**

* [profile list](#profile-list)	 - List all compile profile
* [profile load](#profile-load)	 - Create a new compile profile

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
Create a new compile profile

**Description**

Create a new compile profile with customizable attributes.

If no **name** is provided, the command concatenates the target with a random name.
- Specify the **pipeline_id** to associate the listener and pipeline.
- Specify the **target** to set the build target arch and platform.
- Use the **modules** flag to define a comma-separated list of modules, such as execute_exe or execute_dll.
- **interval** defaults to 5 seconds, controlling the execution interval of the profile.
- **jitter** adds randomness to the interval (default value is 0.2).
- The **proxy** flag allows setting up proxy configurations (e.g., http or socks5).
- **ca** enables or disables CA validation (default: disabled).

```
profile load [flags]
```

**Examples**

~~~
// Create a new profile with default settings
profile new --name my_profile --target x86_64-unknown-linux-musl

// Create a profile with specific modules
profile new --name my_profile --target x86_64-unknown-linux-musl --modules base,sys_full

// Create a profile with custom interval and jitter
profile new --name my_profile --target x86_64-unknown-linux-musl --interval 10 --jitter 0.5
~~~

**Options**

```
      --ca string         Set ca
      --interval int      Set interval (default 5)
      --jitter float32    Set jitter (default 0.2)
      --modules strings   Set modules e.g.: execute_exe,execute_dll
      --name string       Set profile name
      --pipeline string   Set profile pipeline_id
      --proxy string      Set proxy
      --target string     Set build target
```

**SEE ALSO**

* [profile](#profile)	 - compile profile 

### srdi
Build SRDI artifact

**Description**

Generate an SRDI (Shellcode Reflective DLL Injection) artifact to minimize PE (Portable Executable) signatures.

SRDI technology reduces the PE characteristics of a DLL, enabling more effective injection and evasion during execution. The following options are supported:

- The **path** flag specifies the file path to the target DLL that will be processed. This is required if **id** is not provided.
- The **id** flag identifies a specific artifact or build file in the system for conversion to SRDI format. This is required if **path** is not provided.
- The **arch** flag defines the architecture of the generated shellcode, such as **x86** or **x64**. This flag is required to ensure compatibility with the target environment.
- The **platform** flag specifies the platform of the shellcode. Defaults to **win**, but can also be set to **linux**. This flag is required to tailor the shellcode for the desired operating system.
- The **function_name** flag sets the entry function name within the DLL for execution. This is critical for specifying which function will be executed when the DLL is loaded.
- The **userdata_path** flag allows the inclusion of user-defined data to be embedded with the shellcode during generation. This can be used to pass additional information or configuration to the payload at runtime.

```
srdi [flags]
```

**Examples**

~~~
// Convert a DLL to SRDI format with architecture and platform
srdi --path /path/to/target --arch x64 --platform win

// Specify an entry function for the DLL during SRDI conversion
srdi --path /path/to/target --arch x86 --platform linux 

// Include user-defined data with the generated shellcode
srdi --path /path/to/target.dll --arch x64 --platform win --user_data_path /path/to/user_data --function_name DllMain

// Convert a specific artifact to SRDI format using its ID
srdi --id artifact_id --arch x64 --platform linux
~~~

**Options**

```
      --arch string             shellcode architecture, eg: x86,x64
      --function_name string    shellcode function name
      --id uint32               build file id
      --path string             file path
      --platform string         shellcode platform, eg: windows,linux (default "win")
      --user_data_path string   user data path
```

