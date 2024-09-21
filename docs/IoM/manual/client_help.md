## generic
### login
Login to server

![login](../assets\login.gif)

```
login
```

### version
show server version

```
version
```

### exit
exit client

```
exit
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

### !
Run a command

```
! [command]
```

## manage
### sessions
List sessions

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

### note
add note to session

**Description**

Add a note to a session. If a note already exists, it will be updated. 
When using an active session, only provide the new note.

```
note [note] [session]
```

**Examples**

~~~
// Add a note to specified session
note newNote 08d6c05a21512a79a1dfeb9d2a8f262f

// Add a note when using an active session
note newNote
			~~~

### group
group session

**Description**

Add a session to a group. If the group does not exist, it will be created.
When using an active session, only provide the group name.

```
group [group] [session]
```

**Examples**

~~~
// Add a session to a group
group newGroup 08d6c05a21512a79a1dfeb9d2a8f262f

// Add a session to a group when using an active session
group newGroup
			~~~

### del
del session

**Description**

Del a specified session.

```
del [session]
```

**Examples**

~~~
// Delete a specified session
del 08d6c05a21512a79a1dfeb9d2a8f262f
			~~~

### background
back to root context

**Description**

Exit the current session and return to the root context.

```
background
```

### use
Use session

**Description**

use

```
use [session]
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

### alias
manage aliases

```
alias
```

**SEE ALSO**

