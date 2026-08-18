---
title: Rendering and limits
description: Expanded GTA pools, renderer telemetry, Project2DFX, CULL zones, and marker diagnostics.
sidebar:
  order: 5
---

Neon moves GTA's real fixed-size arrays and patches every verified place that initializes, reads, updates, renders, clears, or resets them. These are native capacity changes, not Lua-side counters pretending the old arrays are larger.

## Start with the visual features

Players looking for the console-style color, blur, radiosity, and YCbCr options should start with [SkyGFX and PS2-style visuals](/neon/skygfx). This page covers the separate engine capacities and Project2DFX distant-world renderer used by resources and large scenes.

## Renderer capacity

Commit [`bc3f9d9e6`](https://github.com/Dryxio/mtasa-neon/commit/bc3f9d9e6) expands:

- visible entity pointers: 1,000 → 8,192;
- visible LOD pointers: 1,000 → 8,192;
- streaming RenderWare object instances: 2,500 → 30,000.

[`engineGetRendererStats`](/neon/functions/engineGetRendererStats) exposes live usage, session high-water marks, and compiled capacities. [`engineResetRendererStats`](/neon/functions/engineResetRendererStats) starts a new measurement window without mutating live renderer state.

Runtime evidence exceeded the old ceilings with 1,033 visible entities and 4,677 streaming RenderWare links, followed by cleanup of 1,400 test buildings.

## Coronas and Project2DFX

Both sides below are the same Neon client with the option toggled, not two different builds. The night pair was captured 13 seconds apart from one viewpoint, so the time of day and weather match.

![Night comparison over the city: with extended draw distance and Project2DFX off the world is fogged out beyond a short distance, and with them on the full city appears with hundreds of distant coronas and traffic lights](/neon-media/compare-project2dfx.jpg)

![Daytime rooftop comparison: distant buildings are flat low-detail blobs under MTA's original far clip, and resolve into detailed geometry under Neon's extended draw distance](/neon-media/compare-draw-distance.jpg)

Commit [`4b7a1f523`](https://github.com/Dryxio/mtasa-neon/commit/4b7a1f523) relocates GTA's 64-entry corona array to 4,096 process-lifetime entries and patches the verified initialization, rendering, reflection, registration, and coordinate-update references. The first native slots remain available to GTA; up to 4,094 scripted coronas were validated in game.

Commit [`d0a91316b`](https://github.com/Dryxio/mtasa-neon/commit/d0a91316b) introduced distant static coronas and timed traffic lights from `SALodLights.dat`. The later startup-catalogue work in [`cc25c8017`](https://github.com/Dryxio/mtasa-neon/commit/cc25c8017) captures all accepted IPL definitions while GTA scans the world, so lights remain discoverable regardless of the player's current location.

Since [`25648d888`](https://github.com/Dryxio/mtasa-neon/commit/25648d888), Project2DFX does not consume GTA/MTA's shared 4,096-entry corona pool. It has a private 25,000-entry candidate and render queue and submits visible lights through GTA's buffered sprite renderer. In the current San Andreas catalogue, 20,363 accepted static definitions are eligible. Commit [`9ddb56604`](https://github.com/Dryxio/mtasa-neon/commit/9ddb56604) moved catalogue parsing and queue allocation to the first activation, so a clean installation that leaves Project2DFX off does not pay that startup work. The affected project built; that lazy-activation commit did not record a new runtime pass.

What works today:

- static distant coronas;
- directional timed traffic-light phases;
- embedded GTA 2DFX fallback;
- rebuild and telemetry APIs;
- lifecycle cleanup.

The in-game Neon settings tab exposes independent player controls for extended draw distance and Project2DFX. Both are off on a clean install. Draw distance is adjustable from 300 to 5,000 units; distant-light corona radius from 10% to 100%. Resource or server overrides take priority, and clearing them restores the saved player choice instead of leaving a temporary runtime value behind. Fog distance remains independent.

Remaining Project2DFX parity work includes matched corona size/intensity calibration, searchlight cones, the separate distant traffic-light and local point-light modules, optional static LOD shadows, extended vehicle or pedestrian shadows, and category-specific adaptive update and distance policies. These are tracked gaps, not implemented features.

Neon's current maximum uses one fixed 5,000-unit override for the far clip and eligible stock-model LOD distances. That is materially more aggressive than Project2DFX's adaptive, category-specific defaults. An adaptive target-frame-rate mode, separate distances for vegetation and other categories, and amortized updates remain future work; fog distance stays independent.

The full startup catalogue and private queue were compiled and checked in game during a city flight without a new crash or perceptible slowdown. That is a focused runtime check, not a broad performance guarantee; dense production scenes still need their own measurements.

## Markers, checkpoints, and coronas

The final marker relocation commit [`87e237bc0`](https://github.com/Dryxio/mtasa-neon/commit/87e237bc0) expands 3D markers and checkpoints from 32 to 4,096 and direction arrows from 5 to 4,096.

[`getMarkerLimitStats`](/neon/functions/getMarkerLimitStats) reports MTA streamer usage and native allocations. Commit [`8e79f5674`](https://github.com/Dryxio/mtasa-neon/commit/8e79f5674) also exposes the active processing bounds as `marker3DProcessLimit`, `checkpointProcessLimit`, and `directionArrowProcessLimit`. The focused resource prints the new fields; that check is not a benchmark or a production-scene performance claim. [`renderScriptImportantArea`](/neon/functions/renderScriptImportantArea) draws the visual used by the nonzero area flag of SCM `LOCATE_*` commands for one frame. It does not add collision or mission logic.

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

One narrow shader compatibility correction moves GTA's vehicle specular light away from an overwritten Direct3D slot and keeps it in Neon's existing `LIGHT*` scan. The original problem was reproduced and the affected projects compile, but native-material and custom-shader behavior still needs a post-fix visual pass; see commit [`c85423a08`](https://github.com/Dryxio/mtasa-neon/commit/c85423a08).
