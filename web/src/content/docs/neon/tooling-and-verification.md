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
- immutable cache identity and publication tests;
- transport, startup authorization, and server-isolation policy tests.

Generated city game assets remain outside Git.

## Focused test resources

Representative resources include:

| Area | Harnesses |
| --- | --- |
| World boundaries | `extended-world-test`, `extended-water-test`, `pickup-position-test`, `seabed-boundary-test` |
| Native pools | `corona-limit-test`, `marker-limit-test`, `renderer-limit-test` |
| Rendering | `project2dfx-test`, `cull-zone-test`, `cull-mirror-floor-test`, `extended-radar-test` |
| Models and streaming | `server-model-registry-test`, `city-residency-coordinator`, `native-simulation-lease-test`, and generated city resources |
| Story primitives | focused go-to, enter, exit, drive-wander, route, drive-by, mission-ped, gang-tag, camera, cutscene, braking, audio, and recording resources |
| Mission checkpoints | `tagging-up-turf`, `drive-thru`, `nines-and-aks`, `story-entry-exit-runtime`, and `story-entry-exit-test` |
| Compatibility | `fastweaponstrafe-toggle`, packet capability tests, and mixed-recipient serialization cases |
| Native world | `native-world-transport-test`, `native-world-static-transport-test`, `native-world-static-startup-test`, plus audit/cache/authorization/isolation tests |
| Performance | `entity-performance-test` with repeatable model, collision, native-cost, and traversal profiles |

An API page labels an explicitly assigned resource as **Test resource**. When it only inherits a category-wide pointer, the page says **Related category harness**; that is discovery help, not a direct per-function validation claim.

## Current verification matrix

| System | Strongest evidence | Not yet proved |
| --- | --- | --- |
| Extended coordinates and world RPCs | Boundary resources, mixed-recipient serialization tests, and in-game extended positions | Every upstream API at the full boundary and every third-party resource assumption |
| Radar, water, pickups, and seabed | Focused lifecycle resources and in-game extended-world checks | A complete world package with all optional GTA subsystems |
| Renderer and native pools | Focused stress resources exceeded historical renderer/pool ceilings with cleanup | Every capacity under one simultaneous production workload; post-fix headlight/shader visual pass |
| Custom model registry | Server/client registry harnesses plus spawn, replacement, free, and parent-fallback runtime checks | Universal behavior for arbitrary resource combinations and legacy fallback expectations |
| Native world packs | Publication, immutable cache, two-launch activation, exact reconnect, server isolation, boundary harnesses, and Bullworth travel | Multi-IMG transport, arbitrary static worlds, aggregate packs, and second-city activation |
| Story primitives | Focused task, lease, camera, cutscene, audio, text, recording, gang-tag, and route checks | General task completion events, arbitrary syncer reconstruction, and frozen-owner heartbeat recovery |
| Mission checkpoints | Main single-client paths are strongest for Tagging and Drive-Thru; Nines has partial runtime coverage | Complete co-op cutscene/mission matrix and the remaining per-resource branches; see [Mission checkpoints](/neon/mission-checkpoints) |
| Compatibility and packaging | Capability-gated layouts, mixed-client fallbacks, installer/package checks, and localhost connection | Runtime validation of `fastweaponstrafe` and every experimental feature in the public package |

This matrix is intentionally scoped. Exact timings, temporary ticket IDs, build-log excerpts, and one-off debugging observations belong in commits or test records rather than the evergreen guide.

## Local asset previews

Neon includes developer-only drop workflows:

- one DFF and optional TXD can preview a replacement of the local player's current base skin;
- one IFP loads an animation list, with searchable playback controls when several animations are present.

Inputs are size-bounded and use existing validation and replacement paths, but there is no server authorization. These are local development tools, not secure multiplayer features.

## Reading API provenance

Each Neon API page keeps its implementation source and introducing or extending commit. Where known, it also links a direct test resource. These links provide traceability; they do not replace the evidence scope stated in the guide or matrix.

For playable story coverage, use [Mission checkpoints](/neon/mission-checkpoints). For native-world security, lifecycle, and current boundaries, use [Native world packs](/neon/native-world).
