---
title: Internal of Malice · implant_win_kit
---

> 本文档旨在记录 `Windows` 平台 `kit` 相关拓展性功能及内容 :-)

### Process

#### Process hollow

在用户有调用 `PE/Shellcode` 各类格式的需求时， `Implant` 支持 `Process Hollow` 技术， 以伪装用户的调用需求

`Process Hollow` 的核心思想为创建一个合法进程， 随后镂空其原本内存， 写入我们所需要执行的代码， 从而伪装成合法进程执行活动

####  🛠️ Process Ghost

####  🛠️ Transacted Hollowing

#### Sacrifice Process

Fork&Run 虽然已经不是 opsec 的选择， 但是某些情况下还是避不开使用这个技术。

为便于理解， 可以将所有需要产生新进程的行为均理解为生成了一个 `牺牲进程`， 即包含下面将阐述的所有概念及功能

所有上述支持使用 `Sacrifice Process` 即 `牺牲进程` 的功能都是以 `SUSPEND` 及 `NO_WINDOWS` 的形式启动的， 在做完其余处理后再唤醒主线程， 因此在这期间我们可以对其做非常多的事

支持牺牲进程的功能有:

- execute (默认启动牺牲进程， 无需增加参数）
- execute_exe
- execute_dll
- execute_local
- execute_shellcode

我们也为 pe，shellcode 提供了更加 opsec 的 inline 版本(inline_pe/inline_shellcode).

接下来我们将以 `execute_exe` 功能来举例说明

```bash
# 命令示例
execute_exe gogo.exe -- -i 127.0.0.1
```

上述命令表示以默认`牺牲进程` (`notepad.exe`) 执行 `gogo.exe`, 参数为 `-i 127.0.0.1`

当然， 由于原本意义上的 `Fork&Run` 耗能非常巨大且笨重， 如果确实需要也可以考虑后期添加

#### Alternate Parent Processes

所有上述支持 `牺牲进程` 的功能均可以自定义 `牺牲进程` 的 `ppid`, 只需在调用命令时添加 `-p` 参数即可

可以使用 `ps` 命令获取当前所有进程的快照内容

```bash
# 命令示例
execute_shellcode -p 8888 -n "notepad.exe" ./loader.bin
```

上述命令表示以`notepad.exe` 作为牺牲进程执行 `loader.bin` ， 并进行父进程欺骗， 将 `ppid` 设为 `8888`

#### Spoof Process Arguments

由于所有的牺牲进程都会以 `SUSPEND` 参数启动， 因此在执行命令时， 我们可以对从启动到真正执行时的参数进行替换， 即在创建牺牲进程时以伪装的命令创建， 而在牺牲进程执行时以真实命令运行， 我们为所有的带有牺牲进程的功能都提供了该参数

真实参数将被写入保存进虚假参数的内存中， 因此， 如果真实参数比伪装参数长， 该功能将不会启用

#### Blocking DLLs

使用 `blockdlls start` 命令来使得以后启动的所有牺牲进程均需要验证将要加载的 `DLL` 的签名， 非微软签名的 `DLL` 将会被禁止加载于我们的 `牺牲进程中`, 使用 `blockdlls stop` 命令来结束这一行为

该功能需要在 `Windows 10` 及以上系统中使用

#### AMSI & ETW & WLDP

在终端攻防漫长的对抗中， `AMSI` 及 `ETW` 的推出可谓是一石激起千层浪， 但当大家都位于 `r3` 时， 通过一些手法即可轻松绕过这些检测， 我们也在该版本中推出了基础 `bypass` 功能

目前常见的绕过技术大概分为四类， 直接 `patch`, `hook`， 修改 `IAT`以及通过 `VEH`来进行绕过

在基础版本中， 我们选用了 `hook` 技术来为程序进行这类检测的绕过

使用 `bypass` 命令来开启绕过 `AMSI` 及 `ETW` 检测, 
```bash
#使用示例
bypass
```

当然, 在某些功能使用时我们也会默认开启 `bypass` ， 例如

- execute_assemble
- powerpick

由于 `ETW` 突然没有任何消息很突兀且明显， 因此在执行结束后， 我们还会将其复原

也因为这个原因， 我们并不推荐直接粗鲁的进行 `bypass` 功能， 或使用某些不在执行后修复的 `PE2SHELLCODE` 软件， 以免发生意外


### Dll/EXE

`DLL/EXE` 是 `Windows` 中的可执行程序格式

在使用中， 可能有动态加载调用 `PE` 文件的需求， 这些文件可能是某个 `EXP` 或某个功能模块， 因此

`Implant` 支持动态加载和调用 `DLL/EXE ` 文件， 并可选择是否需要获取标准输出， 我们将默认捕获标准输出内容并将其返回

所有执行的 `DLL/EXE` 都无需落地在内存中直接执行， 通过更改参数来控制 `DLL/EXE` 在自身内存中调用或创建一个牺牲进程以调用，关于牺牲进程， 您可以参照 `Sacrifice Process` 这一小节的内容

#### Inline PE

某些极端情况下， 用户可能有在本进程执行 `PE` 文件的需求， 因此我们通过 `memory load pe` 技术以支持用户在 `Implant` 中执行 `PE` 文件, 我们将默认捕获 `PE` 文件的标准输出

您可以使用 `inline_exe` / `inline_dll` 进行调用

请注意， 由于各工具实现良莠不齐， 因此您所要使用的工具可能会伴随各种泄漏问题

因此， 使用该功能时建议加上超时时间以防止您丢失自己的连接， 并且需要您自行评估 `inline` 执行的 `PE/DLL` 是否会伴随有内存问题

> 请注意，以`EXE` 形式正常执行并结束的工具并不代表其在编写时完美关闭所有其持有的句柄或完美释放内存， 由于在 `inline` 场景下， 我们可能会丧失对于工具本身内存/句柄的监控能力（也许在不远的将来会有所有内存分配/句柄持有的监控）， 因此使用时请着重小心 :)

