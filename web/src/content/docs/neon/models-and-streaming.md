---
title: Models and streaming
description: Stable server model identities, client runtime mappings, IMG residency, and teardown guarantees.
sidebar:
  order: 4
---

A Neon custom model has two identities: a stable ID used by the server and network, and a physical GTA slot chosen locally by each client.

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

## Resident IMG streaming

Large imported-city resources link IMG archives into GTA and manage bounded DFF/TXD pools on each client. Loading is only half the job; commit [`a53602ba7`](https://github.com/Dryxio/mtasa-neon/commit/a53602ba7) also fixes the shutdown path:

- pending streaming work is drained before teardown;
- client entities are destroyed before the slots they reference;
- dynamic TXD registry entries are released for reuse;
- IPL building ranges are clamped after pool shrink;
- preload barriers and generation tokens reject stale city-switch completions.

Resident cities switch between finite sets of slots while GTA is running. Native world packs use a different startup path.

## Pickup and extended-coordinate handling

GTA stores pickup positions in signed 16-bit eighth-unit fields. Neon keeps MTA's floating-point position separately, saturates the native placeholder safely, and relocates the associated object before linking it into the world. This prevents visual wrapping at X=4,096 without changing the native pickup ABI or ordinary in-range behavior.

## Validation

`server-model-registry-test` covers:

- allocation, names, types, enumeration, and quotas;
- object, vehicle, ped, building, pickup, and spawn paths;
- client runtime and reverse mappings;
- replacement and LOD APIs;
- release while elements survive;
- resource cleanup and parent fallback.

The commit was tested with Release x64 server and Release Win32 client builds, plus spawn/respawn, model replacement, safe freeing, and the post-free crash regression.
