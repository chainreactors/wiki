## implant
### tasks
List tasks

```
tasks
```

### files
List all downloaded files.

```
files
```

### cancel_task
Cancel a task by task_id

```
cancel_task [task_id]
```

**Examples**

~~~
cancel_task <task_id>
~~~


### list_module
List modules

```
list_module
```

### load_module
Load module

```
load_module [module_file] [flags]
```

**Examples**

load module from malefic-modules
before loading, you can list the current modules: 
~~~
execute_addon、clear ...
~~~
then you can load module
~~~
load_module <module_file.dll>
~~~
you can see more modules loaded by list_module
~~~
execute_addon、clear 、ps、powerpic...
~~~


**Options**

```
  -b, --bundle string   bundle name
```

### refresh_module
Refresh module

```
refresh_module
```

### clear
Clear modules

```
clear
```

### explorer
file explorer

```
explorer
```

### list_addon
List all addons

```
list_addon [addon]
```

### load_addon
Load an addon

**Description**

Load an executable into the implant's memory for reuse

```
load_addon [flags]
```

**Examples**

addon default name is filename, default module is selected based on the file extension
~~~	
load_addon gogo.exe
~~~
assigns an alias name gogo to the addon, and the specified module is execute_exe
~~~
load_addon gogo.exe -n gogo -m execute_exe
~~~


**Options**

```
  -m, --module string   module type
  -n, --name string     addon name
```

### execute_addon
Execute the loaded addon

```
execute_addon [flags]
```

**Examples**

Execute the addon without "-" arguments
~~~
execute_addon httpx 1.1.1.1
~~~
execute the addon file with "-" arguments, you need add "--" before the arguments
~~~
execute_addon gogo.exe -- -i 127.0.0.1 -p http
~~~
if you specify the addon name, you need to use the alias name
~~~
execute_addon gogo -- -i 127.0.0.1 -p http
~~~


**Options**

```
      --arch string      architecture amd64,x86
  -a, --argue string     spoofing process arguments, eg: notepad.exe 
  -b, --block_dll        block not microsoft dll injection
      --etw              disable ETW
  -p, --ppid uint        spoofing parent processes, (0 means injection into ourselves)
  -n, --process string   custom process path (default "C:\\\\Windows\\\\System32\\\\notepad.exe")
  -q, --quit             disable output
  -t, --timeout uint32   timeout, in seconds (default 60)
```

## execute
### exec
Execute commands

**Description**

Exec implant local executable file

```
exec [cmdline] [flags]
```

**Examples**

Execute the executable file without any '-' arguments.
~~~
exec whoami
~~~
Execute the executable file with '-' arguments, you need add "--" before the arguments
~~~
exec gogo.exe -- -i 127.0.0.1 -p http
~~~


**Options**

```
  -q, --quiet   disable output
```

### execute_local
Execute local PE on sacrifice process

**Description**


Execute local PE on sacrifice process, support spoofing process arguments, spoofing ppid, block-dll, disable etw
		

```
execute_local [local_exe] [flags]
```

**Examples**


~~~
execute_local local_exe --ppid 1234 --block_dll --etw --argue "argue"
~~~


**Options**

```
  -a, --argue string     spoofing process arguments, eg: notepad.exe 
  -b, --block_dll        block not microsoft dll injection
      --etw              disable ETW
  -p, --ppid uint        spoofing parent processes, (0 means injection into ourselves)
  -n, --process string   custom process path
  -q, --quit             disable output
```

### shell
Execute cmd

**Description**

equal: exec cmd /c "[cmdline]"

```
shell [cmdline] [flags]
```

**Options**

```
  -q, --quiet   disable output
```

### powershell
Execute cmd with powershell

**Description**

equal: powershell.exe -ExecutionPolicy Bypass -w hidden -nop "[cmdline]"

```
powershell [cmdline] [flags]
```

**Options**

```
  -q, --quiet   disable output
```

### execute_assembly
Loads and executes a .NET assembly in a child process (Windows Only)

```
execute_assembly [file] [flags]
```

**Examples**

Execute a .NET assembly without "-" arguments
~~~
execute-assembly potato.exe "whoami"
~~~
Execute a .NET assembly with "-" arguments, you need add "--" before the arguments
~~~
execute-assembly potato.exe -- -cmd "cmd /c whoami"
~~~


