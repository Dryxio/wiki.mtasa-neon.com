---
title: Custom models
description: Stable server model identities, client runtime mappings, native-parent fallback, and resource ownership.
sidebar:
  order: 4
---

A Neon custom model has two identities: a stable ID used by the server and network, and a physical GTA slot chosen locally by each client. This page covers that model registry only; city archives and native world packs have their own ownership and lifecycle.

<!-- MEDIA PLACEHOLDER: Custom model lifecycle. Suggested file: /neon-media/custom-models.webp. Show the same server-owned model on two clients and, if useful, a parent-model fallback after the custom definition is released. -->

## Server-authoritative model registry

The registry covers objects, vehicles, peds, players, buildings, pickups, spawn packets, RPCs, names, enumeration, type queries, capacity queries, and lifecycle fallback. The initial object and vehicle work is tracked by [`a7a20d32b`](https://github.com/Dryxio/mtasa-neon/commit/a7a20d32b), and the completed cross-element registry by [`dc25a615c`](https://github.com/Dryxio/mtasa-neon/commit/dc25a615c).

```text
server logical ID (42341–65534) ──network identity──> client definition
                                                ├─ native parent fallback
                                                └─ client-local GTA runtime slot
```

In practice:

- logical IDs run from 42,341 through 65,534 and are not reused during the server process; 65,535 remains the invalid-model sentinel;
- each definition has a resource owner, type, native parent, and optional qualified name;
- each client may allocate a different runtime slot for the same logical ID;
- clients without an active runtime slot use the native parent;
- freeing a definition remaps surviving elements before runtime slots disappear;
- resource shutdown performs the same cleanup automatically;
- native ped and player render entities are prepared before slot release to avoid stale `CBaseModelInfo` references.

The [model API group](/neon/functions#models) contains allocation, freeing, metadata, naming, enumeration, capacity, and forward/reverse mapping functions. Commit [`ac3a54f57`](https://github.com/Dryxio/mtasa-neon/commit/ac3a54f57) moved the server range above Neon's complete FileID layout and made the standard client model consumers resolve logical IDs before touching GTA slots.

## Using model IDs correctly

Server element APIs use the stable logical ID:

```lua
local logical = assert(engineRequestModel("vehicle", 411, "mission_car"))
local vehicle = createVehicle(logical, 0, 0, 3)
```

Client replacement APIs operate on GTA slots, so resolve the local runtime ID first:

```lua
local runtime = engineGetModelRuntimeID(logical)
if runtime then
    engineReplaceModel(dff, runtime)
end
```

Do not save or synchronize a runtime ID as the model identity. That number only makes sense on one client for the lifetime of its current allocation.

## Related world systems

These systems can use the same low-level GTA model and streaming primitives, but they do not share ownership:

| System | What it owns | Lifecycle |
| --- | --- | --- |
| Custom model registry | Stable server IDs, native parents, network definitions, and client runtime-slot mappings | Resource and connection |
| [Resident IMG cities](/neon/extended-world#resident-img-city-workflow) | Runtime IMG archives, bounded DFF/TXD pools, preload barriers, and city switching | While GTA is running |
| [Native world packs](/neon/native-world) | Audited IDE/IMG/COL/IPL payloads, immutable cache objects, and startup authorization | Startup and process lifetime |

Allocating a server model does not register a city archive or authorize a native world pack. Resident IMG and Native World deliberately remain separate paths.

## Validation

`server-model-registry-test` covers:

- allocation, names, types, enumeration, and quotas;
- object, vehicle, ped, building, pickup, and spawn paths;
- client runtime and reverse mappings;
- replacement and LOD APIs;
- release while elements survive;
- resource cleanup and parent fallback.

Runtime checks cover spawn and respawn, model replacement, safe freeing, and the post-free crash regression.

This evidence applies to the registry and its cleanup paths. It does not validate a resident IMG city or authorize a native world pack; those systems have separate lifecycles and tests.
