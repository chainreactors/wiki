### pwd
#### Command
pwd

**About:** Print working directory

---

### cat
#### Command
cat --name <file_name>

**About:** Print file content

#### Flags
- `--name`, `-n`: File name to be printed.

---

### cd
#### Command
cd --path <directory_path>

**About:** Change directory

#### Flags
- `--path`, `-p`: Directory path to change to.

---

### chmod
#### Command
chmod --path <file_path> --mode <file_mode>

**About:** Change file mode

#### Flags
- `--path`, `-p`: Path of the file whose mode is to be changed.
- `--mode`, `-m`: The new file mode.

---

### chown
#### Command
chown --path <file_path> --uid <user_id> --gid <group_id> --recursive

**About:** Change file owner

#### Flags
- `--path`, `-p`: Path of the file whose ownership is to be changed.
- `--uid`, `-u`: New user ID.
- `--gid`, `-g`: New group ID.
- `--recursive`, `-r`: Apply changes recursively.

---

### cp
#### Command
cp --source <source_file> --target <target_file>

**About:** Copy file

#### Flags
- `--source`, `-s`: Source file to be copied.
- `--target`, `-t`: Destination for the copied file.

---

### ls
#### Command
ls --path <directory_path>

**About:** List directory contents

#### Flags
- `--path`, `-p`: Directory path to list.

---

### mkdir
#### Command
mkdir --path <directory_path>

**About:** Make directory

#### Flags
- `--path`, `-p`: Path where the new directory will be created.

---

### mv
#### Command
mv --source <source_file> --target <target_file>

**About:** Move file

#### Flags
- `--source`, `-s`: Source file to be moved.
- `--target`, `-t`: Destination for the moved file.

---

### rm
#### Command
rm --name <file_name>

**About:** Remove file

#### Flags
- `--name`, `-n`: File name to be removed.

----

### whoami
#### Command
whoami

**About:** Print current user

---

### kill
#### Command
kill --pid <process_id>

**About:** Kill the process

#### Flags
- `--pid`, `-p`: Process ID to be killed.

---

### ps
#### Command
ps

**About:** List processes

---

### env
#### Command
env

**About:** List environment variables

---

### setenv
#### Command
setenv --env <environment_variable> --value <value>

**About:** Set environment variable

#### Flags
- `--env`, `-e`: Environment variable to set.
- `--value`, `-v`: Value to assign to the environment variable.

---

### unsetenv
#### Command
unsetenv --env <environment_variable>

**About:** Unset environment variable

#### Flags
- `--env`, `-e`: Environment variable to unset.

---

### netstat
#### Command
netstat

**About:** List network connections

---

### info
#### Command
info

**About:** Get basic system information

-----

### download
#### Command
download --name <filename> --path <filepath>

**About:** Download file

#### Flags
- `--name`, `-n`: Name of the file to be downloaded.
- `--path`, `-p`: Path where the file will be downloaded.

---

### sync
#### Command
sync --taskID <task_id>

**About:** Sync file

#### Flags
- `--taskID`, `-i`: Task ID for the sync operation.

---

### upload
#### Command
upload <source> <destination>

**About:** Upload file

#### Arguments
- `source`: File source path.
- `destination`: Target path for the uploaded file.

#### Flags
- `--priv`: File privilege, default is `0o644`.
- `--hidden`: Mark the filename as hidden.

-----

### login
#### Command
login --config <server_config>

**About:** Login to server

#### Flags
- `--config`, `-c`: Server configuration file to be used for login.

----

### list_module
#### Command
list_module

**About:** List modules

---

### load_module
#### Command
load_module <path>

**About:** Load module

#### Arguments
- `path`: Path to the module file.

#### Flags
- `--name`, `-n`: Name of the module to be loaded.

-----

### sessions
#### Command
sessions --timeout <timeout>

**About:** List sessions

-----

### tasks
#### Command
tasks

**About:** List tasks

-----

### use
#### Command
use <sid>

**About:** Use session

#### Arguments
- `sid`: Session ID to use.

---

### background
#### Command
background

**About:** Back to root context

----

### version
#### Command
version

**About:** Show server version

-----

### note
#### Command
note <session name>

**About:** Add note to session

**Flags:**
- `--id`: Session ID

---

### group
#### Command
group <group name>

**About:** Group session

**Flags:**
- `--id`: Session ID

---

### remove
#### Command
remove

**About:** Remove session

**Flags:**
- `--id`: Session ID

----

### observe
#### Command
observe <session id>...

**About:** Observe session

**Flags:**
- `-r`, `--remove`: Remove observe
- `-l`, `--list`: List all observers

----

### website
#### Command
website

**About:** Website manager

---

### website add-content
#### Command
website add-content <content-path>

**About:** Add content to a website

**Flags:**
- `--web-path`: Path to the website
- `-n`, `--name`: Name of the website
- `--content-type`: Content type
- `--recursive`: Add content recursively

