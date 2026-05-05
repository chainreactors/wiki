---
title: 快速开始
description: This page covers environment setup for building Malefic. Build commands
  and configuration reference live in the per-component pages.
edition: community
generated: false
source: imp:getting-started/build.md
---

# 快速开始

This page covers environment setup for building Malefic. Build commands and configuration reference live in the per-component pages.

## Prerequisites

Clone the workspace with submodules before using either Docker or local builds:

```bash
git clone --recurse-submodules https://github.com/chainreactors/malefic
cd malefic
```

If the repository was cloned without submodules, initialize them before building:

```bash
git submodule update --init --recursive
```

`resources.zip` contains prebuilt runtime resources used by source/prebuild combinations, including win-kit related artifacts. The one-step install flow downloads resources automatically. For a manual setup, download the latest release resources and extract them to `resources/`:

```bash
# release page:
# https://github.com/chainreactors/malefic/releases/latest
```

## Docker Build

The Docker path is the default recommendation because cross-target Rust builds need platform-specific toolchains, linkers, SDKs, and system libraries. The `ghcr.io/chainreactors/malefic-builder:latest` image is intended for common Windows, Linux, and macOS target triples.

```bash
docker run -v "$(pwd):/root/src" --rm -it ghcr.io/chainreactors/malefic-builder:latest sh -c "malefic-mutant generate beacon && malefic-mutant build malefic --target x86_64-pc-windows-gnu"
```

Use a Cargo cache mount when rebuilding often:

```bash
docker run \
  -v "$(pwd):/root/src" \
  -v "$(pwd)/cache/registry:/root/cargo/registry" \
  -v "$(pwd)/cache/git:/root/cargo/git" \
  --rm -it ghcr.io/chainreactors/malefic-builder:latest \
  sh -c "malefic-mutant generate beacon && malefic-mutant build malefic --target x86_64-pc-windows-gnu"
```

Build outputs are written under `target/<target-triple>/release/`.

## GitHub Action Build

The repository workflow `generate.yaml` accepts a base64-encoded `implant.yaml` and a package name. This is useful when the build environment should stay inside GitHub Actions.

```bash
gh workflow run generate.yaml \
  -f package="beacon" \
  -f malefic_config_yaml=$(base64 -w 0 < implant.yaml) \
  -f remark="beacon" \
  -f targets="x86_64-pc-windows-gnu" \
  -R <username/malefic>
```

For Windows shells without GNU `base64`, run the command from Git Bash or another shell that provides it.

## Local Build

Local builds are useful for development but require the correct Rust nightly, target toolchains, and native linkers.

```bash
rustup default nightly-2024-02-03
rustup target add x86_64-pc-windows-gnu
cargo install cargo-zigbuild
```

On Linux, install common native dependencies before local cross-builds:

```bash
sudo apt install -y openssl libssl-dev libudev-dev cmake llvm clang musl-tools build-essential
```

On Windows, use MSVC targets with Visual Studio Build Tools or GNU targets with MSYS2 MinGW toolchains.

## Build Topics

- [Mutant design and concepts](/malefic/getting-started/components/mutant/)
- [Build 文档入口](/malefic/build/)
- [Malefic beacon and bind](/malefic/build/malefic/)
- [Pulse stager](/malefic/build/pulse/)
- [ProxyDLL](/malefic/build/proxydll/)
- [Modules and third-party modules](/malefic/build/modules/)
- [Prelude](/malefic/build/prelude/)
- [Reactor](/malefic/build/reactor/)
