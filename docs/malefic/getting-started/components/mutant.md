---
title: Mutant
description: malefic-mutant is the workspace tool for configuration generation, Cargo
  build orchestration, and binary post-processing. In the IoM ecosystem, it is the
  equ...
edition: community
generated: false
source: imp:getting-started/components/mutant.md
---

# Mutant

`malefic-mutant` is the workspace tool for configuration generation, Cargo build orchestration, and binary post-processing. In the IoM ecosystem, it is the equivalent of MSF venom: it bridges high-level YAML configuration to compiled artifacts without manual intervention.

This page covers Mutant's design philosophy, architecture, and command model. Detailed usage for each subsystem lives in dedicated subpages:

- **Generate & build** — per-component build flows and `implant.yaml` field reference (see index below)
- **Binary tools** — post-build manipulation tools (encode, patch, sigforge, etc.) (see index below)

## What Mutant Does

Mutant handles the entire lifecycle from configuration to binary:

1. **Configure** — parse `implant.yaml` and validate against `config_lint.json`
2. **Generate** — write generated code, update `Cargo.toml` features, and encrypt the runtime config blob
3. **Build** — invoke Cargo with the correct toolchain, target triple, and OLLVM settings
4. **Transform** — post-process the binary (strip paths, patch config, sign, encode, etc.)

| Phase | Command | Output |
|-------|---------|--------|
| Generate | `malefic-mutant generate beacon` | Rust source + `Cargo.toml` features + encrypted config blob |
| Build | `malefic-mutant build malefic` | Compiled binary or shared library |
| Transform | `malefic-mutant tool patch` | Modified binary with new runtime config |

## Design Philosophy

### Schema-Driven Feature Resolution

Instead of hardcoding feature mappings, Mutant uses `config_lint.json` (a JSON Schema with Cargo-specific annotations) to drive feature selection. The resolver walks the YAML tree and applies annotations:

- `bool_flag` — when `true`, add listed features
- `enum_map` — map string values to features (`*` as wildcard)
- `non_empty` — when string is non-empty, add listed features
- `presence_fields` / `default_when_absent` — for array items, detect field presence

After resolution, Mutant validates every feature against the actual `[features]` table in `malefic/Cargo.toml`. Unknown features emit warnings. This keeps the feature system declarative and self-documenting.

### Code Generation Over Template Substitution

Mutant does not use string templates. Instead, it writes structured Rust source (e.g., `blob_obf.rs`, `malefic-proxydll/src/lib.rs`) and modifies `Cargo.toml` via `toml_edit`. This means generated code is always syntactically valid Rust and type-checked by the compiler.

### Compile-Time Configuration

Sensitive configuration (targets, keys, cron intervals) is encrypted into a runtime config blob at build time. The blob is written to `malefic-crates/config/src/generated/blob_obf.rs` and compiled into the binary. There is no external config file at runtime — everything needed to connect back is inside the binary.

## Command Model

```text
malefic-mutant
├── generate     — from YAML to generated code and feature flags
│   ├── beacon
│   ├── bind
│   ├── prelude
│   ├── modules
│   ├── pulse
│   └── loader proxydll
├── build        — from generated config to compiled binary
│   ├── malefic
│   ├── prelude
│   ├── modules
│   ├── 3rd
│   ├── pulse
│   ├── proxy-dll
│   └── reactor
└── tool         — post-build binary manipulation
    ├── srdi
    ├── strip
    ├── objcopy
    ├── sigforge
    ├── patch
    ├── obf
    ├── encode
    ├── entropy
    ├── watermark
    ├── binder
    └── icon
```

### Global Options

Generation:

```bash
malefic-mutant generate \
  -c implant.yaml                 # config file (default: implant.yaml)
  -E community                    # edition: community / professional
  -s true                         # source / prebuild runtime
  beacon
```

Build:

```bash
malefic-mutant build \
  -c implant.yaml                 # config file
  -t x86_64-pc-windows-gnu       # target triple
  --lib                            # build as shared library
  malefic
```

## Generate & Build Index