由于我们提供了 `BOF` 执行的功能， 因此我更推荐您使用上位代替， 即使用 `bof` 功能进行拓展功能的调用:)

```bash
# 命令示例
inline_exe gogo.exe -t 10 -- -i 127.0.0.1
```

上述命令表示以内联形式在 `implant` 本体中执行 `gogo.exe`, 超时时间为 `10s`， 参数为 `-i 127.0.0.1`


### Shellcode

常见的 `Shellcode` 为一段用于执行的短小精悍的代码段，其以体积小，可操作性大的方式广为使用， 因此

`Implant` 支持动态加载 `shellcode`, 并可选择在自身进程还是牺牲进程中调用

请注意，由于 `Implant` 无法分辨的 `shellcode` 是哪个架构的， 请在使用该功能时，如果不确定架构和其稳定性， 最好使用 `牺牲进程` 来进行调用， 而非在本体中进行， 以免由于误操作失去连接, 关于牺牲进程， 您可以参照 `Sacrifice Process` 这一小节的内容

目前开源版本中使用的方式基于 `APC`, 当然， `Pool party` 正在路上

```bash
# 命令示例
# 使用牺牲进程
execute_shellcode xxx.bin

# inline 执行
inline_shellcode xxx.bin
```

### .NET CRL

对于前几年的从事安全工作的从业人员来说, 在 `Windows` 系统上使用 `C#` 编写工具程序十分流行，各类检测及反制手段如 `AMSI` 还未添加进安全框架中, 因此市面上留存了大量由 C#编写并用于安全测试的各类利用和工具程序集。

`C#` 程序可以在 `Windows` 的 `.Net` 框架中运行,而 `.Net` 框架也是现代 `Windows` 系统中不可或缺的一部分。其中包含一个被称为 `Common Language Runtime(CLR)` 的运行时,`Windows` 为此提供了大量的接口,以便开发者操作 `系统API`。

