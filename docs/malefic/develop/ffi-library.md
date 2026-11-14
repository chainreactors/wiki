---
title: ffi_library 宏
description: '通过 #[ffilibrary] proc macro，任何提供 .a（静态）或 .dll/.so（动态）的 C 库都可以快速接入，自动生成
  static/dynamic 双路径绑定。'
edition: community
generated: false
source: imp:develop/ffi-library.md
---

# ffi_library 宏

通过 `#[ffi_library]` proc macro，任何提供 `.a`（静态）或 `.dll`/`.so`（动态）的 C 库都可以快速接入，自动生成 static/dynamic 双路径绑定。

## 概述

```
第三方库 (.h + .a/.dll/.so)
        │
        ▼
  build.rs ── bindgen ──→ binding_raw.rs
        │
        ├── syn 后处理
        ▼
  $OUT_DIR/xxx_ffi_generated.rs
    ├── #[repr(C)] struct 定义
    └── #[ffi_library(...)] extern "C" { ... }
        │
        ▼
  lib.rs ── include!(...) ── safe wrapper functions
```

**核心思路** ：`.h` 是唯一数据源。更新第三方库时只需替换 `.h` + `.a`/`.dll`，rebuild 即可自动适配。

## 快速开始：接入一个新的 C 库

以接入一个名为 `libfoo` 的库为例。

### 准备文件

将第三方库文件放入 `resources/`：

```
resources/
├── libfoo_windows_amd64.h      # C 头文件
├── libfoo_windows_amd64.a      # 静态库
├── libfoo_windows_amd64.dll    # 动态库（可选）
├── libfoo_linux_amd64.h        # 其他平台（可选）
└── libfoo_linux_amd64.a
```

### 创建 crate

```
malefic-crates/foo/
├── Cargo.toml
├── build.rs
└── src/
    └── lib.rs
```

#### Cargo.toml

```toml
[package]
name = "malefic-foo"
version = "0.1.0"
edition = "2021"

[features]
default = ["foo_static"]
foo = []
foo_static = ["foo"]
foo_dynamic = ["foo"]

[dependencies]
malefic-macro = { path = "../macro", default-features = false }

[build-dependencies]
bindgen = { workspace = true }
syn = { workspace = true, features = ["full"] }
quote = { workspace = true }
```

#### build.rs

