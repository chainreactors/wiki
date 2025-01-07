---
date:
  created: 2025-01-07
slug: IoM_advanced_TLS
---

## 从一个崩溃开始的 PE Loader 救赎之旅

本系列文章虽然叫做IoM进阶系列， 但实际与IoM关系不大，只是在开发IoM的过程中遇到的。进阶系列均为解决前无古人的问题、创新等， 本文将从最常用的技术 PE-Loader开始。 

> 如果读者已经熟知PE加载， 那么本文的内容将不会有非常大的革新， 但各位阅读完本文可能也会看到一些新鲜玩意， 聊以慰籍 :)
> 
> 今年8月， 我们推出了下一代 `C2` 计划 -- `Internal of Malice` , 旨在实现一套 `post-exploit` 基础设施， 在`implant`的语言选用中， 我们尝试了这两年最火热的红队语言：`Rust`, 也因为这个选择，在实现过程中遇到了和解决了非常多有意思的问题。
> 
> 在推出`stager` 版本之后， 交流群的一位同学贴出了[Writing a PE Loader for the Xbox in 2024](https://landaire.net/reflective-pe-loader-for-xbox/) 这篇文章， 用一种非常粗暴的方式解决了 `Rust`在使用`MSVC`编译时引入了`TLS(thread-local storage)`  , 而只常见的`PELoader` 简单调用 `tls callback` 无法正常加载 `PE` 文件的问题， 遂成文。


## TL;NR

在本文之前，几乎所有的SRDI或者类似的PE Loader都会面临PE使用静态TLS而导致的加载问题

这个问题的表现在rust编译的程序无法被任意 PE loader 加载。 当然不仅限于rust， 有非常多的语言都会使用TLS性能加速。 如果你遇到过某使用donut/SRDI生成的shellcode莫名其妙崩溃， 很有可能就是这个问题。 

可能因为他们不是基于rust生态构建，所以可以暂时逃避这个问题， 也意味着放弃所有使用rust编写的工具。但IoM完全基于rust 构建自己的基础设施，所以我们不得不面对这个问题。

- [No-Consolation](https://github.com/fortra/No-Consolation): 不支持静态TLS

![](assets/Pasted%20image%2020241227161625.png)
- [donut](https://github.com/TheWover/donut), 不支持静态TLS， 也意味着所有基于donut构建的C2也都不支持， 包括sliver, xiebroC2, merlin等等。 (顺带一提, 目前大部分C2的pe loader都基于donut构建， donut是个非常强大的项目)
- [sRDI](https://github.com/monoxgas/sRDI) 不支持静态TLS
- [link](https://github.com/postrequest/link), link 实现了自己的sRDI, 但是他也不支持T静态TLS, 不能加载自身。 
- [c3](https://github.com/WithSecureLabs/C3) 解决了win7, win10部分版本的静态TLS问题
- ... 

几乎所有的PE Loader都放弃了对rust程序以及用到了静态TLS程序的的兼容。

## 从 Implant 的设计理念说起

在设计之初， `implant` 就是一个由各种可替换组件构成的 `星舰`， 一个涵盖了多种无文件攻击模块(以`Windows`平台举例的`Shellcode`, `PE`, `.Net`, `Powershell`, `BOF`) 的可组装载体， 它应该是一个可以承载各种格式的 `payload` 发射器，或者作为一个安静的流量代理工具， 因此对于 `implant` 而言， 各种动态加载的功能必不可少， 而在 `windows` 中， `LoadPE` 就是实现这个想法的一个最基本的功能

在开始之前， 我们还是先简单介绍一下`LoadPE`, 在一个 `LoadPE` 的常规流程中， 有着如下几个常规动作

* 解析 `PE` 头
* 映射节区
* 修复重定位表
* 修复导入表
* 修复延迟导入表
* 修复权限
* 调用 `TLS callback` 函数
* 添加异常处理函数
* 调用入口点（可选）

在大部分情况下， 这样的一套流程下来可以涵盖基本的 `PE` 文件加载了， 但凡事总有例外

## 从一个Panic说起

### 第一次擦肩

在初期测试中， 我们动态加载 `Modules(IOM的组件)` 这一功能在单元测试中运行的十分良好， 但随着功能的逐渐增多， 在 `netstat module`  的测试中， `implant` 突然崩溃,  当时的崩溃点位于 `tokio` （一个`Rust`的异步运行时库）的 `TLS` 处理代码中， 随后我简单翻阅了下 `tokio` 库的 `issues`, 发现有人提及在`windows` 中 `tokio`的 `TLS` 实现略有问题，因此我将该库替换成了`async-std`库，这个问题就消失了， 由于当时正处于 `implant` 功能的快速开发周期， 因此在将原因简单归结于 `tokio` 库本身的问题后将其暂时搁置， 与核心问题擦肩而过

### 再相遇

再次相遇就是实现 `SRDI` 功能了， 与第一次擦肩极为类似， 在正常 `SRDI` 我们的 `Beacon` 后， 将其注入到 `Notepad` 进程上线流程十分丝滑

但在某一次测试时发现， 在将其 `inline` 执行在我们自身进程时， 熟悉的 `panic` 再次出现

```bash
thread '<unnamed>' panicked at library\std\src\thread\local.rs:260:26:
cannot access a Thread Local Storage value during or after destruction: AccessError
```

此时我意识到， 当初 `tokio` 好像被我冤枉了，死在了我的大意与麻木不仁中， 好在核心功能的开发基本结束， 终于有了空余时间来让我们看看到底发生了什么， 为 `tokio` 伸冤

> 由于原理类似，因此这里用 `SRDI` 还是 `InlinePE` 区别不大

首先排除库本身的问题， 我编译了一个 `DLL` 格式的`beacon`， 通过系统的 `LoadLibrary` 来进行加载并调用， 丝滑上线

好的， 这里就可以确定是我们 `Load` 的时候一定少处理了哪些东西， 一定是 `TLS`的问题吗

为了精确到 `TLS` ， 随后我尝试使用 `GNU` 编译链来进行测试。 编译， `inline` 执行， 完美上线， 切回 `MSVC`， `panic`

好的， 至此， 我们将范围收缩到了 `TLS`本身处理上， 让我们追根溯源

### 回归TLS

如果从头讲起， 本篇文章的篇幅将过于发散且庞大， 因此现在将我们的目光收束在`TLS` 本身上， 当然， 这里我也会简要对其做一个介绍， 相信感兴趣的同学会自己找到某些流传的第三方文档的， 为避免概念性的内容大量占用本文篇幅，推荐各位直接阅读 [Ken Johnson](http://www.nynaeve.net/?p=180) 关于 `TLS` 的精彩分析

简单来说， `TLS`  可以允许人们按线程进行存储， 比如在全局变量按线程实例化时, 而在 `windows` 中， 有一个线程相关的结构体 `TEB（Thread Environment Block)`， 该结构体会记录和控制很多线程相关的上下文， 我们本篇的重点也自然记录于此

在 `windows` 中， 有两种使用 `TLS` 的方式， 显式调用和隐式， 显式调用即大家熟悉的使用 `TlsGetValue` 等 `k32` 的 `apis`, 而隐式调用即是本篇的重点工程， 即在使用`MSVC`（这也是为什么上一章我选用GNU来简单聚焦的原因）构建时， 用`_declspec(thread)`来标记变量

现在让我们以 `rust` 的线程代码为例(`rustc version >= 1.82.0`)

> 为了收束篇幅， 下面将以64位windows系统为例， 并忽略大部分不必关注的代码

```rust
// https://github.com/rust-lang/rust/blob/f2b91ccbc27cb06369aa2dd934ff219e156408a8/library/std/src/thread/current.rs
use crate::sys::thread_local::local_pointer;

...

local_pointer! {
    static CURRENT;
}

...
// 为简化代码， 这里我们省略掉大部分目标系统(16, 32位)
local_pointer! {
    static ID;
}

```

而进入 `windows` 的 `thread_local` 中， 我们可以看到， 

```Rust
// 
#[macro_export]
#[stable(feature = "rust1", since = "1.0.0")]
#[cfg_attr(not(test), rustc_diagnostic_item = "thread_local_macro")]
#[allow_internal_unstable(thread_local_internals)]
macro_rules! thread_local {
	....

    // handle a single declaration
    ($(#[$attr:meta])* $vis:vis static $name:ident: $t:ty = $init:expr) => (
        $crate::thread::local_impl::thread_local_inner!($(#[$attr])* $vis $name, $t, $init);
    );
}
```

即

```Rust
// https://github.com/rust-lang/rust/blob/f2b91ccbc27cb06369aa2dd934ff219e156408a8/library/std/src/sys/thread_local/os.rs#L16
pub macro thread_local_inner {
    // used to generate the `LocalKey` value for const-initialized thread locals
    (@key $t:ty, const $init:expr) => {
        $crate::thread::local_impl::thread_local_inner!(@key $t, { const INIT_EXPR: $t = $init; INIT_EXPR })
    },

    // NOTE: we cannot import `Storage` or `LocalKey` with a `use` because that can shadow user
    // provided type or type alias with a matching name. Please update the shadowing test in
    // `tests/thread.rs` if these types are renamed.

    // used to generate the `LocalKey` value for `thread_local!`.
    (@key $t:ty, $init:expr) => {{
        #[inline]
        fn __init() -> $t { $init }

        // NOTE: this cannot import `LocalKey` or `Storage` with a `use` because that can shadow
        // user provided type or type alias with a matching name. Please update the shadowing test
        // in `tests/thread.rs` if these types are renamed.
        unsafe {
            // Inlining does not work on windows-gnu due to linking errors around
            // dllimports. See https://github.com/rust-lang/rust/issues/109797.
            $crate::thread::LocalKey::new(#[cfg_attr(windows, inline(never))] |init| {
                static VAL: $crate::thread::local_impl::Storage<$t>
                    = $crate::thread::local_impl::Storage::new();
                VAL.get(init, __init)
            })
        }
    }},
    ($(#[$attr:meta])* $vis:vis $name:ident, $t:ty, $($init:tt)*) => {
        $(#[$attr])* $vis const $name: $crate::thread::LocalKey<$t> =
            $crate::thread::local_impl::thread_local_inner!(@key $t, $($init)*);
    },
}
```

也就是

```rust
#[allow(missing_debug_implementations)]
pub struct Storage<T> {
    key: LazyKey,
    marker: PhantomData<Cell<T>>,
}

unsafe impl<T> Sync for Storage<T> {}

struct Value<T: 'static> {
    value: T,
    // INVARIANT: if this value is stored under a TLS key, `key` must be that `key`.
    key: Key,
}

impl<T: 'static> Storage<T> {
    pub const fn new() -> Storage<T> {
        Storage { key: LazyKey::new(Some(destroy_value::<T>)), marker: PhantomData }
    }
    ...
```

聚焦到 `windows` 中， 就是如下的代码了

```Rust
// https://github.com/rust-lang/rust/blob/f2b91ccbc27cb06369aa2dd934ff219e156408a8/library/std/src/sys/thread_local/key/windows.rs
pub struct LazyKey {
    /// The key value shifted up by one. Since TLS_OUT_OF_INDEXES == u32::MAX
    /// is not a valid key value, this allows us to use zero as sentinel value
    /// without risking overflow.
    key: AtomicU32,
    dtor: Option<Dtor>,
    next: AtomicPtr<LazyKey>,
    /// Currently, destructors cannot be unregistered, so we cannot use racy
    /// initialization for keys. Instead, we need synchronize initialization.
    /// Use the Windows-provided `Once` since it does not require TLS.
    once: UnsafeCell<c::INIT_ONCE>,
}


impl LazyKey {
    #[inline]
    pub const fn new(dtor: Option<Dtor>) -> LazyKey {
        LazyKey {
            key: AtomicU32::new(0),
            dtor,
            next: AtomicPtr::new(ptr::null_mut()),
            once: UnsafeCell::new(c::INIT_ONCE_STATIC_INIT),
        }
    }
	...

    #[cold]
    unsafe fn init(&'static self) -> Key {
        if self.dtor.is_some() {
            let mut pending = c::FALSE;
			...

            if pending == c::FALSE {
                // Some other thread initialized the key, load it.
                self.key.load(Relaxed) - 1
            } else {
                let key = unsafe { c::TlsAlloc() };
	            ...

                key
            }
        } else {
            // If there is no destructor to clean up, we can use racy initialization.

            let key = unsafe { c::TlsAlloc() };
			...
        }
    }
}
```

虽然我们在 `init`函数中看到了熟悉的 `TlsAlloc`， `TlsFree`， 但由于被注册为了 `#[cold]` 函数， 因此我们大部分情况下都该忽视该实现， 只需要关注 `new` 函数即可

那么 `key` 就是通过原子操作进行定义的 `AtomicU32::new()`

除此之外， 为了解决`tls`的析构函数问题， `rust` 注册了一个 `tls callback`

```rust
// https://github.com/rust-lang/rust/blob/master/library/std/src/sys/thread_local/guard/windows.rs
#[link_section = ".CRT$XLB"]
#[cfg_attr(miri, used)] // Miri only considers explicitly `#[used]` statics for `lookup_link_section`
pub static CALLBACK: unsafe extern "system" fn(*mut c_void, u32, *mut c_void) = tls_callback;

unsafe extern "system" fn tls_callback(_h: *mut c_void, dw_reason: u32, _pv: *mut c_void) {
    if dw_reason == c::DLL_THREAD_DETACH || dw_reason == c::DLL_PROCESS_DETACH {
        unsafe {
            #[cfg(target_thread_local)]
            super::super::destructors::run();
            #[cfg(not(target_thread_local))]
            super::super::key::run_dtors();

            crate::rt::thread_cleanup();
        }
    }
}

```

这也可以解释为什么简单的 `hello world` 函数也会含有一个 `tls_callback` 函数了

在使用`target_thread_local`时， 其析构函数为

```rust
pub unsafe fn run() {
    loop {
        let mut dtors = DTORS.borrow_mut();
        match dtors.pop() {
            Some((t, dtor)) => {
                drop(dtors);
                unsafe {
                    dtor(t);
                }
            }
            None => {
                // Free the list memory.
                *dtors = Vec::new();
                break;
            }
        }
    }
}
```

而在不使用 `target_thread_local` 时， 其析构函数为

```rust
// This will and must only be run by the destructor callback in [`guard`].
pub unsafe fn run_dtors() {
    for _ in 0..5 {
        let mut any_run = false;

        // Use acquire ordering to observe key initialization.
        let mut cur = DTORS.load(Acquire);
        while !cur.is_null() {
            let pre_key = unsafe { (*cur).key.load(Acquire) };
            let dtor = unsafe { (*cur).dtor.unwrap() };
            cur = unsafe { (*cur).next.load(Relaxed) };

            // In LazyKey::init, we register the dtor before setting `key`.
            // So if one thread's `run_dtors` races with another thread executing `init` on the same
            // `LazyKey`, we can encounter a key of 0 here. That means this key was never
            // initialized in this thread so we can safely skip it.
            if pre_key == 0 {
                continue;
            }
            // If this is non-zero, then via the `Acquire` load above we synchronized with
            // everything relevant for this key. (It's not clear that this is needed, since the
            // release-acquire pair on DTORS also establishes synchronization, but better safe than
            // sorry.)
            let key = pre_key - 1;

            let ptr = unsafe { c::TlsGetValue(key) };
            if !ptr.is_null() {
                unsafe {
                    c::TlsSetValue(key, ptr::null_mut());
                    dtor(ptr as *mut _);
                    any_run = true;
                }
            }
        }

        if !any_run {
            break;
        }
    }
}
```

也就是说， 如果不使用 `target_thread_local`, 我们依旧是使用 `Tls*` 系列函数进行管理

看到这里， 应该已经可以暂时将所谓的 `target_thread_local` 和隐式调用挂等号了

由于单纯的代码并不能完整的构成`TLS`的构造， 其应该是代码， 编译器和操作系统共同努力的结果， 因此接下来我们需要看看编译后的结果

### hello world ：）

首先让我们用 `msvc` 编译一个简单的`hello world` 示例

```bash
cargo new hello_world

cd hello_world

cargo build --target x86_64-pc-windows-msvc
```

首先是导入表, 非常干净， 没有 `Tls` 相关函数

```rust
> rabin2 -i .\hello_world.exe
[Imports]
nth vaddr       bind type lib                               name
----------------------------------------------------------------
1   0x14001b000 NONE FUNC KERNEL32.dll                      GetLastError
2   0x14001b008 NONE FUNC KERNEL32.dll                      AddVectoredExceptionHandler
3   0x14001b010 NONE FUNC KERNEL32.dll                      SetThreadStackGuarantee
4   0x14001b018 NONE FUNC KERNEL32.dll                      WaitForSingleObject
5   0x14001b020 NONE FUNC KERNEL32.dll                      QueryPerformanceCounter
6   0x14001b028 NONE FUNC KERNEL32.dll                      AcquireSRWLockExclusive
7   0x14001b030 NONE FUNC KERNEL32.dll                      RtlCaptureContext
8   0x14001b038 NONE FUNC KERNEL32.dll                      RtlVirtualUnwind
9   0x14001b040 NONE FUNC KERNEL32.dll                      RtlLookupFunctionEntry
10  0x14001b048 NONE FUNC KERNEL32.dll                      SetLastError
11  0x14001b050 NONE FUNC KERNEL32.dll                      GetCurrentDirectoryW
12  0x14001b058 NONE FUNC KERNEL32.dll                      GetEnvironmentVariableW
13  0x14001b060 NONE FUNC KERNEL32.dll                      GetCurrentProcess
14  0x14001b068 NONE FUNC KERNEL32.dll                      GetStdHandle
15  0x14001b070 NONE FUNC KERNEL32.dll                      GetCurrentProcessId
16  0x14001b078 NONE FUNC KERNEL32.dll                      TryAcquireSRWLockExclusive
17  0x14001b080 NONE FUNC KERNEL32.dll                      HeapAlloc
18  0x14001b088 NONE FUNC KERNEL32.dll                      GetProcessHeap
19  0x14001b090 NONE FUNC KERNEL32.dll                      HeapFree
20  0x14001b098 NONE FUNC KERNEL32.dll                      HeapReAlloc
21  0x14001b0a0 NONE FUNC KERNEL32.dll                      AcquireSRWLockShared
22  0x14001b0a8 NONE FUNC KERNEL32.dll                      ReleaseSRWLockShared
23  0x14001b0b0 NONE FUNC KERNEL32.dll                      ReleaseMutex
24  0x14001b0b8 NONE FUNC KERNEL32.dll                      GetModuleHandleA
25  0x14001b0c0 NONE FUNC KERNEL32.dll                      GetConsoleMode
26  0x14001b0c8 NONE FUNC KERNEL32.dll                      GetModuleHandleW
27  0x14001b0d0 NONE FUNC KERNEL32.dll                      FormatMessageW
28  0x14001b0d8 NONE FUNC KERNEL32.dll                      MultiByteToWideChar
29  0x14001b0e0 NONE FUNC KERNEL32.dll                      WriteConsoleW
30  0x14001b0e8 NONE FUNC KERNEL32.dll                      GetCurrentThread
31  0x14001b0f0 NONE FUNC KERNEL32.dll                      GetSystemTimeAsFileTime
32  0x14001b0f8 NONE FUNC KERNEL32.dll                      WaitForSingleObjectEx
33  0x14001b100 NONE FUNC KERNEL32.dll                      LoadLibraryA
34  0x14001b108 NONE FUNC KERNEL32.dll                      CreateMutexA
35  0x14001b110 NONE FUNC KERNEL32.dll                      ReleaseSRWLockExclusive
36  0x14001b118 NONE FUNC KERNEL32.dll                      GetProcAddress
37  0x14001b120 NONE FUNC KERNEL32.dll                      CloseHandle
38  0x14001b128 NONE FUNC KERNEL32.dll                      SetUnhandledExceptionFilter
39  0x14001b130 NONE FUNC KERNEL32.dll                      UnhandledExceptionFilter
40  0x14001b138 NONE FUNC KERNEL32.dll                      IsDebuggerPresent
41  0x14001b140 NONE FUNC KERNEL32.dll                      InitializeSListHead
42  0x14001b148 NONE FUNC KERNEL32.dll                      GetCurrentThreadId
43  0x14001b150 NONE FUNC KERNEL32.dll                      IsProcessorFeaturePresent
...
```

随后是导出表

```bash
Name	Address	Ordinal
TlsCallback_0	000000014000AF60	
mainCRTStartup	0000000140018AA0	[main entry]
```

```c
__int64 __fastcall std::sys::windows::thread_local_key::on_tls_callback(__int64 a1, int a2)
{
  __int64 result; // rax

  result = (unsigned __int8)byte_140025258;
  if ( byte_140025258 )
  {
    if ( !a2 || a2 == 3 )
    {
      try
      {
        std::sys::windows::thread_local_key::run_keyless_dtors();
      }
      catch ( ... )
      {
        core::panicking::panic_cannot_unwind();
      }
    }
    return LOBYTE(tls_used.StartAddressOfRawData);
  }
  return result;
}
```

符合之前的猜想， 而如果此时查看所有 `tls_index` 的引用， 那么可以发现足足有 `45` 处引用

而此时如果我们编译一个 `gnu` 版本 `hello world`

```bash
cargo build --target x86_64-pc-windows-gnu
```

首先看 `Import` 表， 有几个有意思的函数出现了 `Tls*`
 
```c
 rabin2 -i .\hello_world.exe
[Imports]
nth vaddr       bind type lib          name
-------------------------------------------
...
105 0x140101a00 NONE FUNC KERNEL32.dll TlsAlloc
106 0x140101a08 NONE FUNC KERNEL32.dll TlsFree
107 0x140101a10 NONE FUNC KERNEL32.dll TlsGetValue
108 0x140101a18 NONE FUNC KERNEL32.dll TlsSetValue
...
```

再看看导出表

```bash
Name	Address	Ordinal
TlsCallback_0	0000000140051DF0	
TlsCallback_1	00000001400BD500	
TlsCallback_2	00000001400BD4D0	
mainCRTStartup	00000001400014F0	[main entry]
```

好的， 出现了三个 `tls callback` 函数, 首先是 `callback_0`

```c
void __cdecl std::sys::windows::thread_local_key::on_tls_callback()
{
	...
  if ( std::sys::windows::thread_local_key::HAS_DTORS && (!v0 || v0 == 3) )
  {
    v1 = std::sys::windows::thread_local_key::DTORS;
    if ( std::sys::windows::thread_local_key::DTORS )
    {
      v2 = 0;
      do
      {
        v3 = *(void (__fastcall **)(LPVOID))v1;
        if ( !*(_QWORD *)v1 )
LABEL_39:
          core::panicking::panic();
        v4 = *(_DWORD *)(v1 + 24) - 1;
        Value = TlsGetValue(v4);
        if ( Value )
        {
          v6 = Value;
          TlsSetValue(v4, 0LL);
          v3(v6);
          v2 = 1;
        }
        v1 = *(_QWORD *)(v1 + 8);
      }
     ...
```

依旧是`tls` 的析构函数， 但这里有了`TlsGetValue`和 `TlsSetValue` 函数, 也就是非`target_thread_local` 下， 另外两个呢

`callback1` 是 

```c
BOOL __fastcall _dyn_tls_init(HANDLE hDllHandle, DWORD dwReason, LPVOID lpreserved)
{
  if ( *refptr__CRT_MT != 2 )
    *refptr__CRT_MT = 2;
  if ( dwReason == 1 )
    _mingw_TLScallback(hDllHandle, 1u, lpreserved);
  return 1;
}
```

`callback2`是

```c
BOOL __fastcall _dyn_tls_dtor(HANDLE hDllHandle, DWORD dwReason, LPVOID lpreserved)
{
  if ( dwReason != 3 && dwReason )
    return 1;
  _mingw_TLScallback(hDllHandle, dwReason, lpreserved);
  return 1;
}
```

好的， 都是 `mingw` 定义的， 我们再在这里查看一次 `tls_index` 的调用， 0!!!!

到这里几乎可以确定， 我们在加载时出现的一切问题都是 `msvc` 使用隐式`TLS`所导致的问题

接下来让我们再进一步， 由于这里我们不再关注显示调用， 因此显示调用相关的内容可能在本篇文章的后续内容中不会过多出现了:)

那么此时我们如果尝试加载 `msvc` 版本的 `hello world` 会发生什么呢， 虽然我们调用了 `callback`， 但很显然， 该`callback` 只用于析构函数

而我们的 `hello world` 中大量引用了 `tls_index`， 因此在其尝试获取 `TEB` 表后通过 `tls_index` 来做的任何操作都将失效， 因为我们并没有对其做任何操作

接下来让我们在两种场景下进行demo的测试， 首先是纯 `c` 环境中， 用常用的 `SRDI` 将我们的 `hello world` 转化为 `shellcode` 进行加载

```c
#include <stdio.h>
#include <stdlib.h>
#include <windows.h>

#define SHELLCODE_SIZE 1024

int main() {
    FILE *file = fopen("shellcode.bin", "rb");
    if (!file) {
        perror("打开文件失败");
        return -1;
    }

    unsigned char shellcode[SHELLCODE_SIZE];
    size_t bytesRead = fread(shellcode, 1, SHELLCODE_SIZE, file);
    fclose(file);

    void *exec = VirtualAlloc(0, bytesRead, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    if (exec == NULL) {
        perror("内存分配失败");
        return -1;
    }

    memcpy(exec, shellcode, bytesRead);

    ((void(*)())exec)();

    VirtualFree(exec, 0, MEM_RELEASE);
    return 0;
}
```

执行一下

```bash
fatal runtime error: global allocator may not use TLS
```

该错误来自于

```rust
// https://github.com/rust-lang/rust/blob/master/library/std/src/sys/thread_local/destructors/list.rs
pub unsafe fn register(t: *mut u8, dtor: unsafe extern "C" fn(*mut u8)) {
    let Ok(mut dtors) = DTORS.try_borrow_mut() else {
        // This point can only be reached if the global allocator calls this
        // function again.
        // FIXME: maybe use the system allocator instead?
        rtabort!("the global allocator may not use TLS with destructors");
    };

    guard::enable();

    dtors.push((t, dtor));
}
```

暂时按下不表， 接下来是 `rust` 环境

```rust
use std::fs::File;
use std::io::{self, Read};
use std::mem;
use std::ptr;
use std::os::windows::ffi::OsStrExt;
use winapi::um::memoryapi::VirtualAlloc;
use winapi::um::winnt::{MEM_COMMIT, MEM_RESERVE, PAGE_EXECUTE_READWRITE};

fn main() -> io::Result<()> {
    let mut file = File::open("shellcode.bin")?;
    let mut shellcode = Vec::new();

    file.read_to_end(&mut shellcode)?;

    let exec = unsafe {
        VirtualAlloc(
            ptr::null_mut(),
            shellcode.len(),
            MEM_COMMIT | MEM_RESERVE,
            PAGE_EXECUTE_READWRITE,
        )
    };

    if exec.is_null() {
        eprintln!("内存分配失败");
        return Err(io::Error::new(io::ErrorKind::Other, "内存分配失败"));
    }

    unsafe {
        ptr::copy_nonoverlapping(shellcode.as_ptr(), exec as *mut u8, shellcode.len());
        let func: fn() = mem::transmute(exec);
        func();
    }

    Ok(())
}
```

执行一下

```bash
.\loader_demo.exe
fatal runtime error: thread::set_current should only be called once per thread
```

报错很明显， `rust` 的线程初始化函数只能被调用一次， 而我们执行时的主线程在创建时已经被`call`过一次了， 因此我们用`create_thread` 来执行一下

```rust
use std::fs::File;
use std::io::{self, Read};
use std::mem;
use std::ptr;
use std::os::windows::ffi::OsStrExt;
use winapi::um::memoryapi::VirtualAlloc;
use winapi::um::winnt::{MEM_COMMIT, MEM_RESERVE, PAGE_EXECUTE_READWRITE, HANDLE};
use winapi::um::processthreadsapi::CreateThread;
use winapi::um::synchapi::WaitForSingleObject;

unsafe extern "system" fn thread_func(param: *mut winapi::ctypes::c_void) -> u32 {
    let shellcode = param as *const u8;
    let func: fn() = mem::transmute(shellcode);
    func();

    0
}

fn main() -> io::Result<()> {
    println!("[+] will run!");
    let mut file = File::open("shellcode.bin")?;
    let mut shellcode = Vec::new();

    file.read_to_end(&mut shellcode)?;

    let exec = unsafe {
        VirtualAlloc(
            ptr::null_mut(),
            shellcode.len(),
            MEM_COMMIT | MEM_RESERVE,
            PAGE_EXECUTE_READWRITE,
        )
    };

    if exec.is_null() {
        eprintln!("内存分配失败");
        return Err(io::Error::new(io::ErrorKind::Other, "内存分配失败"));
    }

    unsafe {
        ptr::copy_nonoverlapping(shellcode.as_ptr(), exec as *mut u8, shellcode.len());
        let thread_handle: HANDLE = CreateThread(
            ptr::null_mut(),
            0,
            Some(thread_func),
            exec,
            0,
            ptr::null_mut(),
        );

        if thread_handle.is_null() {
            eprintln!("创建线程失败");
            return Err(io::Error::new(io::ErrorKind::Other, "创建线程失败"));
        }
        WaitForSingleObject(thread_handle, 0xffffffff);
    }

    println!("[+] run over~");

    Ok(())
}


```

现在执行

```rust
.\loader_demo.exe
[+] will run!
Hello, world!
```

成功了， 说明在有 `TLS` 的情况下，在相同编译器版本下， 简单的 `hello world` 程序是可以错误的正确执行的（没有输出 `run over~`是因为 `hello world` 调用了 `exit`)

现在我们成功的加载了 `hello world`, 但其实并没有解决根本问题， 比如纯`c`环境或复杂的 `rust`程序， 接下来让我们尝试在纯 `c` 环境中加载 `hello world`

首先我们回到 `c` 的报错

```bash
fatal runtime error: global allocator may not use TLS
```

首先我们需要知道的是， 我们的 `tls callback` 函数并不会做任何的 `tls` 初始化相关工作， 我们需要在其它地方寻找其踪迹， 我们漏了什么呢?

此时我想起之前看到的一个项目 [WID_LoadLibrary](https://github.com/paskalian/WID_LoadLibrary) , 可以让我们很好的看清 `LoadLibrary`的具体流程（当然， 由于提供了符号表， 如果只关心流程的话直接看`ntdll` 也差不多），如果只看该项目的分析， 我们可以直接将关注点收缩到关键函数 `LdrpCallTlsInitializers`

这里我以我本机环境为例

```bash
>ver
Microsoft Windows [版本 10.0.22631.4460]
```

看看64位该函数的作用

```c++
__int64 __fastcall LdrpCallTlsInitializers(unsigned int a1, __int64 a2)
{
  __int64 TlsEntry; // rbx
  __int64 result; // rax
  __int64 *v6; // rbx
  __int64 v7; // rdi

  RtlAcquireSRWLockShared(&LdrpTlsLock);
  TlsEntry = LdrpFindTlsEntry(a2);
  result = RtlReleaseSRWLockShared(&LdrpTlsLock);
  if ( TlsEntry )
  {
    v6 = *(__int64 **)(TlsEntry + 40);
    if ( v6 )
    {
      while ( 1 )
      {
        v7 = *v6;
        if ( !*v6 )
          break;
        ++v6;
        LdrpLogInternal(
          (unsigned int)"minkernel\\ntdll\\ldrtls.c",
          1180,
          (unsigned int)"LdrpCallTlsInitializers",
          2,
          "Calling TLS callback %p for DLL \"%wZ\" at %p\n",
          v7,
          a2 + 72,
          *(_QWORD *)(a2 + 48));
        result = LdrpCallInitRoutine(ImageTlsCallbackCaller, *(_QWORD *)(a2 + 48), a1, v7);
      }
    }
  }
  return result;
}
```

可以看到， 该函数在本版本中的调用十分清晰，通过调用`LdrpFindTlsEntry` 函数获取  `TlsEntry`， 随后遍历寻找其 `Tls callback`函数并调用

而这也就意味着还有一部分内容早就初始化好了，而项目中并未提及， 因此我们还是需要依赖 `ntdll`， 感谢微软对符号表的慷慨:)

当我们搜索 `ntdll`中和`tls`相关的函数时， 可以注意到几个之前从未提及的函数`LdrpInitializeTls`, `LdrpHandleTlsData` 以及 `LdrpAllocateTlsEntry`

`LdrpInitializeTls` 函数被 `LdrpInitializeProcess` 引用，也就是说其实在进程初始化时就已经初始化过`TLS`了， 我们后续 `SRDI` 出来的 `shellcode`
 完全所使用的`tls_index`与之完全无关， 即使像之前 `hello world` 在 `rust` 环境中错误的正确执行了， 也是因为我们错误覆盖或使用了原本`rust`程序的`tls`环境

接下来 `LdrpHandleTlsData` 追根溯源则来自于 `LdrLoadDll`， 好的， 这应该就是我们需要重点关注的内容了

由于我们的纯 `c` 环境并没有隐式 `tls`， 因此也不会对其进行初始化和分配， 那么接下来需要做的， 就清晰明朗了许多

首先我们需要关注`LdrpInitializeTls`吗， 其实并不需要， 因为想象正常系统 `load dll` 的场景， 一个含有隐式 `tls` 的 `dll` 在使用 `LoadLibrary` 被加载进系统时是不会触发进程初始化的， 因此我们只需要关注在 `LdrLoadDll` 时调用的`LdrpHandleTlsData`即可， 而该函数签名如下:

```rust
pub type LdrpHandleTlsData = unsafe extern "system" fn(
    hmodule: *mut ::core::ffi::c_void,
) -> i32;
```

因此想要解决我们的问题， 有两条路线摆在我们面前:
1. 尝试调用该函数
2. 尝试实现该函数

由于 `LdrpHandleTlsData` 函数未导出， 因此我们需要想办法获取到该函数的地址并调用， 这也是开头提及的文章[Writing a PE Loader for the Xbox in 2024](https://landaire.net/reflective-pe-loader-for-xbox/) 所完成的那样， 而由于 `windows` 版本非常多， 因此远远不够， 但还是有一些项目做了大量的适配， 例如 [Blackbone](https://github.com/UnhappyAngel/Blackbone/blob/1a7d95567dc02fb1e5649a3d96f4aac36cac5427/src/BlackBone/Symbols/PatternLoader.cpp#L169) 还有 [MemoryModulePP](https://github.com/bb107/MemoryModulePP/blob/79f258b672f81c6ebbee1454335c4a4309d07ccb/MemoryModule/MmpLdrpTls.cpp#L23)

这几个项目都使用了通过硬编码特征来进行内存搜索的办法， 但前人的工作仿佛停在了 `Win11` 版本之前，而`Win11`也已经推出 `3` 年了， 需要去一一适配吗

如果各位经常写`exp`的话， 应该会经常遇到需要寻找全局变量或某些函数的需求， 比如 `chrome` 过沙箱需要设置的某`flag`， 虽然打开`ida` 很快就能做好适配， 但多个版本还是需要找一个共性

好在 `win11` 给了我们便利， 让我们仔细观察这几个函数， 可以注意到刚刚我给出的片段中有用于 `debug` 的日志信息， 那么我们是否可以通过`debug`信息定位函数呢， 首先我们可以注意到在`LdrpInitializeTls` 函数中的一个片段(以64位举例)

```asm
// ntdll version: 10.0.22000.120
.text:0000000180079CFD loc_180079CFD:                          ; CODE XREF: LdrpInitializeTls+D3↑j
.text:0000000180079CFD                 lea     rax, [rsi+48h]
.text:0000000180079D01                 mov     [rsp+88h+var_58], rbp
.text:0000000180079D06                 mov     [rsp+88h+var_60], rax
.text:0000000180079D0B                 lea     r8, aLdrpinitialize_5 ; "LdrpInitializeTls"
.text:0000000180079D12                 lea     rax, aDllWzHasTlsInf ; "DLL \"%wZ\" has TLS information at %p\n"
.text:0000000180079D19                 mov     r9d, 2
.text:0000000180079D1F                 mov     edx, 281h
.text:0000000180079D24                 mov     [rsp+88h+var_68], rax
.text:0000000180079D29                 lea     rcx, aMinkernelNtdll_2 ; "minkernel\\ntdll\\ldrtls.c"
.text:0000000180079D30                 call    LdrpLogInternal
.text:0000000180079D35                 xor     r9d, r9d
.text:0000000180079D38                 mov     [rsp+88h+var_68], r14
.text:0000000180079D3D                 lea     r8, [rsp+88h+var_48]
.text:0000000180079D42                 mov     rdx, rsi
.text:0000000180079D45                 mov     rcx, rbp
.text:0000000180079D48                 call    LdrpAllocateTlsEntry
.text:0000000180079D4D                 test    eax, eax
.text:0000000180079D4F                 js      short loc_180079CD5
.text:0000000180079D51                 mov     eax, 0FFFFh
.text:0000000180079D56                 mov     [rsi+6Eh], ax
.text:0000000180079D5A                 jmp     loc_180079CB1

```

可以看到， 在该版本中， 只要找到 `LdrpInitializeTls` 的引用， 就能找到该片段的上下文， 而再观察一下附近的信息 `LdrpAllocateTlsEntry`,  只会在两个函数中被引用

```bash
Direction	Type	Address	Text
Up	p	LdrpHandleTlsData+124	call    LdrpAllocateTlsEntry
	p	LdrpInitializeTls+16C	call    LdrpAllocateTlsEntry
Down	o	.rdata:0000000180152E08	RUNTIME_FUNCTION <rva LdrpAllocateTlsEntry, rva byte_180031153, \
Down	o	.pdata:000000018017F728	RUNTIME_FUNCTION <rva LdrpAllocateTlsEntry, rva byte_180031153, \
```

而 `LdrpHandleTlsData` 恰巧是我们需要的， 再看看`LdrpHandleTlsData`函数

```asm
.text:0000000180033824 LdrpHandleTlsData proc near             ; CODE XREF: LdrpDoPostSnapWork+6F↓p
.text:0000000180033824                                         ; DATA XREF: .rdata:00000001801530F0↓o ...
.text:0000000180033824
...
.text:0000000180033945                 mov     rcx, r14
.text:0000000180033948                 call    LdrpAllocateTlsEntry
.text:000000018003394D                 mov     esi, eax
.text:000000018003394F                 mov     [rsp+108h+var_D4], eax
```

很好， 只需要我们通过 `debug` 字符串特征反查到 `call LdrpAllocateTlsEntry` 的地方， 再通过扫描`.text` 段中对该地址的 `call rva` 的 `opcode`， 扫描到函数开头就能找到`LdrpHandleTlsData`了， 而由于对齐的原因， 函数开头前面会有 `CC CC CC`类的填充， 那么接下来的事情就非常容易了

### done!

```rust
pub unsafe fn find_ldrp_handle_tls_data() -> usize {
    let ntdll = match GetModuleBaseAddr(
        obfstr!("ntdll.dll").as_bytes(), 
        StrCmp::u16_u8_cmp
    ) {
        Ok(addr) => addr,
        Err(_) => 0 as _
    }; 
    let s = "LdrpInitializeTls\x00".as_bytes();
    let pe = match crate::pe::PE::PE::new_unchecked(ntdll) {
        Some(pe) => pe,
        None => return 0
    };
    let s_addr = match pe.find_string_in_rdata(s) {
        Some(addr) => addr,
        None => return 0
    };
    println!("[+] s_addr is {:x}", s_addr);
    let xref_addr = match pe.find_xref_in_text(b"\x4C\x8d\x05", 7, s_addr) {
        Some(addr) => addr + ntdll as usize,
        None => return 0
    };
    println!("xref_addr is {:x}", xref_addr);
    let call_drp_log_internal_addr = 
        match find_str(xref_addr as _, 0x30, b"\xE8") {
            Some(addr) => addr + xref_addr,
            None => return 0
    };
    println!("[+] call_drp_log_internal_addr is {:x}"
        , call_drp_log_internal_addr);
    let call_ldr_allocate_tls_entry = match find_str(
            (call_drp_log_internal_addr + 5) as _, 
            0x30, 
            b"\xE8") {
        Some(addr) => addr + call_drp_log_internal_addr + 5,
        None => return 0
    };
    println!("[+] call_ldr_allocate_tls_entry is {:x}", 
        call_ldr_allocate_tls_entry);
    let ldr_allocate_tls_entry = call_ldr_allocate_tls_entry + 
        calc_call_rva(call_ldr_allocate_tls_entry as _) as usize;
    let black_list: [usize;1] = [call_ldr_allocate_tls_entry];
    let call_ldr_allocate_tls_entry2 = 
        match pe.find_call_rva_in_text(ldr_allocate_tls_entry, &black_list) {
            Some(addr) => addr,
            None => { return 0; }
    };
    println!("[+] call_ldr_allocate_tls_entry2 is {:x}", 
        call_ldr_allocate_tls_entry2);
    let ldrp_handle_tls_data = 
        match pe.find_func_start(call_ldr_allocate_tls_entry2) {
            Some(addr) => addr,
            None => return 0
    };
    println!("[+] ldrp handle tls data is {:x}", ldrp_handle_tls_data);
    return ldrp_handle_tls_data;
}

```

再看看测试机的版本`10.0.22631.4602`， 也一样可以通过该方法进行寻找， 那么是否可以替换前面的那一大票内容呢

很可惜， 我先是信心满满的下载了测试机 `win7(ver: 6.1.7600)` 的 `ntdll`， 

```asm
.text:0000000078EF09D0 loc_78EF09D0:                           ; CODE XREF: LdrpInitializeTls+99↑j
.text:0000000078EF09D0                                         ; DATA XREF: .pdata:0000000078F9E1BC↓o
.text:0000000078EF09D0                 mov     rsi, [rsp+88h+Src]
.text:0000000078EF09D8                 test    rsi, rsi
.text:0000000078EF09DB                 jz      loc_78E994A7
.text:0000000078EF09E1                 test    byte ptr cs:LdrpDebugFlags, 5
.text:0000000078EF09E8                 jz      short loc_78EF0A1B
.text:0000000078EF09EA                 lea     rax, [rdi+48h]
.text:0000000078EF09EE                 mov     [rsp+88h+var_58], rsi
.text:0000000078EF09F3                 lea     r8, aLdrpinitialize_1 ; "LdrpInitializeTls"
.text:0000000078EF09FA                 mov     [rsp+88h+var_60], rax
.text:0000000078EF09FF                 lea     rcx, aDW7rtmMinkerne_15 ; "d:\\w7rtm\\minkernel\\ntdll\\ldrtls.c"
.text:0000000078EF0A06                 mov     r9d, 2
.text:0000000078EF0A0C                 mov     edx, 23Fh
.text:0000000078EF0A11                 mov     [rsp+88h+var_68], r15
.text:0000000078EF0A16                 call    LdrpLogDbgPrint
.text:0000000078EF0A1B
.text:0000000078EF0A1B loc_78EF0A1B:                           ; CODE XREF: LdrpInitializeTls+575E8↑j
.text:0000000078EF0A1B                 test    bpl, bpl
.text:0000000078EF0A1E                 jz      short loc_78EF0A21
.text:0000000078EF0A20                 int     3               ; Trap to Debugger
.text:0000000078EF0A21
.text:0000000078EF0A21 loc_78EF0A21:                           ; CODE XREF: LdrpInitializeTls+5761E↑j
.text:0000000078EF0A21                 lea     r8, [rsp+88h+arg_0]
.text:0000000078EF0A29                 xor     r9d, r9d
.text:0000000078EF0A2C                 mov     rdx, rdi
.text:0000000078EF0A2F                 mov     rcx, rsi        ; Src
.text:0000000078EF0A32                 mov     [rsp+88h+var_68], rbp ; __int64
.text:0000000078EF0A37                 call    LdrpAllocateTlsEntry
.text:0000000078EF0A3C                 test    eax, eax
.text:0000000078EF0A3E                 js      loc_78E994CD
.text:0000000078EF0A44                 mov     [rdi+6Eh], r14w
.text:0000000078EF0A49                 jmp     loc_78E994A7
.text:0000000078EF0A4E ; ---------------------------------------------------------------------------
```

很好， 再看看 `LdrpHandleTlsData`

```asm
.text:0000000078E8D030 ; __unwind { // __C_specific_handler
...
.text:0000000078E8D07C                 jns     loc_78EF1CC6
.text:0000000078E8D082
.text:0000000078E8D082 loc_78E8D082:                           ; CODE XREF: LdrpHandleTlsData+64C9C↓j
.text:0000000078E8D082                 xor     eax, eax
.text:0000000078E8D084
...
.text:0000000078E8D096                 retn
.text:0000000078E8D096 ; ---------------------------------------------------------------------------
.text:0000000078E8D097                 align 20h
.text:0000000078E8D097 ; } // starts at 78E8D030
.text:0000000078E8D097 LdrpHandleTlsData endp
```

完了， 其向下跳转到下方的 `function chunk` 中了， 好的， 异常解析

```asm
.text:0000000078EF1CC6 loc_78EF1CC6:                           ; CODE XREF: LdrpHandleTlsData+4C↑j
.text:0000000078EF1CC6                                         ; DATA XREF: .pdata:0000000078F9E408↓o ...
...
.text:0000000078EF1DCF                 mov     rdx, rbx
.text:0000000078EF1DD2                 mov     rcx, [rsp+0D8h+Size] ; Src
.text:0000000078EF1DD7                 call    LdrpAllocateTlsEntry
```

这种情况自然也是可以解决的， 仔细观察可以发现这段跳转被 `.pdata` 段引用， 那么只需要判断其位置是否在`.pdata`段的异常表中， 并解析`RUNTIME_FUNCTION`就可以找到我们的`LdrpHandleTlsData` 函数了， `win7` 如此， 其它版本呢， 让我们下载一个 `win8`

```asm
.text:00000001800AC1FE ; START OF FUNCTION CHUNK FOR LdrpInitializeTls
.text:00000001800AC1FE
.text:00000001800AC1FE loc_1800AC1FE:                          ; CODE XREF: LdrpInitializeTls+A4↑j
.text:00000001800AC1FE                                         ; DATA XREF: .pdata:0000000180139860↓o
.text:00000001800AC1FE                 mov     [rsp+68h+var_38], rax
.text:00000001800AC203                 lea     rcx, [rdi+48h]
.text:00000001800AC207                 lea     rax, aDllWzHasTlsInf ; "DLL \"%wZ\" has TLS information at %p\n"
.text:00000001800AC20E                 mov     [rsp+68h+var_40], rcx
.text:00000001800AC213                 lea     r8, aLdrpinitialize_5 ; "LdrpInitializeTls"
.text:00000001800AC21A                 lea     rcx, aMinkernelNtdll_6 ; "minkernel\\ntdll\\ldrtls.c"
.text:00000001800AC221                 mov     r9d, 2
.text:00000001800AC227                 mov     edx, 242h
.text:00000001800AC22C                 mov     [rsp+68h+var_48], rax
.text:00000001800AC231                 call    LdrpLogDbgPrint
.text:00000001800AC236                 nop
.text:00000001800AC237                 jmp     loc_1800270B6
.text:00000001800AC23C ; ---------------------------------------------------------------------------
.text:00000001800AC23C
.text:00000001800AC23C loc_1800AC23C:                          ; CODE XREF: LdrpInitializeTls+DC↑j
...
```

又不一样了， 好在 `LdrpHandleTlsData` 是一样的， 不需要再处理了

这里可以发现其通过再一次跳转才会到我们的`LdrpAllocateTlsEntry`

```asm
.text:00000001800270B6 loc_1800270B6:                          ; CODE XREF: LdrpInitializeTls+8522B↓j
.text:00000001800270B6                 test    bpl, bpl
.text:00000001800270B9                 jnz     short loc_180027137
.text:00000001800270BB
.text:00000001800270BB loc_1800270BB:                          ; CODE XREF: LdrpInitializeTls+12C↓j
.text:00000001800270BB                 lea     r8, [rsp+68h+arg_0]
.text:00000001800270C0                 xor     r9d, r9d
.text:00000001800270C3                 mov     rdx, rdi
.text:00000001800270C6                 mov     rcx, rsi
.text:00000001800270C9                 mov     [rsp+68h+var_48], rbp
.text:00000001800270CE                 call    LdrpAllocateTlsEntry
.text:00000001800270D3                 test    eax, eax
.text:00000001800270D5                 js      short loc_18002709E
.text:00000001800270D7                 mov     eax, 0FFFFh
.text:00000001800270DC                 mov     [rdi+6Eh], ax
.text:00000001800270E0                 jmp     short loc_18002707F
```

再试几个版本， 均是这样， 那么基本可以用这种方式确定了

先查找 `LdrpInitializeTls` 字符串的引用， 找到 `LdrpLogDbgPrint` 函数后判断其下方指令是否为`nop; jmp rva`， 是就跟随过去寻找 `LdrpAllocateTlsEntry`, 找到后再去查找其引用， 找到在 `LdrpHandleTlsData` 的引用位置后， 判断该位置是否在`.pdata` 表中被记录， 如果被记录则反查到 `LdrpHandleTlsData`， 不然就向上找到填充的`0xCC`或`0x90`为止， 至此， 基本上将需要记录特征字符及偏移位置精简到几个判断的情况了

当然， 如果基于前人的工作， 我们只需要考虑`win11` 的情况就不必解析`.pdata` 段了， 这里就许愿 `windows` 后续的更新不会再有其它情况了 :)

而方法二呢， 我们是否可以实现一个 `LdrpHandleTlsData` 来完成工作呢，通过`hook` 线程启动来为每一个新线程做处理？这自然也是可行的，比如 [VistaImplicitTls](http://www.nynaeve.net/Code/VistaImplicitTls.cpp) 或 [MemoryModulePP](https://github.com/bb107/MemoryModulePP/tree/master)  但在我们的场景中， 稳定性和简洁性更为重要， 但如果只是为了在纯c环境中加载我们的的 `hello world`， 我们可以写一个简化的 `demo`, 参考于 [Manually-fixing-static-tls](https://www.unknowncheats.me/forum/general-programming-and-reversing/428195-manually-fixing-static-tls.html)

```rust
pub unsafe fn ldrp_handle_tls_data_demo(
    module_base: *const core::ffi::c_void,
    module_entry: *mut LDR_DATA_TABLE_ENTRY,
) {
    (*module_entry).DllBase = module_base as _;
    let mut size = 0;
    let tls_directory: *mut IMAGE_TLS_DIRECTORY = MRtlImageDirectoryEntryToData(
        module_base as _, 
        1,
        IMAGE_DIRECTORY_ENTRY_TLS,
        &mut size as *mut _ as _
    ) as _;
    let mut old = 0;
    MVirtualProtect(tls_directory as _, size_of::<IMAGE_TLS_DIRECTORY>(), PAGE_EXECUTE_READWRITE, &mut old as *mut _ as _);
    println!("[+] size is {:x}", size);
    if tls_directory.is_null() || size.eq(&0) {
        println!("[+] tls directory is null");
        return;
    }
    println!("[+] tls directory is not null, it is {:#?}", tls_directory as *const core::ffi::c_void);
    let LdrpTlsList: *const core::ffi::c_void = 0x00007ffa46110388usize as _;
    let LdrpLdrpTlsBitmap: *const core::ffi::c_void = 0x00007ffa461162a0usize as _;
    let index = MRtlFindClearBitsAndSet(
        LdrpLdrpTlsBitmap as _, 
        1, 
        0
    );

    (*tls_directory).AddressOfIndex = index as _;
    println!("[+] index is {:x}", index);
    let tls_entry: *mut TLS_ENTRY = MHeapAlloc(size_of::<TLS_ENTRY>(), 0) as _;
    println!("[+] index is {:x}", index);
    (*tls_entry).TlsDirectory = *tls_directory;
    (*tls_entry).ModuleTlsData = module_entry;
    (*tls_entry).TlsIndex = index as _;
    println!("[+] will insert tail list");
    // RtlInitializeListEntry(&mut (*tls_entry).TlsEntryLinks as *mut _ as _);
    InsertTailList(
        LdrpTlsList as _, 
        &mut (*tls_entry).TlsEntryLinks as *mut _ as _
    );
    println!("[+] insert tail list success");
    let mut thread_base_info: THREAD_BASIC_INFORMATION = core::mem::zeroed();
    let hthread = MGetCurrentThread();
    let mut dw: u32 = 0;
    MNtQueryInformationThread(
        hthread, 
        ThreadBasicInformation as _, 
        &mut thread_base_info as *mut _ as _, 
        size_of::<THREAD_BASIC_INFORMATION>() as _, 
        &mut dw as *mut _);
    MCloseHandle(hthread);
    println!("[+] query information thread");
    let teb1: *mut TEB2 = thread_base_info.TebBaseAddress as _;

    let new_tls: *mut *mut usize = MHeapAlloc((index + 1) as usize * size_of::<usize>(), 0) as _;

    if (*teb1).ThreadLocalStoragePointer.is_null() {
        memset(
            new_tls as _, 
            0, 
            index as usize * size_of::<usize>());
    } else {
        memcpy(
            new_tls as _, 
            (*teb1).ThreadLocalStoragePointer as _, 
            index as usize * size_of::<usize>());
    }
    println!("[+] thread lodal storage is {:x}", (*teb1).ThreadLocalStoragePointer as usize);

    (*teb1).ThreadLocalStoragePointer = new_tls as _;
    // (*teb1).ThreadLocalStoragePointer =  null_mut();
    let size = (*tls_directory).EndAddressOfRawData - (*tls_directory).StartAddressOfRawData;
    let tls_data = MHeapAlloc(size as _, 0);
    memcpy(
        tls_data as _, 
        (*tls_directory).StartAddressOfRawData as _, 
        size as _);
    *new_tls.offset(index as _) = tls_data as _;
}

```

当然， 这也与 `xbox loader` 的尝试类似

```rust
diff --git a/crates/loader/src/lib.rs b/crates/loader/src/lib.rs
index 97311d0..d66773d 100755
--- a/crates/loader/src/lib.rs
+++ b/crates/loader/src/lib.rs
@@ -180,34 +185,53 @@ unsafe fn reflective_loader_impl(context: LoaderContext) {
             .OptionalHeader
             .AddressOfEntryPoint as usize) as *const c_void;

-    let tls_directory = &ntheader_ref.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_TLS];
+    let tls_directory =
+        &ntheader_ref.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_TLS as usize];
+
+    // Grab the TLS data from the PE we're loading
+    let tls_data_addr =
+        baseptr.offset(tls_directory.VirtualAddress as isize) as *mut IMAGE_TLS_DIRECTORY64;
+
+    // TODO: Patch the module list
+    let tls_index = patch_module_list(
+        context.image_name,
+        baseptr,
+        imagesize,
+        context.fns.get_module_handle_fn,
+        tls_data_addr,
+        context.fns.virtual_protect,
+        entrypoint,
+    );
+
     if tls_directory.Size > 0 {
         // Grab the TLS data from the PE we're loading
         let tls_data_addr =
             baseptr.offset(tls_directory.VirtualAddress as isize) as *mut IMAGE_TLS_DIRECTORY64;

-        let tls_data: &IMAGE_TLS_DIRECTORY64 = unsafe { core::mem::transmute(tls_data_addr) };
+        let tls_data: &mut IMAGE_TLS_DIRECTORY64 = unsafe { core::mem::transmute(tls_data_addr) };

         // Grab the TLS start from the TEB
         let tls_start: *mut *mut c_void;
         unsafe { core::arch::asm!("mov {}, gs:[0x58]", out(reg) tls_start) }

-        let tls_index = unsafe { *(tls_data.AddressOfIndex as *const u32) };
-
         let tls_slot = tls_start.offset(tls_index as isize);
         let raw_data_size = tls_data.EndAddressOfRawData - tls_data.StartAddressOfRawData;
-        *tls_slot = (context.fns.virtual_alloc)(
+        let tls_data_addr = (context.fns.virtual_alloc)(
             ptr::null(),
-            raw_data_size as usize,
+            raw_data_size as usize, // + tls_data.SizeOfZeroFill as usize,
             MEM_COMMIT,
             PAGE_READWRITE,
         );

-        // if !tls_start.is_null() {
-        //     // Zero out this memory
-        //     let tls_slots: &mut [u64] = unsafe { core::slice::from_raw_parts_mut(tls_start, 64) };
-        //     tls_slots.iter_mut().for_each(|slot| *slot = 0);
-        // }
+        core::ptr::copy_nonoverlapping(
+            tls_data.StartAddressOfRawData as *const _,
+            tls_data_addr,
+            raw_data_size as usize,
+        );
+
+        // Update the TLS index
+        core::ptr::write(tls_data.AddressOfIndex as *mut u32, tls_index);
+        *tls_slot = tls_data_addr;

         let mut callbacks_addr = tls_data.AddressOfCallBacks as *const *const c_void;
         if !callbacks_addr.is_null() {
```


### 闲言片语

由于测试性代码和工程化的差距还有很多距离， 而本文并非为了说明工程化过程， 因此本文只讨论了windows11版本且程序在64位的情况， 32位就会略有不同

如果能将文章看到这里， 希望各位都有所收获， 那么剩下的内容就留给各位自己来完成啦

当然， 由于本人才疏学浅， 因此如有错误的地方欢迎各位与我讨论， 让我们一起追根溯源 :）


## 实现

在本文发布时，IoM v0.0.4也已经发布, 本文的相关成果将随着malefic-mutant一同发布。 

可以使用malefic-mutant 将带有TLS的PE文件转为shellcode， 该shellcode能被任意shellcode loader加载。 

```
malefic-mutant build srdi -i malefic.exe
```
![](assets/Pasted%20image%2020241227174327.png)

### References

非常感谢下面几篇文章为本文和解决`TLS`问题所给予的非常大的帮助:)

尤其感谢 `Ken Johnson(Skywing)` 对 `windows TLS` 机制的详细分析与解释， 没有他的系列文章， 本文的篇幅和所要花费的时间将远超预期 :)

[http://www.nynaeve.net/?p=180](http://www.nynaeve.net/?p=180)
[https://landaire.net/reflective-pe-loader-for-xbox/](https://landaire.net/reflective-pe-loader-for-xbox/)
[Thread_local_Storage](https://en.wikipedia.org/wiki/Thread-local_storage)
[16-std库(五)线程管理](https://github.com/Warrenren/inside-rust-std-library/blob/main/16-std%E5%BA%93(%E4%BA%94)%E7%BA%BF%E7%A8%8B%E7%AE%A1%E7%90%86.md)
[static-tls-storage](https://www.unknowncheats.me/forum/general-programming-and-reversing/274023-static-tls-storage.html)
[Manually-fixing-static-tls](https://www.unknowncheats.me/forum/general-programming-and-reversing/428195-manually-fixing-static-tls.html)