因此， `Implant` 支持在内存中加载并调用 `.Net` 程序,并可选择是否需要获取标准输出。

在 `inline` 执行 `.Net` 程序集时， 我们将会在 `implant` 进程中引入 `.Net` 环境， 在内存中加载并执行您的 `.Net` 程序集

我们将会默认为您绕过 `AMSI`, `WDLP` 以及 `ETW` 的检测

```bash
# 使用示例
execute_assemble Seatbelt.exe -- AMSIProviders
```

上述命令为内存中执行 `Seatbelt.exe` .Net程序， 参数为`AMSIProviders`

### Unmanaged Powershell

在红队的工作需求中， 命令执行为一个非常核心的功能， 而现代的 `Powershell` 就是一个在 `Windows` 中及其重要且常用的脚本解释器， 有很多功能强大的 Powershell 脚本可以支持红队人员在目标系统上的工作

因此，针对直接调用 `Powershell.exe` 来执行 `powershell` 命令的检测层出不穷，为避免针对此类的安全检查

`Implant` 支持在不依赖系统自身 `Powershell.exe ` 程序的情况下执行 `Powershell cmdlet` 命令, 具体可参照 `Post Exploitation` 章节中 `Running Commands` 小节的内容,进一步了解相关功能的使用方法。

- 使用 `powershell` 命令来唤起 `powershell.exe` 以执行 `powershll` 命令
- 使用 `powerpick` 命令来摆脱 `powershell.exe` 执行 `powershell` 命令
- 使用 `powershell_import` 命令来向 `Implant` 导入 `powershell script`， 系统将在内存中保存该脚本， 以再后续使用时直接调用该脚本的内容

```bash
# 使用示例
powerpick --script powerview.ps1 -- ";Get-NetProcess"
```
即使用 `unmanaged powershell` 执行 `powerview.ps1` 脚本中的 `Get-NetProcess` 命令


### BOF

常见的， 一个 C 语言源程序被编译成目标程序由四个阶段组成， 即（预处理， 编译， 汇编， 链接）

而我们的 `Beacon Object File(BOF) ` 是代码在经过前三个阶段（预处理， 编译， 汇编）后，未链接产生的 `Obj` 文件（通常被称为可重定位目标文件）

该类型文件由于未进行链接操作， 因此一般体积较小， 较常见 `DLL/EXE` 这类可执行程序更易于传输，被广泛利用于知名 C2 工具 Cobalt Strike(后称 CS)中， 不少红队开发人员为其模块编写了 BOF 版本， 因此 `Implant` 对该功能进行了适配工作， `Implant` 支持大部分 CS 提供的内部 API, 以减少各使用人员的使用及适配成本

请注意， 由于我们的 `BOF` 功能与 `CS` 类似，执行于本进程中， 因此在使用该功能时请确保使用的 `BOF` 文件可以正确执行， 否则将丢失当前连接

```bash
# 使用示例
bof dir.x64.o "str:C:\\Program Files" 
```

即使用 `bof` 功能加载执行 `dir.x64.o`， 参数为 `str:C:\\Program Files`
您可选的参数模式有:
- wstr: 以null结尾的宽字符串
- str:  以null结尾的字符串
- int:  4字节长度整形
- short: 2 字节长度短整形
- bin: 以base64编码后的bytes数组


#### BOF 开发

为减少使用人员的开发成本， 本 `Implant` 的 `BOF` 开发标准与 `CS` 工具相同，可参照 `CS` 的开发模版进行开发，