| Command | Package | Kind | Detail |
|---------|---------|------|--------|
| `generate beacon` / `build malefic` | `malefic` | bin (default) / lib (`--lib`) | [malefic build](/malefic/build/malefic/) |
| `generate bind` / `build malefic` | `malefic` | same as beacon, `mod=bind` | [malefic build](/malefic/build/malefic/) |
| `generate prelude` / `build prelude` | `malefic-prelude` | bin | [prelude build](/malefic/build/prelude/) |
| `generate pulse` / `build pulse` | `malefic-pulse` | bin / lib / shellcode (`--shellcode`) | [pulse build](/malefic/build/pulse/) |
| `generate modules` / `build modules` | `malefic-modules` | shared library | [modules build](/malefic/build/modules/) |
| `generate loader proxydll` / `build proxy-dll` | `malefic-proxydll` | shared library | [proxydll build](/malefic/build/proxydll/) |
| `build 3rd` | `malefic-3rd` | shared library | [modules build](/malefic/build/modules/) |
| `build reactor` | `malefic-reactor` | shared library (always) | [reactor build](/malefic/build/reactor/) |

Windows-only gates are enforced for `pulse`, `modules`, `3rd`, and `proxy-dll`.

## Binary Tools Index

| Tool | Purpose | Detail |
|------|---------|--------|
| `tool encode` | Payload encoding (12 algorithms) | [Transform](/malefic/mutant/transform/) |
| `tool objcopy` | Binary section extraction | [Transform](/malefic/mutant/transform/) |
| `tool srdi` | Shellcode Reflective DLL Injection | [Transform](/malefic/mutant/transform/) |
| `tool patch` | Runtime config hot-patch | [Patch](/malefic/mutant/patch/) |
| `tool sigforge` | PE signature manipulation | [SigForge](/malefic/mutant/sigforge/) |
| `tool strip` | Path stripping from binaries | [PE Modify](/malefic/mutant/pe-modify/) |
| `tool obf` | Source-level obfuscation | [Obfuscate](/malefic/mutant/obfuscate/) |
| `tool entropy` | Entropy measurement / reduction | [PE Modify](/malefic/mutant/pe-modify/) |
| `tool watermark` | PE watermark embedding | [PE Modify](/malefic/mutant/pe-modify/) |
| `tool binder` | PE binding / embedding | [PE Modify](/malefic/mutant/pe-modify/) |
| `tool icon` | Icon replacement / extraction | [PE Modify](/malefic/mutant/pe-modify/) |
| `generate loader template` | Template loader generation | [Loader](/malefic/mutant/loader/) |
| `generate loader proxydll` | ProxyDLL generation | [Loader](/malefic/mutant/loader/) |

## implant.yaml

`implant.yaml` is the single source of truth for all generate and build commands. Mutant validates only the sections relevant to the selected command. `basic.obf_seed` is required by all generation paths.

| Section | Used by | Detail |
|---------|---------|--------|
| `basic` | beacon, bind, modules, patch | [malefic build](/malefic/build/malefic/#implantyaml-fields-for-beaconbind) |
| `implants` | beacon, bind, modules | [malefic build](/malefic/build/malefic/#implants-section) |
| `build` | all build commands | [malefic build](/malefic/build/malefic/#build-section) |
| `pulse` | `generate pulse` | [pulse build](/malefic/build/pulse/#implantyaml-pulse-section) |
| `loader.proxydll` | `generate loader proxydll` | [proxydll build](/malefic/build/proxydll/#implantyaml-loaderproxydll-section) |

## Related Pages

- [Build environment setup](/malefic/getting-started/)
- [Build docs index](/malefic/build/)
- [Mutant tools index](/malefic/mutant/)
- [Generate & build: malefic](/malefic/build/malefic/)
- [Generate & build: pulse](/malefic/build/pulse/)
- [Generate & build: proxydll](/malefic/build/proxydll/)
- [Generate & build: modules](/malefic/build/modules/)
- [Generate & build: prelude](/malefic/build/prelude/)
- [Generate & build: reactor](/malefic/build/reactor/)