**Options**

```
      --arch string      architecture amd64,x86
  -n, --process string   custom process path (default "C:\\\\Windows\\\\System32\\\\notepad.exe")
  -q, --quit             disable output
  -t, --timeout uint32   timeout, in seconds (default 60)
```

### execute_shellcode
Executes the given shellcode in the sacrifice process

**Description**

The current shellcode injection method uses APC.

In the future, configurable shellcode injection settings will be provided, along with Donut, SGN, SRDI, etc.

```
execute_shellcode [shellcode_file] [flags]
```

**Examples**


~~~
execute_shellcode example.bin
~~~


**Options**

```
      --arch string      architecture amd64,x86
  -a, --argue string     spoofing process arguments, eg: notepad.exe 
  -b, --block_dll        block not microsoft dll injection
      --etw              disable ETW
  -p, --ppid uint        spoofing parent processes, (0 means injection into ourselves)
  -n, --process string   custom process path (default "C:\\\\Windows\\\\System32\\\\notepad.exe")
  -q, --quit             disable output
  -t, --timeout uint32   timeout, in seconds (default 60)
```

### inline_shellcode
Executes the given inline shellcode in the implant process

**Description**


The current shellcode injection method uses APC.


```
inline_shellcode [shellcode_file] [flags]
```

**Examples**


~~~
inline_shellcode example.bin
~~~


**Options**

```
      --arch string      architecture amd64,x86
  -n, --process string   custom process path (default "C:\\\\Windows\\\\System32\\\\notepad.exe")
  -q, --quit             disable output
  -t, --timeout uint32   timeout, in seconds (default 60)
```

### execute_dll
Executes the given DLL in the sacrifice process

**Description**


use a custom Headless PE loader to load DLL in the sacrificed process.


```
execute_dll [dll] [flags]
```

**Examples**


~~~
execute_dll example.dll 
~~~

if entrypoint not default, you can specify the entrypoint

~~~
execute_dll example.dll -e entrypoint -- arg1 arg2
~~~


**Options**

```
      --arch string         architecture amd64,x86
  -a, --argue string        spoofing process arguments, eg: notepad.exe 
  -b, --block_dll           block not microsoft dll injection
  -e, --entrypoint string   custom entrypoint
      --etw                 disable ETW
  -p, --ppid uint           spoofing parent processes, (0 means injection into ourselves)
  -n, --process string      custom process path (default "C:\\\\Windows\\\\System32\\\\notepad.exe")
  -q, --quit                disable output
  -t, --timeout uint32      timeout, in seconds (default 60)
```

### inline_dll
Executes the given inline DLL in the current process

**Description**

use a custom Headless PE loader to load DLL in the current process.

```
inline_dll [dll] [flags]
```

**Examples**

execute an inline DLL with the default entry point
~~~
inline_dll example.dll
~~~
specify the entrypoint
~~~
inline_dll example.dll -e RunFunction -- arg1 arg2
~~~

**Options**

```
      --arch string         architecture amd64,x86
  -e, --entrypoint string   entrypoint
  -n, --process string      custom process path (default "C:\\\\Windows\\\\System32\\\\notepad.exe")
  -q, --quit                disable output
  -t, --timeout uint32      timeout, in seconds (default 60)
```

### execute_exe
Executes the given PE in the sacrifice process

**Description**

use a custom Headless PE loader to load EXE in the sacrificed process.

```
execute_exe [exe] [flags]
```

**Examples**


~~~
execute_exe gogo.exe -- -i 123.123.123.123 -p top2
~~~


**Options**

```
      --arch string      architecture amd64,x86
  -a, --argue string     spoofing process arguments, eg: notepad.exe 
  -b, --block_dll        block not microsoft dll injection
      --etw              disable ETW
  -p, --ppid uint        spoofing parent processes, (0 means injection into ourselves)
  -n, --process string   custom process path (default "C:\\\\Windows\\\\System32\\\\notepad.exe")
  -q, --quit             disable output
  -t, --timeout uint32   timeout, in seconds (default 60)
```

### inline_exe
Executes the given inline EXE in current process

**Description**

use a custom Headless PE loader to load EXE in the current process.