其模版如下， 链接为 [https://github.com/Cobalt-Strike/bof_template/blob/main/beacon.h](https://github.com/Cobalt-Strike/bof_template/blob/main/beacon.h)

```c
/*
 * Beacon Object Files (BOF)
 * -------------------------
 * A Beacon Object File is a light-weight post exploitation tool that runs
 * with Beacon's inline-execute command.
 *
 * Additional BOF resources are available here:
 *   - https://github.com/Cobalt-Strike/bof_template
 *
 * Cobalt Strike 4.x
 * ChangeLog:
 *    1/25/2022: updated for 4.5
 *    7/18/2023: Added BeaconInformation API for 4.9
 *    7/31/2023: Added Key/Value store APIs for 4.9
 *                  BeaconAddValue, BeaconGetValue, and BeaconRemoveValue
 *    8/31/2023: Added Data store APIs for 4.9
 *                  BeaconDataStoreGetItem, BeaconDataStoreProtectItem,
 *                  BeaconDataStoreUnprotectItem, and BeaconDataStoreMaxEntries
 *    9/01/2023: Added BeaconGetCustomUserData API for 4.9
 */

/* data API */
typedef struct {
        char * original; /* the original buffer [so we can free it] */
        char * buffer;   /* current pointer into our buffer */
        int    length;   /* remaining length of data */
        int    size;     /* total size of this buffer */
} datap;

DECLSPEC_IMPORT void    BeaconDataParse(datap * parser, char * buffer, int size);
DECLSPEC_IMPORT char *  BeaconDataPtr(datap * parser, int size);
DECLSPEC_IMPORT int     BeaconDataInt(datap * parser);
DECLSPEC_IMPORT short   BeaconDataShort(datap * parser);
DECLSPEC_IMPORT int     BeaconDataLength(datap * parser);
DECLSPEC_IMPORT char *  BeaconDataExtract(datap * parser, int * size);

/* format API */
typedef struct {
        char * original; /* the original buffer [so we can free it] */
        char * buffer;   /* current pointer into our buffer */
        int    length;   /* remaining length of data */
        int    size;     /* total size of this buffer */
} formatp;

DECLSPEC_IMPORT void    BeaconFormatAlloc(formatp * format, int maxsz);
DECLSPEC_IMPORT void    BeaconFormatReset(formatp * format);
DECLSPEC_IMPORT void    BeaconFormatAppend(formatp * format, char * text, int len);
DECLSPEC_IMPORT void    BeaconFormatPrintf(formatp * format, char * fmt, ...);
DECLSPEC_IMPORT char *  BeaconFormatToString(formatp * format, int * size);
DECLSPEC_IMPORT void    BeaconFormatFree(formatp * format);
DECLSPEC_IMPORT void    BeaconFormatInt(formatp * format, int value);

/* Output Functions */
#define CALLBACK_OUTPUT      0x0
#define CALLBACK_OUTPUT_OEM  0x1e
#define CALLBACK_OUTPUT_UTF8 0x20
#define CALLBACK_ERROR       0x0d

DECLSPEC_IMPORT void   BeaconOutput(int type, char * data, int len);
DECLSPEC_IMPORT void   BeaconPrintf(int type, char * fmt, ...);


/* Token Functions */
DECLSPEC_IMPORT BOOL   BeaconUseToken(HANDLE token);
DECLSPEC_IMPORT void   BeaconRevertToken();
DECLSPEC_IMPORT BOOL   BeaconIsAdmin();

/* Spawn+Inject Functions */
DECLSPEC_IMPORT void   BeaconGetSpawnTo(BOOL x86, char * buffer, int length);
DECLSPEC_IMPORT void   BeaconInjectProcess(HANDLE hProc, int pid, char * payload, int p_len, int p_offset, char * arg, int a_len);
DECLSPEC_IMPORT void   BeaconInjectTemporaryProcess(PROCESS_INFORMATION * pInfo, char * payload, int p_len, int p_offset, char * arg, int a_len);
DECLSPEC_IMPORT BOOL   BeaconSpawnTemporaryProcess(BOOL x86, BOOL ignoreToken, STARTUPINFO * si, PROCESS_INFORMATION * pInfo);
DECLSPEC_IMPORT void   BeaconCleanupProcess(PROCESS_INFORMATION * pInfo);

/* Utility Functions */
DECLSPEC_IMPORT BOOL   toWideChar(char * src, wchar_t * dst, int max);

/* Beacon Information */
/*
 *  ptr  - pointer to the base address of the allocated memory.
 *  size - the number of bytes allocated for the ptr.
 */
typedef struct {
        char * ptr;
        size_t size;
} HEAP_RECORD;
#define MASK_SIZE 13

/*
 *  sleep_mask_ptr        - pointer to the sleep mask base address
 *  sleep_mask_text_size  - the sleep mask text section size
 *  sleep_mask_total_size - the sleep mask total memory size
 *
 *  beacon_ptr   - pointer to beacon's base address
 *                 The stage.obfuscate flag affects this value when using CS default loader.
 *                    true:  beacon_ptr = allocated_buffer - 0x1000 (Not a valid address)
 *                    false: beacon_ptr = allocated_buffer (A valid address)
 *                 For a UDRL the beacon_ptr will be set to the 1st argument to DllMain
 *                 when the 2nd argument is set to DLL_PROCESS_ATTACH.
 *  sections     - list of memory sections beacon wants to mask. These are offset values
 *                 from the beacon_ptr and the start value is aligned on 0x1000 boundary.
 *                 A section is denoted by a pair indicating the start and end offset values.
 *                 The list is terminated by the start and end offset values of 0 and 0.
 *  heap_records - list of memory addresses on the heap beacon wants to mask.
 *                 The list is terminated by the HEAP_RECORD.ptr set to NULL.
 *  mask         - the mask that beacon randomly generated to apply
 */
typedef struct {
        char  * sleep_mask_ptr;
        DWORD   sleep_mask_text_size;
        DWORD   sleep_mask_total_size;

        char  * beacon_ptr;
        DWORD * sections;
        HEAP_RECORD * heap_records;
        char    mask[MASK_SIZE];
} BEACON_INFO;

DECLSPEC_IMPORT void   BeaconInformation(BEACON_INFO * info);

/* Key/Value store functions
 *    These functions are used to associate a key to a memory address and save
 *    that information into beacon.  These memory addresses can then be
 *    retrieved in a subsequent execution of a BOF.
 *
 *    key - the key will be converted to a hash which is used to locate the
 *          memory address.
 *
 *    ptr - a memory address to save.
 *
 * Considerations:
 *    - The contents at the memory address is not masked by beacon.
 *    - The contents at the memory address is not released by beacon.
 *
 */
DECLSPEC_IMPORT BOOL BeaconAddValue(const char * key, void * ptr);
DECLSPEC_IMPORT void * BeaconGetValue(const char * key);
DECLSPEC_IMPORT BOOL BeaconRemoveValue(const char * key);

/* Beacon Data Store functions
 *    These functions are used to access items in Beacon's Data Store.
 *    BeaconDataStoreGetItem returns NULL if the index does not exist.
 *
 *    The contents are masked by default, and BOFs must unprotect the entry
 *    before accessing the data buffer. BOFs must also protect the entry
 *    after the data is not used anymore.
 *
 */

#define DATA_STORE_TYPE_EMPTY 0
#define DATA_STORE_TYPE_GENERAL_FILE 1

typedef struct {
        int type;
        DWORD64 hash;
        BOOL masked;
        char* buffer;
        size_t length;
} DATA_STORE_OBJECT, *PDATA_STORE_OBJECT;

DECLSPEC_IMPORT PDATA_STORE_OBJECT BeaconDataStoreGetItem(size_t index);
DECLSPEC_IMPORT void BeaconDataStoreProtectItem(size_t index);
DECLSPEC_IMPORT void BeaconDataStoreUnprotectItem(size_t index);
DECLSPEC_IMPORT size_t BeaconDataStoreMaxEntries();

/* Beacon User Data functions */
DECLSPEC_IMPORT char * BeaconGetCustomUserData();
```

为避免的 `BOF` 程序由于调用了本 `Implant` 未适配的函数导致丢失连接， 请注意本 `Implant` 现支持使用的函数列表如下:

```c
BeaconDataExtract
BeaconDataPtr
BeaconDataInt
BeaconDataLength
BeaconDataParse
BeaconDataShort
BeaconPrintf
BeaconOutput

BeaconFormatAlloc
BeaconFormatAppend
BeaconFormatFree
BeaconFormatInt
BeaconFormatPrintf
BeaconFormatReset
BeaconFormatToString

BeaconUseToken
BeaconIsAdmIn

BeaconCleanupProcess
```

!!! 请在编写 `BOF` 文件或使用现有 `BOF` 对应工具包前详细检查是否适配了对应 `API`， 以防止丢失连接！！！


### Memory

#### 🛠 ️ 全局堆加密
#### 🛠 ️ 随机分配 `chunk` 加料

### Syscall

虽然是老生常态的技术， 但作为基建设计的框架怎么会少的了它呢 :)

