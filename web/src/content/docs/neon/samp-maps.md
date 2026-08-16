---
title: SA-MP maps
description: Load Texture Studio / Pawn map exports directly in Neon, including custom SA-MP objects and material slots.
---

Neon can load common **SA-MP Texture Studio / Pawn map exports without converting them to Lua first**. The client parser understands object creation, virtual worlds, interiors, building removals, and per-material texture/color overrides.

For the complete ready-to-use path, use the bundled [`samp-map-loader`](https://github.com/Dryxio/mtasa-neon/tree/master/test-resources/samp-map-loader) resource. It owns the model mappings, map elements, removals, material state, and cleanup.

## Load a map

Declare the `.pwn` file in the resource that owns it, then call the loader:

```lua
local map, diagnostics = exports["samp-map-loader"]:loadSAMPMap(":my-maps/maps/interior.pwn")
```

Unload the returned handle when the map is no longer needed:

```lua
exports["samp-map-loader"]:unloadSAMPMap(map)
```

The loader waits until every required custom model is ready before creating the complete map. If loading fails, it can report parser/model diagnostics instead of leaving a half-created scene.

## What the parser understands

[`engineParseSAMPMap`](/neon/functions/engineParseSAMPMap) accepts the Pawn source text and returns inert data for:

- `CreateObject`, `CreateDynamicObject`, and extended dynamic-object forms;
- model, position, rotation, stream distance, and draw distance;
- virtual world and interior metadata;
- `RemoveBuildingForPlayer`-style removals;
- `SetObjectMaterial` texture and color slots;
- source line/column diagnostics.

Parsing does **not** create an MTA element or load a model. That separation keeps resource ownership and failure policy in Lua.

```lua
local parsed = engineParseSAMPMap(mapSource)
if not parsed.success then
    outputDebugString(parsed.diagnostics[1].message, 1)
    return
end
```

## SA-MP custom objects

The reference loader resolves the official SA-MP 0.3.7 custom-object ranges to resource-owned Neon runtime models. The source map can keep its original SA-MP IDs; the loader maps them to the client slots actually allocated by Neon.

Material slots use [`setObjectMaterial`](/neon/functions/setObjectMaterial) and [`removeObjectMaterial`](/neon/functions/removeObjectMaterial). Neon applies the SA-MP slot index across every atomic in the DFF and keeps the override on the MTA object so it survives stream-out/recreation.

[`engineGetTXDIDFromName`](/neon/functions/engineGetTXDIDFromName) is available when a loader needs the current GTA slot for a named texture dictionary.

## Object streaming budget

MTA keeps a fixed **1000-slot streamed-object budget** for its normal and low-LOD object streamers. The default split remains **500 normal / 500 low-LOD**.

SA-MP-style maps that do not use low-LOD objects can redistribute that existing budget:

```lua
engineSetObjectStreamingLimits(1000, 0)
```

[`engineGetObjectStreamingLimits`](/neon/functions/engineGetObjectStreamingLimits) returns the current normal quota, low-LOD quota, and hard combined maximum. The sum cannot exceed 1000; this feature does not enlarge GTA's physical pools. Lowering a quota below current usage restreams that category so the new limit takes effect.

## Scope

- The parser is client-side and produces data only.
- Model and map cleanup still belongs to the resource.
- The public repository includes a focused fixture and loader; private map corpora used during validation are not distributed.
- Custom map support does not bypass normal MTA element limits, collision rules, dimensions, or resource permissions.

Commit [`28dfcff23`](https://github.com/Dryxio/mtasa-neon/commit/28dfcff23) added native SA-MP map parsing, material-slot support, custom-object loading, and the reference loader. Commit [`c1d052e9d`](https://github.com/Dryxio/mtasa-neon/commit/c1d052e9d) added the configurable object-streaming split.
