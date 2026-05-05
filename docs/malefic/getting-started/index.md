---
title: 快速开始
description: 本页说明构建 Malefic 所需的环境准备。具体构建命令和配置字段参考各组件构建页。
edition: community
generated: false
source: imp:getting-started/build.md
---

# 快速开始

本页说明构建 Malefic 所需的环境准备。具体构建命令和配置字段参考各组件构建页。

## Prerequisites

无论使用 Docker 还是本地构建，都需要先 clone workspace 并拉取 submodules：

```bash
git clone --recurse-submodules https://github.com/chainreactors/malefic
cd malefic
```

如果仓库 clone 时没有带 submodules，构建前先补齐：

```bash
git submodule update --init --recursive
```

`resources.zip` 包含构建时可能用到的预置资源，包括 win-kit 相关产物。自动安装流程会下载资源；手动准备时，从最新 release 下载并解压到 `resources/`：

```bash
# release page:
# https://github.com/chainreactors/malefic/releases/latest
```

## Docker Build

推荐优先使用 Docker 构建，因为跨 target Rust 构建依赖目标平台对应的 toolchain、linker、SDK 和系统库。`ghcr.io/chainreactors/malefic-builder:latest` 面向常见 Windows、Linux 和 macOS target triple。

```bash
docker run -v "$(pwd):/root/src" --rm -it ghcr.io/chainreactors/malefic-builder:latest sh -c "malefic-mutant generate beacon && malefic-mutant build malefic --target x86_64-pc-windows-gnu"
```

频繁重建时可以挂载 Cargo cache：

```bash
docker run \
  -v "$(pwd):/root/src" \
  -v "$(pwd)/cache/registry:/root/cargo/registry" \
  -v "$(pwd)/cache/git:/root/cargo/git" \
  --rm -it ghcr.io/chainreactors/malefic-builder:latest \
  sh -c "malefic-mutant generate beacon && malefic-mutant build malefic --target x86_64-pc-windows-gnu"
```

构建产物位于 `target/<target-triple>/release/`。

## GitHub Action Build

仓库 workflow `generate.yaml` 接收 base64 编码后的 `implant.yaml` 和 package 名称，适合把构建环境留在 GitHub Actions 内。

```bash
gh workflow run generate.yaml \
  -f package="beacon" \
  -f malefic_config_yaml=$(base64 -w 0 < implant.yaml) \
  -f remark="beacon" \
  -f targets="x86_64-pc-windows-gnu" \
  -R <username/malefic>
```

如果 Windows shell 没有 GNU `base64`，从 Git Bash 或其他提供该命令的 shell 执行。

## Local Build

本地构建适合开发调试，但需要准备正确的 Rust nightly、target toolchain 和 native linker。

```bash
rustup default nightly-2024-02-03
rustup target add x86_64-pc-windows-gnu
cargo install cargo-zigbuild
```

Linux 本地交叉构建前，先安装常用 native 依赖：

```bash
sudo apt install -y openssl libssl-dev libudev-dev cmake llvm clang musl-tools build-essential
```

Windows 上构建 MSVC target 需要 Visual Studio Build Tools；构建 GNU target 需要 MSYS2 MinGW toolchain。

## Build Topics

- [Mutant 设计与概念](/malefic/getting-started/components/mutant/)
- [Build 文档入口](/malefic/build/)
- [Malefic Beacon / Bind](/malefic/build/malefic/)
- [Pulse Stager](/malefic/build/pulse/)
- [ProxyDLL](/malefic/build/proxydll/)
- [模块与第三方模块](/malefic/build/modules/)
- [Prelude](/malefic/build/prelude/)
- [Reactor](/malefic/build/reactor/)
