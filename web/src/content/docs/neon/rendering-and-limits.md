---
title: Rendering and limits
description: Expanded GTA pools, renderer telemetry, Project2DFX, CULL zones, and marker diagnostics.
sidebar:
  order: 5
---

Neon moves GTA's real fixed-size arrays and patches every verified place that initializes, reads, updates, renders, clears, or resets them. These are native capacity changes, not Lua-side counters pretending the old arrays are larger.

## Renderer capacity

Commit [`bc3f9d9e6`](https://github.com/Dryxio/mtasa-neon/commit/bc3f9d9e6) expands:

- visible entity pointers: 1,000 → 8,192;
- visible LOD pointers: 1,000 → 8,192;
- streaming RenderWare object instances: 2,500 → 30,000.

[`engineGetRendererStats`](/neon/functions/engineGetRendererStats) exposes live usage, session high-water marks, and compiled capacities. [`engineResetRendererStats`](/neon/functions/engineResetRendererStats) starts a new measurement window without mutating live renderer state.

Runtime evidence exceeded the old ceilings with 1,033 visible entities and 4,677 streaming RenderWare links, followed by cleanup of 1,400 test buildings.

## Coronas and Project2DFX

Commit [`4b7a1f523`](https://github.com/Dryxio/mtasa-neon/commit/4b7a1f523) relocates GTA's 64-entry corona array to 4,096 process-lifetime entries and patches the verified initialization, rendering, reflection, registration, and coordinate-update references. The first native slots remain available to GTA; up to 4,094 scripted coronas were validated in game.

Commit [`d0a91316b`](https://github.com/Dryxio/mtasa-neon/commit/d0a91316b) reads `SALodLights.dat` and renders distant static coronas and timed traffic lights through that pool. The feature is disabled by default and supports a 300–5,000 unit draw-distance range.

What works today:

- static distant coronas;
- directional timed traffic-light phases;
- embedded GTA 2DFX fallback;
- rebuild and telemetry APIs;
- lifecycle cleanup.

Searchlight cones are recorded for future work. Distant cars, static shadows, and other Project2DFX modules are not implemented.

## Markers, checkpoints, and coronas

The final marker relocation commit [`87e237bc0`](https://github.com/Dryxio/mtasa-neon/commit/87e237bc0) expands 3D markers and checkpoints from 32 to 4,096 and direction arrows from 5 to 4,096.

[`getMarkerLimitStats`](/neon/functions/getMarkerLimitStats) reports MTA streamer usage and native allocations. [`renderScriptImportantArea`](/neon/functions/renderScriptImportantArea) draws the visual used by the nonzero area flag of SCM `LOCATE_*` commands for one frame. It does not add collision or mission logic.

## Native CULL zones

Neon adopts vanilla attribute, tunnel, and mirror zones into stable IDs and expands their native stores:

- attribute: 1,300 → 4,096;
- tunnel: 40 → 256;
- mirror: 72 → 256.

The [CULL API group](/neon/functions#cull) provides list, create, replace, enable/disable, remove, and restore operations.

Ownership rules:

- newly created zones belong to the calling resource;
- a vanilla zone may be claimed for temporary edits;
- a resource cannot mutate a zone claimed by another owner;
- custom zones disappear on stop;
- claimed vanilla zones restore their original definition on stop;
- positions use GTA's signed 16-bit whole-unit storage, so fractions are truncated.

The relocation and CRUD lifecycle have been exercised in game. Dedicated tunnel and mirror capacity-boundary tests remain follow-up work.

## Dense-entity profiling

Neon adds aggregate timing scopes, the local `timingdebug [on|off]` command, repeatable entity mixes, and profiles that separate MTA traversal, GTA native entity time, and collision cost. Compare profiles only when the model mix, collision, draw distance, and unrelated stress resources stay the same.

## Shader compatibility note

Commit [`c85423a08`](https://github.com/Dryxio/mtasa-neon/commit/c85423a08) moves GTA's vehicle specular light from overwritten Direct3D slot 1 to reserved slot 7 and includes slot 7 in Neon's existing `LIGHT*` shader scan. The original problem was reproduced and the affected projects compile, but native-material and custom-shader behavior still needs a post-fix visual runtime pass.