* [alias install](#alias_install.md)	 - Install a command alias
* [alias list](#alias_list.md)	 - List all aliases
* [alias load](#alias_load.md)	 - Load a command alias
* [alias remove](#alias_remove.md)	 - Remove an alias

#### alias install
Install a command alias

```
alias install [alias_file]
```

**SEE ALSO**

* [alias](#alias)	 - manage aliases

#### alias list
List all aliases

```
alias list
```

**SEE ALSO**

* [alias](#alias)	 - manage aliases

#### alias load
Load a command alias

```
alias load [alias]
```

**SEE ALSO**

* [alias](#alias)	 - manage aliases

#### alias remove
Remove an alias

```
alias remove [alias]
```

**SEE ALSO**

* [alias](#alias)	 - manage aliases

### extension
Extension commands

```
extension
```

**SEE ALSO**

* [extension install](#extension_install.md)	 - Install an extension
* [extension list](#extension_list.md)	 - List all extensions
* [extension load](#extension_load.md)	 - Load an extension
* [extension remove](#extension_remove.md)	 - Remove an extension

#### extension install
Install an extension

```
extension install [extension_file]
```

**SEE ALSO**

* [extension](#extension)	 - Extension commands

#### extension list
List all extensions

```
extension list
```

**SEE ALSO**

* [extension](#extension)	 - Extension commands

#### extension load
Load an extension

```
extension load [extension]
```

**SEE ALSO**

* [extension](#extension)	 - Extension commands

#### extension remove
Remove an extension

```
extension remove [extension]
```

**SEE ALSO**

* [extension](#extension)	 - Extension commands

### armory
List available armory packages

![armory](../assets\armory.gif)

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

* [armory install](#armory_install.md)	 - Install a command armory
* [armory search](#armory_search.md)	 - Search for armory packages
* [armory update](#armory_update.md)	 - Update installed armory packages

#### armory install
Install a command armory

```
armory install [armory] [flags]
```

**Options**

```
  -a, --armory string   name of armory to install package from
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

* [armory](#armory)	 - List available armory packages

#### armory search
Search for armory packages

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

* [armory](#armory)	 - List available armory packages

#### armory update
Update installed armory packages

```
armory update [flags]
```

**Options**

```
  -a, --armory string   name of armory to install package from
```

**Options inherited from parent commands**

```
  -c, --ignore-cache     ignore metadata cache, force refresh
  -I, --insecure         skip tls certificate validation
  -p, --proxy string     specify a proxy url (e.g. http://localhost:8080)
  -t, --timeout string   download timeout
```

**SEE ALSO**

* [armory](#armory)	 - List available armory packages

### mal
mal commands

```
mal
```

**SEE ALSO**

* [mal install](#mal_install.md)	 - Install a mal manifest
* [mal list](#mal_list.md)	 - List mal manifests
* [mal load](#mal_load.md)	 - Load a mal manifest
* [mal remove](#mal_remove.md)	 - Remove a mal manifest

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

#### mal remove
Remove a mal manifest

```
mal remove [mal]
```

**SEE ALSO**

* [mal](#mal)	 - mal commands

## listener
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

### tcp
List tcp pipelines in listener

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

* [tcp register](#tcp_register.md)	 - Register a new TCP pipeline and start it
* [tcp start](#tcp_start.md)	 - Start a TCP pipeline
* [tcp stop](#tcp_stop.md)	 - Stop a TCP pipeline

#### tcp register
Register a new TCP pipeline and start it

**Description**

Register a new TCP pipeline with the specified listener.
- If **name** is not provided, it will be generated in the format **listenerID_tcp_port**.
- If **host** is not specified, the default value will be **0.0.0.0**.
- If **port** is not specified, a random port will be selected from the range **10000-15000**.
- If TLS is enabled, you can provide file paths for the certificate and key.
- If no certificate or key paths are provided, the server will automatically generate a TLS certificate and key.

```
tcp register [listener_id]  [flags]
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
      --cert_path string   tls cert path
      --host string        pipeline host
      --key_path string    tls key path
  -n, --name string        pipeline name
  -p, --port uint          pipeline port
  -t, --tls                enable tls
```

**SEE ALSO**

* [tcp](#tcp)	 - List tcp pipelines in listener

#### tcp start
Start a TCP pipeline

**Description**

Start a TCP pipeline with the specified name and listener ID

```
tcp start
```

**Examples**

~~~
tcp start tcp_test listener
			~~~

**SEE ALSO**

* [tcp](#tcp)	 - List tcp pipelines in listener

#### tcp stop
Stop a TCP pipeline

**Description**

Stop a TCP pipeline with the specified name and listener ID

```
tcp stop
```

**Examples**

~~~
tcp stop tcp_test listener
~~~

**SEE ALSO**

* [tcp](#tcp)	 - List tcp pipelines in listener

### website
List website in listener

**Description**

Use a table to list websites along with their corresponding listeners

```
website
```

**Examples**

~~~
website listener
~~~

**SEE ALSO**

* [website register](#website_register.md)	 - Register a new website and start it
* [website start](#website_start.md)	 - Start a website
* [website stop](#website_stop.md)	 - Stop a website

#### website register
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
website register [listener_id] [route_path] [content_path] [flags]
```

**Examples**

~~~
// Register a website with the default settings
website register listener /webtest /path/to/file

// Register a website with a custom name, port, and content type
website register listener /webtest /path/to/file --name web_test --port 5003 --content_type text/html
			
// Register a website with TLS enabled and specify certificate and key paths
website register listener /webtest /path/to/file --tls --cert_path /path/to/cert --key_path /path/to/key
~~~

**Options**

```
      --cert_path string      tls cert path
      --content_type string   website content type
      --host string           pipeline host
      --key_path string       tls key path
  -n, --name string           pipeline name
  -p, --port uint             pipeline port
  -t, --tls                   enable tls
```

**SEE ALSO**

* [website](#website)	 - List website in listener

#### website start
Start a website

**Description**

Start a website with the specified name and listener ID

```
website start
```

**Examples**

~~~
website start web_test listener
			~~~

**SEE ALSO**

* [website](#website)	 - List website in listener

#### website stop
Stop a website

**Description**

Stop a website with the specified name and listener ID

```
website stop
```

**Examples**

~~~
website stop web_test listener
~~~

**SEE ALSO**

* [website](#website)	 - List website in listener

