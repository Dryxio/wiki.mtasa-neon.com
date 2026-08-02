---
title: Extended world
description: Neon's 20 km world domain, water, radar, F11 atlas, and city residency architecture.
sidebar:
  order: 2
---

Neon makes more of the San Andreas world usable without moving the original map. The supported XY range is **−10,000 through +9,999**. GTA's sector grids and the related validation, rendering, line-of-sight, pickup, water, and network code all understand that range.

## Sector relocation

The active GTA grids grow from 120 × 120 to 400 × 400 for the main world and from 30 × 30 to 100 × 100 for LODs. Neon patches GTA 1.0 US initialization, lookup, rendering, and scanning code rather than presenting a larger Lua-only coordinate range. The implementation is tracked by commit [`842983c91`](https://github.com/Dryxio/mtasa-neon/commit/842983c91).

What that means:

- San Andreas stays at its original coordinates.
- `createBuilding`, world linking, LOS, rendering, and LOD scans use the active relocated grid.
- Network coordinate encodings advertise a capability before using Neon ranges.
- Legacy connections retain MTA's original packet formats.
- The Perry Island pipeline provides a deterministic generated test around X=9,000.

## Recipient-aware world synchronization

The server writes extended coordinates in each recipient's negotiated format. This includes two RPCs that previously serialized positions into a legacy temporary bitstream before copying them into versioned packets:

- `moveObject` interpolation, including its optional rotation and easing tail;
- collision-polygon point updates.

Both packets now keep semantic position data until `Write`, where the server chooses the correct encoding for each recipient. Legacy clients keep their old bytes; Neon-capable clients receive the extended position form. Targeted tests cover ordinary coordinates, X=+9,500, water-side X=−9,990, mixed recipient versions, and exact final object positions. See commit [`c223b6b3d`](https://github.com/Dryxio/mtasa-neon/commit/c223b6b3d).

## Water and seabed

Commit [`52039a4df`](https://github.com/Dryxio/mtasa-neon/commit/52039a4df) relocates GTA's custom-water block index to 40 × 40. Custom polygons can cover the full Neon domain while the native infinite outside-world ocean remains independent.

The server APIs [`setWorldSeaBedOuterBoundary`](/neon/functions/setWorldSeaBedOuterBoundary), [`resetWorldSeaBedOuterBoundary`](/neon/functions/resetWorldSeaBedOuterBoundary), and [`getWorldSeaBedOuterBoundary`](/neon/functions/getWorldSeaBedOuterBoundary) control only the rendered procedural seabed. They do not remove ocean water or change buoyancy and water physics.

## Pickups at extended coordinates

GTA stores pickup positions in signed 16-bit eighth-unit fields. Neon keeps MTA's floating-point position separately, saturates the native placeholder safely, and relocates the associated object before linking it into the world. This prevents visual wrapping at X=4,096 without changing the native pickup ABI or ordinary in-range behavior.

## Extended radar and F11 map

Commit [`766727162`](https://github.com/Dryxio/mtasa-neon/commit/766727162) replaces the fixed minimap lookup with a sparse 40 × 40 logical grid:

- each cell covers 500 × 500 world units;
- stock San Andreas cells remain protected;
- missing extended cells render GTA's native ocean fallback;
- TXD bytes are validated and owned by the registering resource;
- tile loading is deferred through GTA's native texture path;
- resource or TXD destruction unregisters owned tiles.

Commit [`ce3f6fe72`](https://github.com/Dryxio/mtasa-neon/commit/ce3f6fe72) builds the F11 world map dynamically from GTA's 144 native radar TXDs plus every registered extended tile. Atlas uploads are batched across frames, bounds come from the active catalogs, and the packaged San Andreas map remains a fallback.

Use the [extended radar APIs](/neon/functions#radar) and the `extended-radar-test` resource to verify coordinate selection, replacement, cleanup, and diagnostics.

Four optional client resources package the reviewed native-world radar catalogues: 15 Bullworth tiles, 80 Vice City tiles, 81 Liberty City tiles, and 63 Carcer City tiles. Each resource loads its complete TXD set before changing the registry, rolls back only its own tiles on failure or stop, and exposes `getNativeWorldRadarStatus` and `reloadNativeWorldRadar` as resource exports rather than core Lua APIs. The generated assets are not stored in Git; build them from legally obtained source material with `utils/extended-world/build_native_world_radar_resources.py`.

Bullworth, Liberty City, and Carcer City were exercised together with 159 registered tiles. Vice City's package and manifest were statically checked, but not included in that matching selected-set runtime pass.

## Resident IMG city workflow

Commit [`a53602ba7`](https://github.com/Dryxio/mtasa-neon/commit/a53602ba7) adds resource-managed per-client residency for large Liberty City, Vice City, Carcer City, and Bullworth packs.

The switch works like this:

1. registers bounded DFF/TXD allocations;
2. links a runtime IMG;
3. preloads the target scene;
4. crosses a resource-controlled readiness barrier;
5. switches city residency only after teardown drains pending streaming work;
6. deletes client entities before releasing model slots;
7. releases dynamic TXD registry entries so later cities can reuse them.

Resident cities switch between finite sets of runtime slots while GTA is already running. Their model allocations may use the [custom model registry](/neon/models-and-streaming), but the resource still owns the archives, preload barrier, and teardown sequence.

This is separate from [native world packs](/neon/native-world). Native packs register audited IDE/IMG/COL/IPL data through GTA's startup spatial-streaming path and keep an active selected-set trust boundary for the session. The current v3 runtime can move between reviewed cities inside that selected set, while keeping only one imported city resident at a time, then drain and detach the generation during session shutdown.

## Test maps are not bundled worlds

Perry Island, Liberty City, Vice City, Carcer City, and Bullworth are test cases for Neon's generic systems. Generated game assets stay out of Git and must be built locally from lawfully obtained source material. Neon does not include or redistribute those cities.

## Current boundaries

- Extended coordinates do not automatically provide radar, paths, population, zones, audio, interiors, or environment data.
- Project2DFX searchlights, distant cars, and static shadows are not implemented.
- Native World v3 supports an ordered set of reviewed packs, automatic spatial city residency, and generation-fenced teardown. The supported path to a different selected set still needs a new startup ticket and clean restart because same-process readmission remains incomplete; arbitrary third-party worlds are not accepted.
- Ordinary draw distances remain unchanged unless a server or resource changes them.

## Implementation note

The early native `SWEET1A` gate caught a generated-manifest collision with GTA's shared animation timing constant. Commit [`4f2be00c1`](https://github.com/Dryxio/mtasa-neon/commit/4f2be00c1) removes that non-sector operand while leaving Neon's dedicated sector value in place.
