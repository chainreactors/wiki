---
title: 复测问题
description: 复测日期：2026-04-30
edition: community
generated: false
source: imp:mutant/retest-issues.md
---

# Mutant 复测问题分析

复测日期：2026-04-30

范围：`docs/mutant/` 下描述的 `transform`、`relink`、`mutate`、`pe-modify`、`lnk`、`sigforge`、`obfuscate`，以及基础 `prelude`/`whoami` 可用性验证。

复测报告：`C:\Users\John\AppData\Local\Temp\mutant-full-retest-2713b483c35e4fccbe314140e9ecc259\report.tsv`

## 总体结论

核心 mutant 工具链的基本功能可用，且大部分项目已做真实生成物验证，不只是编译验证：

- `malefic-mutant` 自身测试通过。
- `mutate` 批量输出可生成不同 hash，PE relink 变体可执行。
- `relink` 随机输出不同，固定 seed 输出一致。
- `lnk exec` 可生成并通过 `Start-Process` 执行 marker 测试。
- `sigforge` 在使用带嵌入签名的 `explorer.exe` 作为样本时，check/extract/copy/inject/remove 流程通过。
- `whoami` 模块直测可真实返回当前用户。

本轮只直接修复明显文档错误；疑似代码或测试问题未在未经确认的情况下修改。

## 已修复的文档错误

### `mutate` 单文件输出语义已统一

现象：

```bash
malefic-mutant tool mutate -i payload.bin -f lnk --lnk-method powershell -o out
```

历史版本中这类示例会误导用户把 `-o` 当作输出目录，且当时 `-o` 还被用作格式参数的兼容别名。

当前语义：

- `-f, --format` 表示输出格式（`shellcode` / `pe` / `lnk` / `proxydll`）。
- `-o, --output` 表示单个输出文件路径。
- `--out-dir` 表示批量输出目录。

单文件输出：

```bash
malefic-mutant tool mutate -i payload.bin -f lnk --lnk-method powershell -o out.lnk
```

批量输出：

```bash
malefic-mutant tool mutate -i payload.bin -f lnk --lnk-method powershell -n 5 --out-dir out
```

影响：

这是已修复的 CLI 语义问题。当前 `-o` 不再表示格式，也不用于输出目录。

### `lnk exec` 示例缺少 `cmd.exe /c`

现象：

默认 target 是 `C:\Windows\System32\cmd.exe`，原示例直接传入：

```bash
malefic-mutant tool lnk exec -c "whoami > %TEMP%\out.txt" -o evil.lnk
```

实际执行时，`cmd.exe` 需要 `/c` 才会执行参数并退出。

可能原因：

LNK builder 只负责把 target 和 arguments 写入快捷方式，不会自动推断 shell 语义。对 `cmd.exe` 来说，命令字符串必须显式带 `/c`。

修正：

```bash
malefic-mutant tool lnk exec -c "/c whoami > %TEMP%\out.txt" -o evil.lnk
```

影响：

这是文档示例错误。修正后 LNK 真实执行测试通过。

## 样本选择导致的失败

### `sigforge` 使用 `notepad.exe` 作为 signed sample 失败

现象：

复测中 `sigforge check signed notepad` 返回 `not signed`，随后的 extract/copy/inject/remove 流程失败。

可能原因：

当前环境中的 `notepad.exe` 没有可被工具读取的嵌入式 PE certificate table。Windows 系统文件可能存在目录签名、商店包替换、catalog signing 或不同文件布局，不能假设所有系统 EXE 都带可提取的 Authenticode 证书表。

验证：

换用 `C:\Windows\explorer.exe` 后，同一组 `sigforge` 流程通过，签名大小为 `38360` 字节。

结论：

这是测试样本选择问题，不是已确认的 `sigforge` 功能 bug。

建议：

- 文档或自动化测试中不要固定使用 `notepad.exe` 作为签名样本。
- 测试前先运行 `sigforge check`，确认样本存在嵌入签名。
- Windows 环境下优先选用已验证带 PE certificate table 的样本，如本机的 `explorer.exe`。

## 疑似代码或测试问题

### `malefic-autorun` 真实模块测试缺少 Tokio reactor

现象：

```text
there is no reactor running, must be called from the context of a Tokio 1.x runtime
```

触发命令：

```bash
cargo test -p malefic-autorun autorun_executes_real_pwd_module -- --nocapture
```

可能原因：

`malefic-crates/autorun/src/autorun.rs` 的测试使用 `futures::executor::block_on` 执行真实模块路径，但该路径最终会进入 runtime bridge，并调用依赖 Tokio reactor 的 `spawn_blocking`。`futures::executor::block_on` 只轮询 future，不创建 Tokio runtime，因此运行到 `spawn_blocking` 时崩溃。

影响：

这更像测试运行时搭建问题，也可能暴露 autorun API 对调用方 runtime 的隐式依赖。当前不能据此判断真实 autorun 功能不可用。

建议修复方向：

- 通过统一 runtime gateway 启动测试，而不是直接依赖 `tokio::test`。
- 或在测试里显式创建项目统一 runtime 后调用 `block_on`。
- 避免测试代码直接依赖具体 async runtime crate。

