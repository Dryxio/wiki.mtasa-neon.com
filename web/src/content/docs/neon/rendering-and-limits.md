---
title: Rendering and limits
description: Expanded GTA pools, renderer telemetry, Project2DFX, CULL zones, and marker diagnostics.
sidebar:
  order: 5
---

Neon relocates fixed GTA arrays only after auditing initialization, lookup, update, render, cleanup, reset, and executable identity sites. These are native capacity changes, not script-side counters pretending the old arrays are larger.

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

Current scope:

- static distant coronas;
- directional timed traffic-light phases;
- embedded GTA 2DFX fallback;
- rebuild and telemetry APIs;
- lifecycle cleanup.

Searchlight cones are recorded for future work. Distant cars, static shadows, and other Project2DFX modules are not implemented.

## Markers, checkpoints, and coronas

The final marker relocation commit [`87e237bc0`](https://github.com/Dryxio/mtasa-neon/commit/87e237bc0) expands 3D markers and checkpoints from 32 to 4,096 and direction arrows from 5 to 4,096.

[`getMarkerLimitStats`](/neon/functions/getMarkerLimitStats) exposes MTA streamer usage and native allocations. [`renderScriptImportantArea`](/neon/functions/renderScriptImportantArea) reproduces the visual emitted by the nonzero area flag of SCM `LOCATE_*` commands for one frame; it intentionally does not create collision or mission logic.

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

Neon adds aggregate timing scopes, the local `timingdebug [on|off]` command, reproducible entity mixes, and recorded profiles that separate MTA traversal, GTA native entity time, and collision attribution. The profiling resources are diagnostic tools; their results should be compared with model mix, collision, draw distance, and unrelated stress resources held constant.
