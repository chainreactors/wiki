## base

### bcat

**Arguments**

- `$1` [Session] 
- `$2` [string] 

### bcd

**Arguments**

- `$1` [Session] 
- `$2` [string] 

### bcp

**Arguments**

- `$1` [Session] 
- `$2` [string] 
- `$3` [string] 

### bdllinject

**Arguments**

- `$1` [Session] 
- `$2` [number] 
- `$3` [string] 

### bdownload

**Arguments**

- `$1` [Session] 
- `$2` [string] 

### benv

**Arguments**

- `$1` [Session] 

### bexecute_exe

**Arguments**

- `$1` [Session] 
- `$2` [string] 
- `$3` [string] 
- `$4` [SacrificeProcess] 

### binline_dll

**Arguments**

- `$1` [Session] 
- `$2` [string] 
- `$3` [string] 
- `$4` [string] 

### binline_exe

**Arguments**

- `$1` [Session] 
- `$2` [string] 
- `$3` [string] 

### binline_shellcode

**Arguments**

- `$1` [Session] 
- `$2` [string] 

### bkill

**Arguments**

- `$1` [Session] 
- `$2` [string] 

### bmkdir

**Arguments**

- `$1` [Session] 
- `$2` [string] 

### bmv

**Arguments**

- `$1` [Session] 
- `$2` [string] 
- `$3` [string] 

### bnetstat

**Arguments**

- `$1` [Session] 

### bps

**Arguments**

- `$1` [Session] 

### bpwd

**Arguments**

- `$1` [Session] 

### breg_queryv

**Arguments**

- `$1` [Session] 
- `$2` [string] 
- `$3` [string] 
- `$4` [string] 

### breq_query

**Arguments**

- `$1` [Session] 
- `$2` [string] 
- `$3` [string] 

### brm

**Arguments**

- `$1` [Session] 
- `$2` [string] 

### bsetenv

**Arguments**

- `$1` [Session] 
- `$2` [string] 
- `$3` [string] 

### bshinject

**Arguments**

- `$1` [Session] 
- `$2` [number] 
- `$3` [string] 
- `$4` [string] 

### bunsetenv

**Arguments**

- `$1` [Session] 
- `$2` [string] 

### bwhoami

**Arguments**

- `$1` [Session] 

## 

### bexecute

**Arguments**

- `session` [Session] -  special session
- `cmd` [string] -  command to execute

**Example**

```
bexecute(active(),"whoami")
```

### bexecute_assembly

**Arguments**

- `sessions` [Session] - 
- `path` [string] - 
- `args` [string] - 

**Example**

```
bexecute_assembly(active(),"sharp.exe",{})
```

### binline_execute

**Arguments**

- `session` [Session] -  special session
- `bofPath` [string] -  path to BOF
- `args` [string] -  arguments

**Example**

```
binline_execute(active(),"/path/dir.x64.o","/path/to/list")
```

### bls

**Arguments**

- `session` [Session] -  special session
- `path` [string] -  path to list files

**Example**

```
bls(active(),"/tmp")
```

### bpowerpick

**Arguments**

- `session` [Session] -  special session
- `path` [string] -  powershell script
- `ps` [string] -  ps args

**Example**

```
bpowerpick(active(),"powerview.ps1",{""}))
```

### bpowershell

**Arguments**

- `session` [Session] - 
- `cmd` [string] - 

**Example**

```
bpowershell(active(),"dir")
```

### bshell

**Arguments**

- `sessions` [Session] - 
- `cmd` [string] - 

**Example**

```
bshell(active(),"whoami",true)
```

### bsleep

**Arguments**

- `sess` [Session] - special session
- `interval` [number] - time interval, in seconds

**Example**

```
sleep(active(), 10)
```

### bupload

**Arguments**

- `session` [Session] -  special session
- `path` [string] -  source path

**Example**

```
bupload(active(),"/source/path")
```
