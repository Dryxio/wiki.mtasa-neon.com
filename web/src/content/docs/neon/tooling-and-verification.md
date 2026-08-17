---
title: Tooling and verification
description: Neon's asset pipelines, validators, focused test resources, profiling, and verification standards.
sidebar:
  order: 9
---

Deep GTA changes need more than a successful build. Neon combines executable guards, static checks, focused harnesses, matching client/server builds, and in-game passes so the documentation can state exactly what was exercised and what remains open.

## Evidence levels

The wiki uses these terms deliberately:

| Label | What it establishes |
| --- | --- |
| Implemented | The code path and registration exist in the documented revision. |
| Compiled | The affected project or producer/consumer set built successfully. |
| Statically checked | Parsers, formats, manifests, scripts, or resource files passed non-runtime validation. |
| Harness-tested | A focused automated or resource-level test exercised the named behavior. |
| In-game checked | The stated path was observed in a running client/server session. The scope must say single-client or multiplayer when that matters. |
| Experimental / unverified | The path exists, but the required runtime evidence is incomplete. |

A lower level never implies a higher one. A build does not prove gameplay, and the existence of a test resource does not prove that every API in the same category was exercised by it.

## How Neon is verified

The normal verification stack is:

1. patch guards confirm the exact supported GTA executable before native memory changes;
2. static checks cover formats, limits, ownership, cleanup, and failure paths;
3. affected client and server projects compile together when they share an ABI or protocol;
4. focused resources exercise one system at a time;
5. integrated resources combine systems under realistic lifecycle pressure;
6. in-game checks cover connection, restart, reconnection, stream cycles, cleanup, and ordinary San Andreas behavior after the feature is disabled.

The required depth depends on the change. Lua/resource-data work may need parsing and a resource restart but no C++ build. Native memory, serialization, protocol, or ABI changes need every affected producer and consumer plus an appropriate runtime pass.

## Extended-world pipeline

`utils/extended-world` contains:

- deterministic Perry and imported-city resource generators;
- IMG packing and compact metadata generation;
- radar extraction and catalog generation;
- model-store and executable patch validators;
- native-world manifest and closed-payload parsing;
- format-3 multi-IMG packaging, aggregate no-mutation planning, selected-set envelopes, and registrar-generation checks;
- reviewed Bullworth, Vice City, Liberty City, and Carcer City radar-resource generation;
- immutable cache identity and publication tests;
- transport, startup authorization, and server-isolation policy tests.

Generated city game assets remain outside Git.

The native-world generator pins its RenderWare conversion step to `Southland-FR/librw` commit `e91821e09ca9957e22c99ecf32438d8098c0ea75`. That keeps regenerated payloads reproducible instead of silently following a moving converter branch.

## Focused test resources

Representative resources include:

