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

Release 中的 `malefic.zip` 是推荐的离线编译包，包含完整源码、vendor 依赖和与该源码匹配的 Linux 版 `malefic-mutant`。手动编译时进入 `source_code/`，并优先使用包内的 `./bin/malefic-mutant`：

```bash
wget https://github.com/chainreactors/malefic/releases/download/v0.3.0/malefic.zip
unzip malefic.zip
cd malefic/source_code

docker run \
  -v "$(pwd):/root/src" \
  --rm -it ghcr.io/chainreactors/malefic-builder:latest \
  sh -lc "cd /root/src && chmod +x ./bin/malefic-mutant && ./bin/malefic-mutant generate beacon && ./bin/malefic-mutant build malefic --target x86_64-pc-windows-gnu"
```

离线包已经包含 vendor 依赖，不需要额外挂载 `/root/cargo/registry` 或 `/root/cargo/git`。如果使用的是 Git clone 源码而不是 release 离线包，才需要根据网络和缓存情况自行决定是否挂载 Cargo cache。

构建产物位于 `target/<target-triple>/release/`。

!!! warning "使用源码包内置的 malefic-mutant"
    `malefic-mutant generate` 会根据当前源码生成配置、改写 feature 并写入运行时配置文件，因此必须与源码版本匹配。手动 Docker 编译时优先使用 `./bin/malefic-mutant`，避免误用镜像内置或系统 PATH 中的旧版本。若遇到 `RuntimeConfig` 字段缺失、schema 不匹配或生成后的 Rust 代码编译失败，先检查实际执行的 `malefic-mutant` 路径。

如果目标产物需要在 macOS 上运行，首次执行前可能需要清理 quarantine 标记并做本地签名，命令参考 [Malefic 构建](/malefic/build/malefic/#macos-产物首次执行)。

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