状态：

已修复。`malefic-gateway` 新增 `async_runtime` 统一入口，`malefic-common` 的 runtime API 改为兼容转发到 gateway，`malefic-features` 的 runtime feature 同步打开 gateway/common 两侧 runtime；`malefic-autorun` 正式入口和测试入口均改为通过 `malefic_gateway::async_runtime::block_on` 执行，不再直接依赖 Tokio。验证命令 `cargo test -p malefic-autorun -- --nocapture` 通过。

### `malefic-modules` 宽泛测试命令编译失败

现象：

目标 whoami 测试通过：

```bash
cargo test -p malefic-modules --test test_module_direct --features whoami whoami_direct_module -- --nocapture
```

但宽泛命令失败：

```bash
cargo test -p malefic-modules --features whoami whoami_direct_module -- --nocapture
```

主要错误包括：

- `test_execute_harness.rs` 中 `//!` inner doc comment 出现在 `mod common;` 之后，违反 Rust 语法位置要求。
- 多个未跟踪测试文件引用 `malefic_runtime` / `malefic_scheduler`，但 `malefic-modules` 的 dev-dependencies 中没有声明对应 crate。
- 部分测试使用 `Whoami::new()`、`Upload::new()` 等 trait 方法，但没有把提供 `new` 的 trait 引入作用域。
- `test_shellcode_direct.rs` 引用 direct loader，但 loader 未通过 feature/export 暴露该模块。

可能原因：

测试目录中存在未完成或未纳入依赖同步的实验性测试文件。宽泛 `cargo test` 会编译所有 integration tests，因此这些文件会阻断整个 package 的测试。

影响：

这不影响已验证的 whoami 直测结论，但会影响 `malefic-modules` package 的整体 CI 可用性。

建议修复方向：

- 如果这些测试应保留，补齐 `dev-dependencies`、trait import，并修复 doc comment 位置。
- 如果这些测试只是本地实验，应移出 package 的 `tests/` 目录或加条件编译隔离。
- CI 中可先使用精确 `--test` 目标验证已稳定测试，但这不是长期修复。

状态：

已修复/隔离。已补齐 `malefic-runtime`、`malefic-scheduler` dev-dependencies，修复 doc comment 位置；RT ABI 实验测试隔离到 `as_module_dll` feature；direct loader 测试隔离到 `loader_direct_test` feature，并在 `malefic-loader` 中增加非默认 `Win_Inject_Direct` feature。验证命令 `cargo test -p malefic-modules --features whoami whoami_direct_module -- --nocapture` 通过。

### `generate prelude -> build prelude executable` 超时

现象：

`generate prelude` 本身可生成 `spite` 文件并更新 feature 配置，但继续完整构建 `malefic-prelude` 时曾在限定时间内超时。

可能原因：

- 首次完整构建依赖链较重，超时时间不足。
- 当前工作区存在大量未提交和未跟踪改动，可能影响依赖、feature 或 linker 行为。
- `malefic-win-kit`、资源文件或目标 toolchain 状态可能导致构建时间异常增长。

影响：

目前只能说明完整 prelude 构建未在当前时间窗口内完成，不能直接判定为代码 bug。

建议修复方向：

- 在干净工作区或隔离临时 worktree 中重跑。
- 增加构建超时时间，并记录最后一个 rustc/link 阶段。
- 若稳定复现，再定位具体 crate、feature 或 linker 步骤。

状态：

未修复，需进一步确认。

## 语义风险

### `sigforge check` 的 "signed" 语义可能过宽

现象：

本轮 `carbon-copy --cert-file` 使用本地 DER 文件注入后，工具层面可显示为 signed。

可能原因：

当前 `sigforge check` 检查 PE certificate table 是否存在，而不是验证 Authenticode 签名链、摘要匹配、证书可信根或时间戳有效性。

影响：

用户可能误以为 "signed" 等同于 Windows 信任链验证通过。实际含义应区分：

- PE 结构上存在 certificate table。
- Authenticode 摘要匹配。
- 证书链可信。
- Windows 策略下可被信任。

建议：

- 文档中明确 `check` 的验证边界。
- 如果目标是信任链验证，应新增单独命令或参数，例如 `sigforge verify-authenticode`，调用 Windows trust API 或等价实现。

状态：

已收紧语义。CLI 输出和文档已改为 “has an embedded Authenticode certificate table”，并提示这是结构检查，不是 trust-chain verification。验证命令 `target\debug\malefic-mutant.exe tool sigforge check -i C:\Windows\explorer.exe` 输出了新的语义说明。

## 后续建议

建议优先级如下：

1. 在干净 worktree 中重跑完整 `prelude` 构建，排除当前脏工作区干扰。
2. 如需验证 RT ABI 实验路径，显式使用 `as_module_dll` feature 单独跑相关测试。
3. 如需验证 direct loader 实验路径，显式使用 `loader_direct_test` feature 单独跑 `test_shellcode_direct`。
4. 如目标是信任链验证，新增单独的 Authenticode verification 命令，不复用当前结构检查。