---

### website rm-content
#### Command
website rm-content

**About:** Remove specific content from a website

**Flags:**
- `-n`, `--name`: Name of the website
- `--web-path`: Path to the website
- `-r`, `--recursive`: Remove content recursively

---

### website rm
#### Command
website rm

**About:** Remove a website

**Flags:**
- `-n`, `--name`: Name of the website

---

### website update-content
#### Command
website update-content

**About:** Update content of a website

**Flags:**
- `-n`, `--name`: Name of the website
- `--web-path`: Path to the website
- `--content-type`: Content type

---

### website list-contents
#### Command
website list-contents

**About:** List the contents of a website

**Flags:**
- `-n`, `--name`: Name of the website

-----

### alias
#### Command
alias

**About:** List current aliases

---

### alias load
#### Command
alias load <dir-path>

**About:** Load a command alias

**Flags:** None

**Arguments:**

- `<dir-path>`: Path to the alias directory

---

### alias install
#### Command
alias install <path>

**About:** Install a command alias

**Flags:** None

**Arguments:**
- `<path>`: Path to the alias directory or tar.gz file

---

### alias remove
#### Command
alias remove <name>

**About:** Remove an alias

**Flags:** None

**Arguments:**
- `<name>`: Name of the alias to remove

----

### armory
#### Command
armory

**About:** List available armory packages

**Flags:**
- `-p, --proxy <proxy>`: Proxy URL
- `-t, --timeout <timeout>`: Timeout
- `-i, --insecure`: Disable TLS validation
- `--ignore-cache`: Ignore cache

---

### armory install
#### Command
armory install <name>

**About:** Install a command armory

**Flags:**
- `-a, --armory <armory>`: Name of the armory to install from (default: "Default")
- `-f, --force`: Force installation of package, overwriting the package if it exists
- `-p, --proxy <proxy>`: Proxy URL

**Arguments:**
- `<name>`: Package or bundle name to install

---

### armory update
#### Command
armory update

**About:** Update installed armory packages

**Flags:**
- `-a, --armory <armory>`: Name of the armory to update

---

### armory search
#### Command
armory search <name>

**About:** Search for armory packages

**Flags:** None

**Arguments:**
- `<name>`: Name of the package to search for

-----

### extension
#### Command
extension

**About:** Extension commands

---

### extension list
#### Command
extension list

**About:** List all extensions

---

### extension load
#### Command
extension load

**About:** Load an extension

**Arguments:**

- `<dir-path>`: Path to the extension directory

---

### extension install
#### Command
extension install <path>

**About:** Install an extension

**Arguments:**
- `<path>`: Path to the extension directory or tar.gz file

---

### extension remove
#### Command
extension remove <name>

**About:** Remove an extension

**Arguments:**
- `<name>`: Name of the extension to remove

----

### execute
#### Command
execute

**About:** Execute command

**Flags:**
- `-T`, `--token`: Execute command with current token (Windows only)
- `-o`, `--output`: Capture command output (default: true)
- `-s`, `--save`: Save output to a file
- `-X`, `--loot`: Save output as loot
- `-S`, `--ignore-stderr`: Don't print STDERR output
- `-O`, `--stdout`: Remote path to redirect STDOUT to
- `-E`, `--stderr`: Remote path to redirect STDERR to
- `-n`, `--name`: Name to assign loot (optional)
- `-P`, `--ppid`: Parent process id (optional, Windows only)
- `-t`, `--timeout`: Command timeout in seconds (default: `assets.DefaultSettings.DefaultTimeout`)

**Arguments:**
- `command`: Command to execute
- `arguments`: Arguments to the command

---

### execute_assembly
#### Command
execute_assembly <path>

**About:** Loads and executes a .NET assembly in a child process (Windows Only)

**Arguments:**
- `path`: Path to the assembly file
- `args`: Arguments to pass to the assembly entrypoint (default: empty list)

**Flags:**
- `--output`: Need output
- `-n`, `--name`: Name to assign loot (optional)
- `-p`, `--ppid`: Parent process id (optional)

**Completer:** LocalPathCompleter for the `path` argument.

---

### execute_shellcode
#### Command
execute_shellcode <path>

**About:** Executes the given shellcode in the sliver process

**Arguments:**
- `path`: Path to the shellcode file
- `args`: Arguments to pass to the assembly entrypoint (default: `notepad.exe`)

**Flags:**
- `-p`, `--ppid`: PID of the process to inject into (0 means injection into ourselves)
- `-b`, `--block_dll`: Block DLL injection
- `-s`, `--sacrifice`: Needs sacrifice process
- `-a`, `--argue`: Argument

**Completer:** LocalPathCompleter for the `path` argument.

---

### inline_shellcode
#### Command
inline_shellcode <path>

**About:** Executes the given inline shellcode in the IOM

