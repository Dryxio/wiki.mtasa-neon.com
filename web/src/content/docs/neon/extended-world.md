---
title: Extended world
description: Neon's 20 km world domain, water, radar, F11 atlas, and city residency architecture.
sidebar:
  order: 2
---

Neon expands the usable San Andreas world without moving the stock map. The supported XY domain is **−10,000 through +9,999**, backed by relocated GTA sector grids and matching validation, rendering, line-of-sight, pickup, water, and versioned network paths.

## Sector relocation

Commit [`842983c91`](https://github.com/Dryxio/mtasa-neon/commit/842983c91) relocates the main grid from 120 × 120 to 400 × 400 and the LOD grid from 30 × 30 to 100 × 100. Neon patches the verified GTA 1.0 US initialization, lookup, renderer, and scanning references rather than placing a script abstraction over the old grids.

Important consequences:

- San Andreas stays at its original coordinates.
- `createBuilding`, world linking, LOS, rendering, and LOD scans use the active relocated grid.
- Network coordinate encodings advertise a capability before using Neon ranges.
- Legacy connections retain MTA's original packet formats.
- The Perry Island pipeline provides a deterministic generated test around X=9,000.

## Water and seabed

Commit [`52039a4df`](https://github.com/Dryxio/mtasa-neon/commit/52039a4df) relocates GTA's custom-water block index to 40 × 40. Custom polygons can cover the full Neon domain while the native infinite outside-world ocean remains independent.

The server APIs [`setWorldSeaBedOuterBoundary`](/neon/functions/setWorldSeaBedOuterBoundary), [`resetWorldSeaBedOuterBoundary`](/neon/functions/resetWorldSeaBedOuterBoundary), and [`getWorldSeaBedOuterBoundary`](/neon/functions/getWorldSeaBedOuterBoundary) control only the rendered procedural seabed. They do not remove ocean water or change buoyancy and water physics.

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

## Resident IMG city workflow

Commit [`a53602ba7`](https://github.com/Dryxio/mtasa-neon/commit/a53602ba7) adds resource-managed per-client residency for large Liberty City, Vice City, Carcer City, and Bullworth packs.

The workflow:

1. registers bounded DFF/TXD allocations;
2. links a runtime IMG;
3. preloads the target scene;
4. crosses a resource-controlled readiness barrier;
5. switches city residency only after teardown drains pending streaming work;
6. deletes client entities before releasing model slots;
7. releases dynamic TXD registry entries so later cities can reuse them.

This is distinct from [native world packs](/neon/native-world). Resident city resources deliberately manage runtime slots and switching; native packs register IDE/IMG/IPL data into GTA's startup-native spatial streaming path.

## Demonstration maps are not bundled worlds

Perry Island, Liberty City, Vice City, Carcer City, and Bullworth are validation inputs for generic Neon systems. Generated game assets are intentionally excluded from Git and must be produced locally from lawfully obtained source material. Neon does not embed or redistribute those cities.

## Current boundaries

- Extended coordinates do not automatically provide radar, paths, population, zones, audio, interiors, or environment data.
- Project2DFX searchlights, distant cars, and static shadows are not implemented.
- Multi-city native-world activation still needs aggregate model, TXD, collision, IPL, archive, streaming-memory, LOD, and optional-subsystem budgets.
- Ordinary draw distances remain unchanged unless a server or resource changes them.
