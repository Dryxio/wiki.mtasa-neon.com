---
title: Tooling and verification
description: Neon's asset pipelines, validators, focused test resources, profiling, and verification standards.
sidebar:
  order: 8
---

The tools matter as much as the patches. Deep GTA changes need exact executable identities, patch manifests, validation scripts, focused builds, repeatable test resources, and real gameplay evidence.

## How Neon is verified

Neon features are checked at several levels because no single result proves the whole gameplay path:

- patch guards check the exact supported GTA executable before native memory is changed;
- the affected client and server projects must compile together when they share an ABI or protocol;
- static checks and focused tests cover formats, limits, ownership, cleanup, and failure paths;
- small test resources exercise one system at a time;
- in-game checks cover connection, resource restart, reconnection, cleanup, and ordinary San Andreas behavior after the feature is disabled.

## Extended-world pipeline

`utils/extended-world` contains:

- deterministic Perry and imported-city resource generators;
- IMG packing and compact metadata generation;
- radar extraction and catalog generation;
- native model-store and executable patch validators;
- runtime native-world manifest parsing;
- closed native payload validation matching the C++ grammar;
- immutable cache identity and publication tests;
- native-world transport and authorization policy tests.

Generated city game assets remain outside Git.

## Focused test resources

Representative resources include:

| Area | Harnesses |
| --- | --- |
| World boundaries | `extended-world-test`, `extended-water-test`, `pickup-position-test`, `seabed-boundary-test` |
| Native pools | `corona-limit-test`, `marker-limit-test`, `renderer-limit-test` |
| Rendering | `project2dfx-test`, `cull-zone-test`, `cull-mirror-floor-test`, `extended-radar-test` |
| Models/streaming | `server-model-registry-test`, `city-residency-coordinator`, `native-simulation-lease-test`, UG/Carcer/Bullworth resources |
| Story primitives | native ped go-to/enter/exit/drive-wander, `native-drive-route-test`, `native-drive-by-test`, `native-mission-ped-test`, `native-gang-tag-test`, camera, file cutscenes, braking, audio, recording, `tagging-up-turf`, `drive-thru`, `nines-and-aks`, `story-entry-exit-runtime`, and `story-entry-exit-test` |
| Compatibility | `fastweaponstrafe-toggle` for the synchronized glitch and native-walking combination; no in-game verdict is recorded yet |
| World RPCs | `world-sync-regression-test` for per-recipient `moveObject` and collision-polygon serialization |
| Native world | `native-world-transport-test`, `native-world-static-transport-test`, `native-world-static-startup-test`, plus focused Python audit/cache/authorization/isolation tests |
| Performance | `entity-performance-test` with recorded baseline, varied-model, native-cost, and collision-attribution results |

## Local asset previews

Neon includes developer-only drop workflows:

- one DFF and optional TXD can preview a replacement of the local player's current base skin;
- one IFP loads an animation list; a single animation starts immediately, while multiple animations open searchable playback controls for looping, freeze-last-frame, root motion, speed, and blend.

Inputs are size-bounded and use the existing validation/replacement paths, but there is no server authorization. These are local prototypes, not production features.

## Verification language

Each feature page labels its evidence clearly:

- compiled successfully;
- passed static/unit/format validation;
- reached a running server;
- was exercised in game;
- remains a prescribed regression test;
- remains experimental or still needs runtime validation.

A successful build proves that the code compiles; it does not prove the gameplay path. Native-world executable writes, downloaded data, authorization, cache leases, worker cancellation, native object lifetimes, and large pool allocations all need their own focused review before the docs claim runtime success.

The current native-world suite reports 103 focused tests with two fixture-dependent skips. Live gates separately covered format-1 and format-2 publication, restart, native activation, exact reconnect, resource lifecycle, cache-refusal paths, and active-process rejection of a different server target.

The completed stores/pools checkpoint installs 42,341 FileIDs, 8,000 TXDs, 512 COLs, 1,024 IPLs, 32,000 buildings, 30,000 ColModels, and 2,048 QuadTreeNodes. Its opt-in native harness passed the COL `255/256/511` and IPL `255/256/1023` boundary pairs, and a user-run Bullworth/SA gate covered repeated travel, minimize/restore, and death/respawn without an overflow or crash. This proves the exercised capacities and boundary rollback, not multi-IMG transport or a second-city activation.

The native `SWEET1A` path has passed a complete single-player run at GTA's original animation speed, including its moving spray prop, the following world intro, and final camera/audio restoration. The multi-participant load, skip, finish, and release barriers still need live validation before the co-op path is considered complete.

Drive-Thru has now completed its main single-client route: `SWEET2A`, authoritative seating, the Cluckin' Bell all-wheel gate, `SWEET2B` in `83,313 ms`, world reconstruction, the Ballas chase with real bidirectional damage, the vehicle-to-foot transition, the Grove and Smoke returns, and the $200 reward. A separate `/drivethrusimfar` run covered the off-stream route, coordinate drive-by, scripted failure, and camera cleanup. The low-health Greenwood branches, `DM_PED_MISSION_EMPTY`, every reminder variant, and multi-client cutscene barriers still need dedicated runtime passes.

Nines and AK's passes Lua/XML checks and the affected `Game SA` and `Client Deathmatch` Release Win32 builds. User testing reached the Emmet range and then the automatic Binco transition, exposing file-cutscene, visibility, camera, and terminal-barrier problems that were corrected. The full bottle/Tampa/departure/Binco/cleanup matrix and multiplayer path still need a fresh complete run; the wiki does not present the mission as fully validated.