**Arguments:**
- `path`: Path to the shellcode file
- `args`: Arguments to pass to the assembly entrypoint

**Flags:** None

**Completer:** LocalPathCompleter for the `path` argument.

---

### execute_dll
#### Command
execute_dll <path>

**About:** Executes the given DLL in the sacrifice process

**Arguments:**
- `path`: Path to the DLL file
- `args`: Arguments to pass to the assembly entrypoint (default: `C:\\Windows\\System32\\cmd.exe\x00`)

**Flags:**
- `-p`, `--ppid`: PID of the process to inject into (0 means injection into ourselves)
- `-b`, `--block_dll`: Block DLL injection
- `-s`, `--sacrifice`: Needs sacrifice process
- `-e`, `--entrypoint`: Entrypoint
- `-a`, `--argue`: Argument

**Completer:** LocalPathCompleter for the `path` argument.

---

### inline_dll
#### Command
inline_dll <path>

**About:** Executes the given inline DLL in current process

**Arguments:**
- `path`: Path to the DLL file
- `args`: Arguments to pass to the assembly entrypoint

**Flags:**
- `-p`, `--ppid`: PID of the process to inject into (0 means injection into ourselves)
- `-b`, `--block_dll`: Block DLL injection
- `-s`, `--sacrifice`: Needs sacrifice process
- `-a`, `--argue`: Argument

**Completer:** LocalPathCompleter for the `path` argument.

---

### execute_pe
#### Command
execute_pe <path>

**About:** Executes the given PE in the sacrifice process

**Arguments:**
- `path`: Path to the PE file
- `args`: Arguments to pass to the assembly entrypoint (default: `notepad.exe`)

**Flags:**
- `-p`, `--ppid`: PID of the process to inject into (0 means injection into ourselves)
- `-b`, `--block_dll`: Block DLL injection
- `-s`, `--sacrifice`: Needs sacrifice process
- `-a`, `--argue`: Argument

**Completer:** LocalPathCompleter for the `path` argument.

---

### inline_pe
#### Command
inline_pe <path>

**About:** Executes the given inline PE in current process

**Arguments:**
- `path`: Path to the PE file
- `args`: Arguments to pass to the assembly entrypoint

**Flags:** None

**Completer:** LocalPathCompleter for the `path` argument.

---

### execute_bof
#### Command
execute_ bof <path>

**About:** Loads and executes Bof (Windows Only)

**Arguments:**
- `path`: Path to the Bof file
- `args`: Arguments to pass to the assembly entrypoint

**Flags:**
- `-A`, `--process-arguments`: Arguments to pass to the hosting process
- `-t`, `--timeout`: Command timeout in seconds

**Completer:** LocalPathCompleter for the `path` argument.

---

### powershell
#### Command
powershell

**About:** Loads and executes powershell (Windows Only)

**Arguments:**
- `args`: Arguments to pass to the assembly entrypoint

**Flags:**
- `-p`, `--path`: Path to the powershell script
- `-t`, `--timeout`: Command timeout in seconds

---

### listener
#### Command
listener

**About:** Listener manager

**Subcommands:**
- [tcp](#tcp)
- [website](#website)

---

### listener tcp
#### Command
listener tcp <listener_id>

**About:** List TCP pipeline in listener

**Arguments:**
- `listener_id`: Listener ID

**Subcommands:**

- [start](#tcp-start)
- [stop](#tcp-stop)

---

### listener tcp start

#### Command

listener tcp start <listener_id>

**About:** Start a TCP pipeline

**Flags:**

- `--host`: TCP pipeline host
- `--port`: TCP pipeline port
- `--name`: TCP pipeline name
- `--listener_id`: Listener ID
- `--cert_path`: TCP pipeline cert path
- `--key_path`: TCP pipeline key path

**Arguments:** None

---

### listener tcp stop

#### Command

listener tcp stop <name> <listener_id>

**About:** Stop a TCP pipeline

**Arguments:**
- `name`: TCP pipeline name
- `listener_id`: Listener ID

**Flags:** None

---

### listener website
#### Command
listener website <listener_id>

**About:** List websites in listener

**Arguments:**
- `listener_id`: Listener ID

**Subcommands:**
- [start](#website-start)
- [stop](#website-stop)

---

### listener website start

#### Command

listener website start <listener_id>

**About:** Start a website pipeline

**Flags:**
- `--web-path`: Path to the website
- `--content-type`: Content type
- `--port`: Website pipeline port
- `--name`: Website name
- `--content-path`: Path to the content file
- `--listener_id`: Listener ID
- `--cert_path`: TCP pipeline cert path
- `--key_path`: TCP pipeline key path
- `--recursive`: Add content recursively

**Arguments:** None

---

### listener website stop

#### Command

listener website stop<listener_id>

**About:** Stop a website pipeline

**Arguments:**
- `name`: Website pipeline name
- `listener_id`: Listener ID

**Flags:** None