| Area | Harnesses |
| --- | --- |
| World boundaries | `extended-world-test`, `extended-water-test`, `pickup-position-test`, `seabed-boundary-test` |
| Native pools | `corona-limit-test`, `marker-limit-test`, `renderer-limit-test` |
| Rendering | `project2dfx-test`, `fog-distance-test`, `cull-zone-test`, `cull-mirror-floor-test`, `extended-radar-test`, and generated native-world radar resources |
| Models and streaming | `server-model-registry-test`, `city-residency-coordinator`, `native-simulation-lease-test`, and generated city resources |
| Synchronized traffic | `native-ped-traffic` for civilian proposal, owner epochs, native Wander, avoidance, threat, damage response, moving-vehicle/airborne reactions, jump/climb handoff, cop locomotion and patrol, couple formation and presentation, observer presentation, and deterministic cleanup |
| Dynamic world objects | `world-object-scripting-harness` for proxy discovery, live transform tracking under player and vehicle pushes, damage/break feedback, matrix read/write, refused `destroyElement`, a push objective, and stream-out/stream-in element identity |
| Runtime collision | `CRuntimeColModel_Tests` unit tests for serialization, multi-mesh index offsetting, and rejection cases; `runtime-collision-wall-demo` for interactive wall/ramp drawing, live rebuilds while standing on the shape, a collision outline, and a vehicle impact test |
| Custom foliage | `foliage-test` for the seven-function regression, runtime surface probing, density bounds, dimension and lifetime behavior, and a 64-slot cap test; `foliage-draw-demo` for interactive triangle drawing with live surface and density changes |
| Story primitives | focused go-to, enter, exit, drive-wander, route, drive-by, mission-ped, gang-tag, camera, cutscene, braking, audio, and recording resources |
| Mission checkpoints | `tagging-up-turf`, `drive-thru`, `nines-and-aks`, `story-entry-exit-runtime`, and `story-entry-exit-test` |
| Compatibility | `fastweaponstrafe-toggle`, `world-sync-regression-test`, packet capability tests, and mixed-recipient serialization cases |
| Native world | legacy transport/startup resources plus format-3 child-pack, selected-set, aggregate planner, cache, registrar, and generation-fence harnesses |
| Multi-client development | isolated `-cl2` client state and the `MTA Neon Duo` launcher described in [`MULTI_CLIENT.md`](https://github.com/Dryxio/mtasa-neon/blob/master/MULTI_CLIENT.md) |
| Performance | `entity-performance-test` with repeatable model, collision, native-cost, and traversal profiles; `fps-counter` for a simple local `/fps` display |

An API page labels an explicitly assigned resource as **Test resource**. When it only inherits a category-wide pointer, the page says **Related category harness**; that is discovery help, not a direct per-function validation claim.

## Current verification matrix

| System | Strongest evidence | Not yet proved |
| --- | --- | --- |
| Extended coordinates and world RPCs | Boundary resources, mixed-recipient serialization tests, and in-game extended positions | Every upstream API at the full boundary and every third-party resource assumption |
| Radar, water, pickups, and seabed | Focused lifecycle resources and in-game extended-world checks | A complete world package with all optional GTA subsystems |
| Renderer and native pools | Focused stress resources exceeded historical ceilings; the 20,363-light startup catalogue and private 25,000-entry Project2DFX queue were checked in game | Every capacity under one production workload, broad distant-light performance, and the post-fix headlight/shader visual pass |
| SkyGFX | Affected projects built; selected color/radiosity and later YCbCr paths were checked in game | Full SkyGFX or PS2 parity, every weather/resolution/mod combination, and a broad performance matrix |
| Neon client and server browser | Startup, navigation, joining, localization, artwork, and cache paths received targeted implementation/runtime work | One exhaustive clean-install, DPI, aspect-ratio, offline, password, cache, and language matrix |
| Neon Identity | Service tests and development OAuth/ticket/required-auth flows; Lua registrations traced in final code | A checked-in MTA resource asserting all getters and identity-aware ban paths, key-rotation overlap, and a general owner portal |
| Custom vehicle audio | Client build plus manual AE86/Soundize-bank and BUST gameplay runs | A public reproducible config/bank resource and a focused automated or multiplayer playback matrix |
| Custom model registry | Server/client registry harnesses plus spawn, replacement, free, and parent-fallback runtime checks | Universal behavior for arbitrary resource combinations and legacy fallback expectations |
| Native world packs | Format-3 multi-IMG transport, exact selected-set audit, four-city generations 2–29, direct switching, bank reuse, reconnect, resource/server restart, and non-contiguous selection | Arbitrary worlds, all possible pack combinations, optional GTA subsystems, and a true D3D device reset |
| Synchronized pedestrian traffic | Two-client runs covered civilian spawning, 23 owner changes, native Wander, avoidance, aimed-at and damage reactions, moving-vehicle recovery, three airborne handoffs, climb/vault handoff, flee, and zero-owned-ped shutdown | Ambient vehicles, other population families, headless simulation, universal task snapshots, and perfect collision-frame agreement |
| Ambient cops | A two-client cop-locomotion oracle requiring three metres of native patrol, one owner at a time, an unchanged wanted level, no forbidden police task, one handoff epoch, and two cleanup ACKs | Rare path and RNG branches are recorded as evidence rather than required outcomes; there is deliberately no pursuit or arrest behavior to prove |
| Ambient couples | Atomic pair formation, leader selection from native walk speeds, and the separate observer presentation lease, with per-member reciprocity and role diagnostics | Long-run couple churn under heavy density and every native walk-side branch |
| Dynamic world objects | Client-only harness covering discovery, live transforms under player and vehicle pushes, damage and break events, matrix writes, destroy refusal, and preserved element identity across stream-out and stream-in | Server-side or synchronized behavior, object health and break-state properties, and behavior under arbitrary Lua-driven transform fighting |
| Runtime collision generation | Unit tests for mixed sphere/box/mesh serialization, multi-mesh index offsetting, and each rejection path; an interactive resource covering live rebuilds while a player stands on the shape, shape switching, and vehicle impact | Large mesh models at the documented ceilings, sustained per-frame regeneration cost, and every GTA surface material's physical response |
| Custom foliage | A scripted regression over all seven functions, density bounds, degenerate-triangle and out-of-range rejection, dimension change and restore, OOP registration, and element-group teardown; plus create/destroy stress cycles | The rendered plant count, which GTA owns and Lua cannot read back; behavior under a natively saturated plant pool, where a sub-64 cap result is inconclusive rather than a failure |
| Story primitives | Focused task, lease, camera, cutscene, audio, text, recording, gang-tag, and route checks; reusable two-client channels cover locomotion, ordered animation, fight/chat, weapon audiovisuals, and selected physical responses | General task completion events, arbitrary syncer reconstruction, universal task presentation, and frozen-owner heartbeat recovery |
| Mission checkpoints | Tagging Up Turf has a complete two-client success path; Drive-Thru has two-client pursuit and weapon-presentation coverage plus a complete single-client return path; Nines has partial runtime coverage | The remaining per-resource branches and a complete two-client matrix for Drive-Thru and Nines; see [Mission checkpoints](/neon/mission-checkpoints) |
| Compatibility and packaging | Capability-gated ordinary layouts, exact Neon native-world protocol rejection, installer/package checks, localhost connection, packaged Windows and Linux x64 server startup smoke tests, and Linux ARM64 package inspection | Linux ARM64 startup, runtime validation of `fastweaponstrafe`, and every experimental feature in the public package |

This matrix is intentionally scoped. Exact timings, temporary ticket IDs, build-log excerpts, and one-off debugging observations belong in commits or test records rather than the evergreen guide.

## Local asset previews

Neon includes developer-only drop workflows:

- one DFF and optional TXD can preview a replacement of the local player's current base skin;
- one IFP loads an animation list; a single animation starts immediately, while several animations open searchable controls for looping, freeze-last-frame, root motion, speed, and blend.

Inputs are size-bounded and use existing validation and replacement paths, but there is no server authorization. These are local development tools, not secure multiplayer features.

## Reading API provenance

Each Neon API page keeps its implementation source and introducing or extending commit. Where known, it also links a direct test resource. These links provide traceability; they do not replace the evidence scope stated in the guide or matrix.

For playable story coverage, use [Mission checkpoints](/neon/mission-checkpoints). For native-world security, lifecycle, and current boundaries, use [Native world packs](/neon/native-world).
