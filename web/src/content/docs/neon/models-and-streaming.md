---
title: Custom models
description: Stable server model identities, client runtime mappings, native-parent fallback, and resource ownership.
sidebar:
  order: 4
---

A Neon custom model has two identities: a stable ID used by the server and network, and a physical GTA slot chosen locally by each client. This page covers that model registry only; city archives and native world packs have their own ownership and lifecycle.

## Server-authoritative model registry

The first registry checkpoint ([`a7a20d32b`](https://github.com/Dryxio/mtasa-neon/commit/a7a20d32b)) introduced stable object and vehicle identities. The completion checkpoint ([`dc25a615c`](https://github.com/Dryxio/mtasa-neon/commit/dc25a615c)) extended the registry across objects, vehicles, peds, players, buildings, pickups, spawn packets, RPCs, names, enumeration, type queries, capacity queries, and lifecycle fallback.

```text
server logical ID (30000+) ──network identity──> client definition
                                                ├─ native parent fallback
                                                └─ client-local GTA runtime slot
```

In practice:

- logical IDs begin at 30,000 and are not reused during the server process;
- each definition has a resource owner, type, native parent, and optional qualified name;
- each client may allocate a different runtime slot for the same logical ID;
- legacy clients and clients without an active runtime slot use the native parent;
- freeing a definition remaps surviving elements before runtime slots disappear;
- resource shutdown performs the same cleanup automatically;
- native ped and player render entities are prepared before slot release to avoid stale `CBaseModelInfo` references.

The [model API group](/neon/functions#models) contains allocation, freeing, metadata, naming, enumeration, capacity, and forward/reverse mapping functions. The five introspection entries added by the completion commit are included even though the current engine README omits them.

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