```
inline_exe [exe] [flags]
```

**Examples**

execute the inline PE file
~~~
inline_exe hackbrowserdata.exe -- -h
~~~


**Options**

```
      --arch string      architecture amd64,x86
  -n, --process string   custom process path (default "C:\\\\Windows\\\\System32\\\\notepad.exe")
  -q, --quit             disable output
  -t, --timeout uint32   timeout, in seconds (default 60)
```

### bof
COFF Loader,  executes Bof (Windows Only)

**Description**


refactor from https://github.com/hakaioffsec/coffee ,fix a bundle bugs

Arguments for the BOF can be passed after the -- delimiter. Each argument must be prefixed with the type of the argument followed by a colon (:). The following types are supported:

* str - A null-terminated string
* wstr - A wide null-terminated string
* int - A signed 32-bit integer
* short - A signed 16-bit integer
* bin - A base64-encoded binary blob


```
bof [bof]
```

**Examples**


~~~
bof dir.x64.o -- wstr:"C:\\Windows\\System32"
~~~

### powerpick
unmanaged powershell on implant process (Windows Only)

```
powerpick [args] [flags]
```

**Examples**


~~~
powerpick -s powerview.ps1 -- Get-NetUser
~~~


**Options**

```
  -s, --script string   powershell script
```

## sys
### whoami
Print current user

```
whoami
```

### kill
Kill the process by pid

```
kill [pid]
```

**Examples**

kill the process which pid is 1234
~~~
kill 1234
~~~

### ps
List processes

```
ps
```

### env
List environment variables

```
env
```

### setenv
Set environment variable

```
setenv [env-key] [env-value]
```

**Examples**

~~~
setenv key1 value1
~~~

### unsetenv
Unset environment variable

```
unsetenv [env-key]
```

**Examples**

~~~
unsetenv key1
~~~


### netstat
List network connections

```
netstat
```

### info
Get basic sys info

```
info
```

### bypass
Bypass AMSI and ETW

```
bypass [flags]
```

**Examples**


~~~
bypass --amsi --etw
~~~

**Options**

```
      --amsi   Bypass AMSI
      --etw    Bypass ETW
```

## file
### download
Download file

**Description**

download file in implant

```
download [implant_file]
```

**Examples**

~~~
download ./file.txt
~~~

### upload
Upload file

**Description**

upload local file to remote implant

```
upload [local] [remote] [flags]
```

**Examples**

~~~
upload ./file.txt /tmp/file.txt
~~~

**Options**

```
      --hidden     hidden file
      --priv int   file privilege (default 420)
```

### sync
Sync file

**Description**

sync download file in server

```
sync [file_id]
```

**Examples**

~~~
sync 1
~~~

### pwd
Print working directory

**Description**

print working directory in implant

```
pwd
```

### cat
Print file content

**Description**

concatenate and display the contents of file in implant

```
cat [implant_file]
```

**Examples**

~~~
cat file.txt			
~~~

### cd
Change directory

**Description**

change the shell's current working directory in implant

```
cd
```

### chmod
Change file mode

**Description**

change the permissions of files and directories in implant

```
chmod [file] [mode]
```

**Examples**

~~~
chmod ./file.txt 644
~~~

### chown
Change file owner

**Description**

change the ownership of a file or directory in implant

```
chown [file] [user] [flags]
```

**Examples**

~~~
chown user ./file.txt 
~~~

**Options**

```
  -g, --gid string   Group id
  -r, --recursive    recursive
```

### cp
Copy file

**Description**

copy files and directories in implant

```
cp [source] [target]
```

**Examples**

~~~
cp /tmp/file.txt /tmp/file2.txt 
~~~

### ls
List directory

**Description**

list directory contents in implant

```
ls [path]
```

**Examples**

~~~
ls /tmp	
~~~

### mkdir
Make directory

**Description**

make directories in implant

```
mkdir [path]
```

**Examples**

~~~
mkdir /tmp
~~~

### mv
Move file

**Description**

move files and directories in implant

```
mv [source] [target]
```

**Examples**

~~~
mv /tmp/file.txt /tmp/file2.txt
~~~

### rm
Remove file

**Description**

remove files and directories in implant

```
rm [file]
```

**Examples**

~~~
rm /tmp/file.txt
~~~