```rust
use std::{env, fs, path::PathBuf};

// ── 配置：按你的库修改这些常量 ──
const FFI_NAME: &str = "Foo";              // 生成 FooFfi struct + foo_ffi() 函数
const INIT_FUNC: &str = "FooInit";         // DLL 初始化函数（返回 int，0=成功）
const FEATURE_STATIC: &str = "foo_static";
const FEATURE_DYNAMIC: &str = "foo_dynamic";

/// 可选函数：DLL 中不存在也不报错
const OPTIONAL_FUNCS: &[&str] = &[];

/// 需要跳过的函数（如 Go CGo 样板）
const SKIP_FUNCS: &[&str] = &[];

/// 需要跳过的类型（如 Go CGo 样板）
const SKIP_TYPES: &[&str] = &[];

/// allowlist 正则：只提取匹配的函数
const ALLOWLIST_FUNCTION: &str = "FooInit|Foo.*";

/// allowlist 正则：只提取匹配的类型
const ALLOWLIST_TYPE: &str = ".*_return|Foo.*";

/// 静态库文件名模板（{os} 和 {arch} 会被替换）
const STATIC_LIB_PATTERN: &str = "libfoo_{os}_{arch}.a";

/// 头文件名模板
const HEADER_PATTERN: &str = "libfoo_{os}_{arch}.h";

/// 动态库名模板（运行时 LoadLibrary/dlopen 用）
const DLL_PATTERN: &str = "libfoo_{os}_{arch}";

fn main() {
    let features: Vec<String> = env::vars()
        .filter(|(k, _)| k.starts_with("CARGO_FEATURE_"))
        .map(|(k, _)| k)
        .collect();

    let (target_os, target_arch) = get_target();

    if features.iter().any(|f| f == "CARGO_FEATURE_FOO_STATIC") {
        link_static_lib(&target_os, &target_arch);
    }

    generate_ffi_bindings(&target_os, &target_arch);
}

fn get_target() -> (String, String) {
    let os = match env::var("CARGO_CFG_TARGET_OS").unwrap().as_str() {
        "macos" => "darwin".to_string(),
        other => other.to_string(),
    };
    let arch = match env::var("CARGO_CFG_TARGET_ARCH").unwrap().as_str() {
        "x86_64" => "amd64".to_string(),
        "aarch64" => "arm64".to_string(),
        other => other.to_string(),
    };
    (os, arch)
}

fn find_resources_dir() -> PathBuf {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    manifest_dir
        .parent()
        .and_then(|p| p.parent())
        .map(|p| p.join("resources"))
        .filter(|p| p.exists())
        .expect("resources directory not found")
}

fn resolve_pattern(pattern: &str, os: &str, arch: &str) -> String {
    pattern.replace("{os}", os).replace("{arch}", arch)
}

fn link_static_lib(target_os: &str, target_arch: &str) {
    let resources = find_resources_dir();
    let lib_name = resolve_pattern(STATIC_LIB_PATTERN, target_os, target_arch);
    let lib_path = resources.join(&lib_name);

    if !lib_path.exists() {
        panic!("Static library not found: {}", lib_path.display());
    }

    println!("cargo:rustc-link-search=native={}", resources.display());
    let link_name = lib_name
        .strip_prefix("lib")
        .and_then(|s| s.strip_suffix(".a"))
        .unwrap_or(&lib_name);
    println!("cargo:rustc-link-lib=static={}", link_name);

    // 按需添加系统库依赖
    if target_os == "windows" {
        println!("cargo:rustc-link-lib=dylib=ws2_32");
        println!("cargo:rustc-link-lib=dylib=userenv");
    }

    println!("cargo:rerun-if-changed={}", lib_path.display());
}

fn generate_ffi_bindings(target_os: &str, target_arch: &str) {
    let resources = find_resources_dir();

    // 查找 .h 文件
    let header_name = resolve_pattern(HEADER_PATTERN, target_os, target_arch);
    let header_path = resources.join(&header_name);
    let header_path = if header_path.exists() {
        header_path
    } else {
        // fallback：任意平台的 .h（函数签名通常相同）
        let fallback = resolve_pattern(HEADER_PATTERN, "windows", "amd64");
        resources.join(&fallback)
    };

    if !header_path.exists() {
        panic!("Header file not found: {}", header_path.display());
    }
    println!("cargo:rerun-if-changed={}", header_path.display());

    // 如果是 Go CGo 头文件，清理样板代码
    let raw_header = fs::read_to_string(&header_path).unwrap();
    let cleaned = clean_cgo_header(&raw_header);

    // bindgen 生成 raw Rust 绑定
    let bindings = bindgen::Builder::default()
        .header_contents("ffi_api.h", &cleaned)
        .allowlist_function(ALLOWLIST_FUNCTION)
        .allowlist_type(ALLOWLIST_TYPE)
        .derive_copy(true)
        .generate()
        .expect("bindgen failed");

    let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());
    let raw_path = out_dir.join("binding_raw.rs");
    bindings.write_to_file(&raw_path).unwrap();

    // 后处理：生成 #[ffi_library] 宏调用
    let dll_ext = if target_os == "windows" { "dll" } else { "so" };
    let dll_name = format!(
        "{}.{}",
        resolve_pattern(DLL_PATTERN, target_os, target_arch),
        dll_ext
    );
    postprocess_binding(&raw_path, &out_dir, &dll_name);
}

/// 清理 Go CGo 头文件的样板代码，提取 extern "C" 块
/// 如果不是 CGo 头文件（没有 extern "C" 块），原样返回
fn clean_cgo_header(raw: &str) -> String {
    // 检查是否有 extern "C" 块
    if !raw.contains("extern \"C\" {") {
        return raw.to_string();
    }

    let mut out = String::from("#include <stdint.h>\n\n");
    let mut in_extern_c = false;
    let mut depth = 0;

    for line in raw.lines() {
        let trimmed = line.trim();

        if trimmed == "extern \"C\" {" {
            in_extern_c = true;
            depth = 1;
            continue;
        }

        if !in_extern_c {
            continue;
        }

        for ch in trimmed.chars() {
            match ch {
                '{' => depth += 1,
                '}' => depth -= 1,
                _ => {}
            }
        }

        if depth <= 0 {
            break;
        }

        let cleaned_line = trimmed
            .replace("__declspec(dllexport) ", "")
            .replace("__declspec(dllimport) ", "");

        if cleaned_line.starts_with("#ifdef")
            || cleaned_line.starts_with("#endif")
            || cleaned_line.starts_with("#ifndef")
        {
            continue;
        }

        out.push_str(&cleaned_line);
        out.push('\n');
    }

    out
}

fn postprocess_binding(binding_path: &std::path::Path, out_dir: &std::path::Path, dll_name: &str) {
    let src = fs::read_to_string(binding_path).unwrap();
    let file = syn::parse_file(&src).unwrap();

    let mut out = String::from(
        "// Auto-generated from header by build.rs + bindgen — DO NOT EDIT\n\n",
    );

    // 提取 struct 定义（跳过 SKIP_TYPES）
    for item in &file.items {
        if let syn::Item::Struct(s) = item {
            let name = s.ident.to_string();
            if SKIP_TYPES.iter().any(|t| *t == name) {
                continue;
            }
            out.push_str(&emit_struct(s));
            out.push_str("\n\n");
        }
    }

    // 提取 extern "C" 函数 → 生成 #[ffi_library] 块
    let mut fn_decls: Vec<String> = Vec::new();
    for item in &file.items {
        if let syn::Item::ForeignMod(fm) = item {
            for fi in &fm.items {
                if let syn::ForeignItem::Fn(f) = fi {
                    let name = f.sig.ident.to_string();
                    if SKIP_FUNCS.iter().any(|s| *s == name) {
                        continue;
                    }
                    if name == INIT_FUNC {
                        continue;
                    }
                    let optional_attr = if OPTIONAL_FUNCS.contains(&&*name) {
                        "    #[optional]\n"
                    } else {
                        ""
                    };
                    let sig_str = format_fn_sig(&f.sig);
                    fn_decls.push(format!("{}    {};", optional_attr, sig_str));
                }
            }
        }
    }

    out.push_str(&format!(
        r#"#[ffi_library(
    name = "{}",
    dll = "{}",
    init = "{}",
    feature_static = "{}",
    feature_dynamic = "{}",
)]
extern "C" {{
{}
}}
"#,
        FFI_NAME,
        dll_name,
        INIT_FUNC,
        FEATURE_STATIC,
        FEATURE_DYNAMIC,
        fn_decls.join("\n"),
    ));

    fs::write(out_dir.join("ffi_generated.rs"), &out).unwrap();
}

// ── 辅助函数 ────────────────────────────────────────────────────────────────

fn emit_struct(s: &syn::ItemStruct) -> String {
    let name = &s.ident;
    let fields: Vec<String> = if let syn::Fields::Named(ref named) = s.fields {
        named.named.iter().map(|f| {
            let field_name = f.ident.as_ref().unwrap();
            let ty = normalize_type(&f.ty);
            format!("    pub {}: {}", field_name, ty)
        }).collect()
    } else {
        Vec::new()
    };
    format!(
        "#[repr(C)]\n#[derive(Copy, Clone)]\npub struct {} {{\n{}\n}}",
        name, fields.join(",\n")
    )
}

fn format_fn_sig(sig: &syn::Signature) -> String {
    let name = &sig.ident;
    let params: Vec<String> = sig.inputs.iter().filter_map(|arg| {
        if let syn::FnArg::Typed(pat) = arg {
            let pname = match pat.pat.as_ref() {
                syn::Pat::Ident(pi) => pi.ident.to_string(),
                _ => "_".to_string(),
            };
            Some(format!("{}: {}", pname, normalize_type(&pat.ty)))
        } else {
            None
        }
    }).collect();
    let ret = match &sig.output {
        syn::ReturnType::Default => String::new(),
        syn::ReturnType::Type(_, ty) => format!(" -> {}", normalize_type(ty)),
    };
    format!("fn {}({}){}", name, params.join(", "), ret)
}

fn normalize_type(ty: &syn::Type) -> String {
    let raw = quote::quote!(#ty).to_string();
    raw.replace("* mut ::std::os::raw::c_char", "*mut c_char")
       .replace("* const ::std::os::raw::c_char", "*const c_char")
       .replace("* mut ::std::os::raw::c_void", "*mut c_void")
       .replace("* const ::std::os::raw::c_void", "*const c_void")
       .replace("* mut :: std :: os :: raw :: c_char", "*mut c_char")
       .replace("* const :: std :: os :: raw :: c_char", "*const c_char")
       .replace("* mut :: std :: os :: raw :: c_void", "*mut c_void")
       .replace("* const :: std :: os :: raw :: c_void", "*const c_void")
       .replace("::std::os::raw::c_int", "c_int")
       .replace(":: std :: os :: raw :: c_int", "c_int")
       .replace("::std::os::raw::c_uint", "c_uint")
       .replace(":: std :: os :: raw :: c_uint", "c_uint")
       .replace("::std::os::raw::c_char", "c_char")
       .replace(":: std :: os :: raw :: c_char", "c_char")
       .replace("::std::os::raw::c_void", "c_void")
       .replace(":: std :: os :: raw :: c_void", "c_void")
       .replace(" ,", ",")
}
```

