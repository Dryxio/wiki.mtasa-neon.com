---
title: What's different in Neon
description: A practical overview of the engine limits, systems, APIs, and tools added by Neon.
sidebar:
  order: 1
---

This page covers **only what MTA:SA Neon changes**. For standard MTA behavior, use the [official MTA Wiki](https://wiki.multitheftauto.com/wiki/Main_Page).

Neon is still experimental. Its capacity patches keep the normal San Andreas defaults unless a server or resource opts into the larger limits.

## Start with what you want to build

| Goal | Start here | Current scope |
| --- | --- | --- |
| Use more of the world | [Extended world](/neon/extended-world) | A 20 km XY domain with matching sectors, water, radar, map, pickup, and network work. |
| Load a static world through GTA | [Native world packs](/neon/native-world) | One audited pack can activate at startup after a controlled two-launch flow. Hot switching is not supported. |
| Give resources stable custom model IDs | [Custom models](/neon/models-and-streaming) | Server identities map to local GTA slots with native-parent fallback and cleanup. |
| Build GTA-style scenes or missions | [Story runtime](/neon/story-runtime) | Native tasks, camera and cutscene leases, mission audio and text, recordings, and actor policies. |
| See what the mission harnesses prove | [Mission checkpoints](/neon/mission-checkpoints) | Tagging Up Turf and Drive-Thru have substantial in-game coverage; Nines and AK's remains partially exercised. |
| Call a specific function | [Neon Lua API](/neon/functions) | Searchable reference with side, lifecycle, source, commit, native mapping, and test evidence. |

## World and streaming

| Area | Standard MTA:SA | Neon |
| --- | ---: | ---: |
| Main world-sector grid | 120 × 120 | 400 × 400 |
| LOD world-sector grid | 30 × 30 | 100 × 100 |
| Supported extended-world XY | About −3,000 to +3,000 | −10,000 to +9,999 |
| Custom-water grid | 12 × 12 / 144 blocks | 40 × 40 / 1,600 blocks |
| Custom-water XY | About −3,000 to +3,000 | −10,000 to +9,999 |
| Pickup visual XY | −4,096 to +4,095.875 | −10,000 to +9,999 |
| Low-precision network XY | About −8,192 to +8,192 | −10,000 to +10,000 on Neon-capable connections |
| Absolute network camera range | About −8,192 to +8,192 | About −16,384 to +16,384 on Neon-capable connections |
| Procedural seabed | Unlimited | Server-configurable 3,000–10,000 or unlimited |
| Native minimap | Fixed 12 × 12 stock grid | Sparse 40 × 40 logical grid with protected stock cells |
| F11 map | Packaged San Andreas image | Runtime atlas composed from native and registered extended tiles |
| Large IMG-backed cities | Basic client IMG links | Bounded resource-managed residency and safe city switching |
| Native world packs | Not available | Audited format-1/format-2 packs, immutable cache, controlled startup activation, and owner-server isolation |
| Multi-city capacity foundation | Stock model stores and FileID layout | Larger FileID, model, TXD, COL, IPL, building, collision-model, and quadtree capacities; second-city activation remains open |

## Rendering and native pools

| Area | Standard MTA:SA | Neon |
| --- | ---: | ---: |
| GTA corona pool | 64 | 4,096; 4,094 available to scripted coronas |
| GTA 3D marker pool | 32 | 4,096 |
| GTA checkpoint pool | 32 | 4,096 |
| Direction arrows | 5 | 4,096 |
| Attribute CULL zones | 1,300 | 4,096 |
| Tunnel CULL zones | 40 | 256 |
| Mirror CULL zones | 72 | 256 |
| Visible entity pointers | 1,000 | 8,192 |
| Visible LOD pointers | 1,000 | 8,192 |
| Streaming RenderWare instances | 2,500 | 30,000 |
| Native CULL editing | Internal only | Resource-owned Lua CRUD, stable IDs, and cleanup |
| Project2DFX distant lights | Not integrated | Opt-in static coronas and timed traffic lights from SALodLights.dat |

## Models and gameplay

| Area | Standard MTA:SA | Neon |
| --- | --- | --- |
| Custom model identity | Client-local runtime allocation | Server-stable logical IDs mapped to per-client GTA slots |
| Supported server model types | — | Objects, vehicles, and peds with native-parent fallback |
| Model-native ped locomotion | No synchronized explicit mode | Shared Lua policy that follows skin changes and recreation |
| Native ped story tasks | No direct reusable surface | Reusable movement, driving, combat, dialogue, sequence, and actor-policy primitives |
| Native route continuity | Stream range normally ends native simulation | Resource-owned streaming leases plus a server-owned route harness with owner epochs and syncer reconstruction |
| Story actor and vehicle policy | General MTA abstractions | Persistent native actor flags, event-profile leases, raw door locks, tyre policy, vehicle proofs, and mission collision loading |
| Native script camera | Standard MTA camera setters | Resource-exclusive generation-token lease over GTA primitives |
| Native file cutscenes | Not exposed as a resource-owned API | Stock DAT/CUT/IFP playback with load/start barriers, synchronized skip, fades, completion, and cleanup |
| Stock entry-exit transitions | Native manager disabled by MTA because its entry path crashes | Optional server-owned Lua runtime using audited IPL pairs, exact on-foot triggers, fades, authoritative interior moves, and rollback |
| Mission audio | No owned GTA mission slots | Four resource-owned native slots with load recovery and cleanup, plus the original mission-passed tunes |
| Mission GXT text | No resource-owned native lease | Exclusive block lease with small/help/big text queues |
| Recorded-car playback | Not exposed | Resource-owned direct non-looped native playback |
| Gang tags | Disabled single-player tag path | Resource-owned native spray hits, persistent 8-alpha progress, Grove rendering, and cleanup |
| Directional scene load | Not exposed | GTA `0A0B` directional preload sequence with finite input validation |
| Vehicle story gates | Approximate public checks | Exact `09D0` all-wheel predicate and verified vehicle-attached script-audio events |
| Fast weapon strafe | Not available | Synchronized `fastweaponstrafe` glitch, disabled by default |

The tables describe available code paths, not one shared stability level. Follow the linked system guide for ownership, limitations, and the evidence behind a particular feature.

## Tools and tests

- Drag-and-drop DFF/TXD skin and IFP animation previews for local development.
- Extended-world generators, IMG packers, radar extractors, manifest validators, cache tests, and native payload audits.
- Focused test resources for engine limits, world systems, native tasks, scene primitives, mission checkpoints, compatibility, and cleanup.
- A CI-built Windows Neon installer with its own branding, registry state, protocol registration, shortcuts, and uninstall path, isolated from an existing official MTA installation.

See [Tooling and verification](/neon/tooling-and-verification) for the test levels and harness index. A successful build or static check is not described as an in-game pass.

## API inventory

The [Neon Lua API](/neon/functions) is generated from the final C++ registrations and documents both Neon additions and existing MTA functions whose side, task, or lifecycle contract Neon extends. Each entry identifies its actual side, implementation commit, ownership rules, failure conditions, and focused test resource when one exists.
