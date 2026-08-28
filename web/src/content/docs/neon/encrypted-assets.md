---
title: Encrypted resource assets
description: Encrypt downloadable DFF, TXD, and COL files, then let Neon authenticate and apply them without exposing plaintext or keys to client Lua.
sidebar:
  order: 5
---

Drop DFF, TXD, and COL files into the [Neon Asset Encrypter](/neon/tools/asset-encrypter), enter the exact resource name and model IDs, then download the generated ZIP. Neon clients receive authenticated ciphertext in their resource cache instead of reusable model files.

The encrypter runs entirely in the browser. Files and keys are not uploaded to the wiki or Vercel.

## Build a package

1. Open the [Asset Encrypter](/neon/tools/asset-encrypter).
2. Enter the resource folder name exactly as it will appear on the server.
3. Drop one or more `.dff`, `.txd`, or `.col` files and check each target model ID.
4. Select **Encrypt files and download ZIP**.
5. Extract the ZIP into the resource and merge the generated snippets.

The ZIP contains:

| File | Purpose |
| --- | --- |
| `models/*.neonasset` | Client-downloadable authenticated ciphertext |
| `neon-assets.key` | Server-only 256-bit content key |
| `meta.xml.snippet` | Package descriptor and client-file declarations |
| `neon-assets-client.lua` | Ordered TXD, DFF, and COL replacement calls |
| `INSTALL.txt` | Package ID and deployment checklist |

The resource name and every `.neonasset` path are authenticated. Renaming the resource, moving a container, or changing its bytes makes loading fail instead of silently applying different data.

## Resource metadata

Merge the generated entries inside the existing `<meta>` element:

```xml
<neon_assets package="00112233445566778899aabbccddeeff" keyfile="neon-assets.key" />
<file src="models/taxi.txd.neonasset" neon_asset="true" />
<file src="models/taxi.dff.neonasset" neon_asset="true" />
<file src="models/taxi.col.neonasset" neon_asset="true" />
<script src="neon-assets-client.lua" type="client" />
```

Keep `neon-assets.key` in the server resource directory, but **never** declare it as a `<file>`, `<script>`, or other downloadable item. Neon rejects a package whose key file is client-visible.

Use one generated key and package ID for all protected files in the same package. Generate a new package when rotating the key.

## Load and replace assets

Call `engineReplaceEncryptedModel` from the resource that owns the declared file:

```lua
local modelId = 411

local txd = assert(engineReplaceEncryptedModel("models/taxi.txd.neonasset", modelId))
local dff = assert(engineReplaceEncryptedModel("models/taxi.dff.neonasset", modelId))
local col = assert(engineReplaceEncryptedModel("models/taxi.col.neonasset", modelId))
```

Apply TXD before DFF and COL for a complete model triplet. The function authenticates, decrypts, validates, and applies each asset as one native operation. Neither the key nor plaintext is returned to Lua. The returned TXD, DFF, or COL element belongs to the calling resource and is cleaned up when that resource stops.

The optional third argument enables DFF alpha transparency. The fourth controls TXD filtering:

```lua
engineReplaceEncryptedModel(path, modelId, true, false)
```

## Real limits

Version 1 supports DFF, TXD, and COL files up to 64 MiB each. Clothing-model targets are rejected because their RenderWare path retains source buffers longer than ordinary model replacements.

This prevents trivial extraction of usable models from the downloaded resource cache. It cannot make a client-rendered asset impossible to capture: a determined user can inspect plaintext or key material while the game is actively using it. This is the practical limit of client-side protection, including systems such as pcrypt.

Encrypted packages require matching Neon client and server builds on the network epoch that introduced the asset transport. They do not load on an ordinary MTA client.

## Implementation and evidence

The authenticated container, server metadata, resource-scoped key transport, native loader, browser-compatible packer format, and memory cleanup were introduced in [`6b7965afb`](https://github.com/Dryxio/mtasa-neon/commit/6b7965afb726ac00190550b1e5f8195fd24355e3).

The implementation was built as `Client Deathmatch` Release Win32 and `Deathmatch` Release x64. The focused `test-resources/neon-encrypted-assets` checkpoint was checked in game with one connected client using a real WOSA TXD/DFF/COL triplet. The client authenticated and replaced all three files; the server loaded 316 resources with no resource failures. This was a single-client check, not a multiplayer validation.