在 `Syscall` 漫长的发展过程中， 出现了多种门技术， 在权衡了多个技术后

我们最终选用通过地址排序计算 `Syscall Num` 并辅以随机 `Syscall` 地址作为我们默认的 `syscall` 调用

但实际上为了规避调用检测， 最好用的还是动态获取 + 堆栈混淆 （目前默认采用）
当然， 这里的动态获取函数的唯一目的就是减少导入表特征 :)

### HOOK

#### 🛠️ inline HOOK 

#### 🔒 Hardware HOOK

###  🛠️ Rop Chain

### HIDDEN

#### AMSI & ETW

##### HOOK

#####  PATCH

#####  HARDWARE HOOK

#### 👤 SLEEP MASK

#### THREAD TASK SPOOFING

在漫长的攻防旅程中， 堆栈劫持是一个非常精美的点子， 精美到让我完全放弃使用 `syscall` 来进行底层 `API` 的构建

该技术的核心思想在于， 程序在创建每一个函数栈帧时， 都会将其返回地址压入栈中， 从在函数上下文结束后返回到正确的位置， 而这样也可以方便的进行 `unwind`， 即调用堆栈的分析和检测， 因此， 如果我们在调用点处替换返回地址为我们提前预设好的返回地址， 并相对应的创建假的栈帧， 那么在真正调用时， 在 `trace stack` 时， 我们的栈帧就是非常干净非常完美的