#### src/lib.rs

```rust
use std::os::raw::{c_char, c_int, c_void};
use malefic_macro::ffi_library;

// 从 .h 自动生成的 struct + extern "C" 块
include!(concat!(env!("OUT_DIR"), "/ffi_generated.rs"));

// ── Safe wrapper functions ──

fn get_ffi() -> Result<&'static FooFfi, String> {
    foo_ffi()  // 宏生成的入口函数
}

pub fn foo_call(arg: &str) -> Result<String, String> {
    let funcs = get_ffi()?;
    unsafe {
        let c_arg = std::ffi::CString::new(arg).map_err(|e| e.to_string())?;
        let result = (funcs.foo_call.unwrap())(c_arg.into_raw());
        // 按你的 API 处理返回值...
        Ok(format!("result: {}", result.r0))
    }
}
```

### 验证

```bash
# 静态链接模式
cargo check -p malefic-foo --features foo_static --no-default-features

# 动态加载模式
cargo check -p malefic-foo --features foo_dynamic --no-default-features
```

## `#[ffi_library]` 宏参数

| 参数 | 必需 | 说明 |
|------|------|------|
| `name` | 是 | 生成的 struct 和函数前缀。`name = "Foo"` → `FooFfi` struct + `foo_ffi()` 函数 |
| `dll` | 是 | 动态加载时的库文件名（传给 `LoadLibraryA`/`dlopen`） |
| `init` | 否 | DLL 初始化函数名（`extern "C" fn() -> c_int`，返回 0 表示成功） |
| `feature_static` | 是 | 控制静态链接的 Cargo feature 名 |
| `feature_dynamic` | 是 | 控制动态加载的 Cargo feature 名 |

