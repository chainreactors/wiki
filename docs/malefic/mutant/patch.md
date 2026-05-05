---
title: Patch — 运行时配置热补丁
description: malefic-mutant tool patch 对已编译的 beacon 二进制进行运行时配置 blob 热补丁， 无需重新编译 。整条
  RuntimeConfig 由 --from-implant 或 --config 提供，可叠加 --set 做 JSON 合并覆盖。
edition: community
generated: false
source: imp:mutant/patch.md
---

# Patch

`malefic-mutant tool patch` 对已编译的 beacon 二进制进行运行时配置 blob 热补丁， **无需重新编译** 。整条 `RuntimeConfig` 由 `--from-implant` 或 `--config` 提供，可叠加 `--set` 做 JSON 合并覆盖。

> 适用范围：任何通过 `mutant generate` 写入了 `BLOB_PAYLOAD_INIT` slot 的 binary（共 16384 字节，由 `obf_seed` 派生的 8 字节 prefix + 8 字节 seed + 16368 字节 payload 区）。
>
> patch 既适用于首次（payload 还是默认值）也适用于已 patch 过的 binary —— slot 通过 prefix+seed 头部结构性定位，不依赖 `'#'` padding。

---

## 用法

```bash
malefic-mutant tool patch -i <INPUT> [来源] [覆盖] [-o <OUT>]
```

### 来源（必选其一）

| 参数 | 说明 |
|------|------|
| `--from-implant <IMPLANT.yaml>` | 从 implant.yaml 推导 RuntimeConfig，**自动读取 `basic.obf_seed`** |
| `--config <RUNTIME.json/yaml>` + `--obf-seed <U64>` | 直接给完整 RuntimeConfig 文件 + 显式 obf_seed |

### 覆盖（可选，可重复）

| 参数 | 说明 |
|------|------|
| `--set '<JSON>'` | 把 JSON 对象按字段合并到 RuntimeConfig 上，可重复使用 |

### 输出

| 参数 | 说明 |
|------|------|
| `-i, --input <PATH>` | 要 patch 的目标 binary |
| `-o, --output <PATH>` | 输出路径（默认在原文件名加 `-patched` 后缀） |

---

## 例子

```bash
# 最常见：直接用 implant.yaml 的全部字段
malefic-mutant tool patch \
    -i malefic.exe \
    --from-implant implant.yaml

# 改一两个字段（基于 implant.yaml）
malefic-mutant tool patch \
    -i malefic.exe \
    --from-implant implant.yaml \
    --set '{"name":"campaign_42"}' \
    --set '{"retry":20}'

# 改 server 地址
malefic-mutant tool patch \
    -i malefic.exe \
    --from-implant implant.yaml \
    --set '{"server_configs":[{"address":"10.0.0.1:5001"}]}'

# 用独立 RuntimeConfig 文件 + 显式 seed（无 implant.yaml 场景）
malefic-mutant tool patch \
    -i malefic.exe \
    --config runtime.json \
    --obf-seed 15229217100126305078 \
    --output malefic_patched.exe
```

---

## 工作机制

1. **派生密钥** —— `derive_blob_key_material(obf_seed)` 用 splitmix64 + 不同 domain separator 派生：
   - 8 字节 `BLOB_PREFIX`（slot 头部）
   - 8 字节 `BLOB_SEED`（slot 头部）
   - 32 字节 AES-256 key
   - 16 字节 AES-CTR IV
2. **定位 slot** —— 在二进制里搜索唯一的 16 字节 `prefix || seed_le` 头部模式（约 2⁻¹²⁸ 误中率）。
3. **加密 payload** —— `AesCtrCipher::encrypt(TinySerialize(RuntimeConfig))`，base64 编码，长度上限 16368 字节。
4. **写回** —— 保留头部 16 字节，仅覆盖 payload 区，不足部分用 `'#'`（0x23）填充。

运行时（implant 启动）会读出 slot，用 `BLOB_MASKED_KEY ^ BLOB_KEY_MASK` 还原同一把 key/iv，AES-CTR 解密后 `TinyDeserialize` 回 `RuntimeConfig`。

---

## Community 与 Professional 模式

| 项 | Community | Professional |
|---|---|---|
| Blob payload AES-CTR | ✅ 加密 | ✅ 加密 |
| 代码字符串字面量 obfstr | ⛔ 明文 | ✅ 编译期加密 |
| TinyDeserialize 字段名 | ⛔ 明文 | ✅ 加密 |
| `mutant tool patch` 是否可用 | ✅ | ✅ |
| 运行时 binary 是否可启动 | ✅ | ✅ |

两种模式下 patch 路径行为一致，攻击方静态扫描不到 server 地址 / key —— 必须先掌握 `obf_seed` 才能解密 blob。

---

## 限制与注意

- **payload 长度上限 16368 字节（base64 后）** 。RuntimeConfig 序列化超出会报错。
- **obf_seed 必须与 binary 编译时一致** ：`mutant generate` 把 `obf_seed` 派生的 prefix/seed 写入 `blob_obf.rs`，再用 `cargo build` 编译；patch 阶段必须用同一 yaml（含同一 `obf_seed`），否则 prefix 搜索失败。
- **不存在自动重打 obf_seed** ：要换 seed 必须重新走一遍 `mutant generate` + `cargo build`，否则 prefix 不匹配。
- **不修改头部** ：每次 patch 只替换 payload 区，slot offset 与头部 (prefix+seed) 不变 —— 因此可以反复 patch。

---

## 验证

```bash
# 1. 编译
cargo build -p malefic --release --features beacon,transport_tcp

# 2. patch
malefic-mutant tool patch \
    -i target/release/malefic.exe \
    --from-implant implant.yaml \
    --output target/release/malefic_patched.exe

# 3. 解密验证（脚本在 scripts/decrypt_slot.py）
python scripts/decrypt_slot.py target/release/malefic_patched.exe <obf_seed>
```

成功的输出会显示 splitmix64 派生的 prefix/seed/key/iv 与 `blob_obf.rs` 完全一致，且解密后的 TinySerialize Value 可读出 `cron`、`key`、`server_configs[].address` 等明文字段。