我们将所有底层 `API` 都进行了默认的堆栈混淆， 通过伪造栈帧来达到所有调用点均是来自于某个随机的系统函数， 而非在某个私有内存中 :)

并且由于我们 `implant` 本体本身会有很多合法的函数调用行为， 辅以 `kit` 中各类功能模块干净的栈帧，我们的行为就会更趋近于合法程序

当然， 由于 `CET` 的出现， 这项技术的检测也有了解法， 但攻防的长河总是漫漫

路漫漫其修远兮， 吾将上下而求索

#### 👤 LITE VM

### 🛠️ Obfuscator LLVM

#### 🛠️ Anti Class Dump

#### 🛠️ Anti Hooking

#### 🛠️ Anti Debug

#### 🛠️ Bogus Control Flow

#### 🛠️ Control Flow Flattening

#### 🛠️ Basic Block Splitting

#### 🛠️ Instruction Substitution

#### 🛠️ Function CallSite Obf

#### 🛠️ String Encryption

#### 🛠️ Constant Encryption

#### 🛠️ Indirect Branching

#### 🛠️ Function Wrapper


最后， 感谢大量优秀的开源项目及开发者们


* https://github.com/yamakadi/clroxide/
* https://github.com/MSxDOS/ntapi
* https://github.com/trickster0/EDR_Detector/blob/master/EDR_Detector.rs 
* https://github.com/Fropops/Offensive-Rust
* https://github.com/wildbook/hwbp-rs
* https://github.com/bats3c/DarkLoadLibrary/blob/master/DarkLoadLibrary/ 
* https://github.com/b4rtik/metasploit-execute-assembly
* https://github.com/lap1nou/CLR_Heap_encryption
* https://github.com/med0x2e/ExecuteAssembly/