## 函数属性

| 属性 | 说明 |
|------|------|
| `#[optional]` | 标记为可选函数。动态模式下 `GetProcAddress`/`dlsym` 失败不报错，字段设为 `None` |

## 生成产物

对于 `name = "Foo"` 和以下声明：

```rust
#[ffi_library(name = "Foo", dll = "libfoo.dll", init = "FooInit",
              feature_static = "foo_static", feature_dynamic = "foo_dynamic")]
extern "C" {
    fn FooCall(arg: *mut c_char) -> FooCall_return;
    #[optional]
    fn FooOptional(x: c_int) -> c_int;
}
```

宏展开生成：

| 产物 | 说明 |
|------|------|
| `FooFfi` struct | 函数指针表，每个函数 → `Option<unsafe extern "C" fn(...)>` 字段 |
| `__foo_ffi_static` mod | `#[cfg(feature = "foo_static")]` — 直接 `extern "C"` 链接 |
| `__foo_ffi_dynamic` mod | `#[cfg(feature = "foo_dynamic")]` — `LoadLibraryA`/`dlopen` + `GetProcAddress`/`dlsym` |
| `foo_ffi()` 函数 | 统一入口，返回 `Result<&'static FooFfi, String>` |
| `FOO_FFI_HEADER` const | C 头文件内容（字符串常量） |

字段命名规则：函数名 PascalCase → snake_case（`FooCall` → `foo_call`）。

## Go CGo 库的特殊处理

Go CGo 生成的 `.h` 包含大量样板代码（GoInt, GoString 等类型定义），需要在 `build.rs` 中跳过。`clean_cgo_header()` 函数自动处理：

1. 跳过 `extern "C" {` 之前的所有 Go 样板
2. 去除 `__declspec(dllexport)` 修饰
3. 只保留实际的函数声明和 struct 定义

配置 `SKIP_TYPES` 和 `SKIP_FUNCS` 过滤 Go 内部类型：

```rust
const SKIP_TYPES: &[&str] = &[
    "GoInt8", "GoUint8", "GoInt16", "GoUint16", "GoInt32", "GoUint32",
    "GoInt64", "GoUint64", "GoInt", "GoUint", "GoUintptr",
    "GoFloat32", "GoFloat64", "GoComplex64", "GoComplex128",
    "GoString", "GoMap", "GoChan", "GoInterface", "GoSlice",
    "_GoString_",
];
const SKIP_FUNCS: &[&str] = &["_GoStringLen", "_GoStringPtr"];
```

## 纯 C 库（非 CGo）

如果 `.h` 是标准 C 头文件（无 Go 样板），`clean_cgo_header()` 会检测到没有 `extern "C"` 块并原样返回。无需额外配置。

对于标准 C 库，`SKIP_TYPES` 和 `SKIP_FUNCS` 留空即可。

## 已接入的库

| 库 | Crate | Feature | 说明 |
|----|-------|---------|------|
| librem (Go) | `malefic-rem` | `rem_static` / `rem_dynamic` | REM 远程内存通道 |

## 完整示例：malefic-rem

参考实现：`malefic-crates/rem/`

```
malefic-crates/rem/
├── Cargo.toml          # features: rem_static, rem_dynamic
├── build.rs            # bindgen + postprocess
└── src/
    └── lib.rs          # include!() + safe wrappers
```

头文件来源：`resources/librem_community_windows_amd64.h`（Go CGo 生成）

```bash
# 构建验证
cargo check -p malefic-rem --features rem_static
cargo check -p malefic-rem --features rem_dynamic
cargo zigbuild -p malefic --target x86_64-pc-windows-gnu
```
