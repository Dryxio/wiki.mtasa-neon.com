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
| Populate the world with synchronized GTA NPCs | [Synchronized NPCs and traffic](/neon/synchronized-ai) | Shared civilians, native gang groups, gang combat, motorcycle carjacks, dealers, city cops, and civilian couples use GTA's population/task systems with server ownership and client handoff. Ambient vehicles and other population families remain open. |
| Script San Andreas' own physics props | [Scriptable dynamic objects](/neon/world-objects) | GTA-owned dynamic objects appear as client `worldobject` elements with live transforms plus damage and break events. GTA keeps physics ownership. |
| Build collision shapes from script | [Runtime collision generation](/neon/runtime-collision) | Describe collision as a Lua table of spheres, boxes and meshes instead of shipping a `.col`, and rebuild it live on models already in the world. |
| Grow vegetation anywhere | [Custom foliage](/neon/foliage) | Hand GTA's native plant manager a triangle, a surface and a density, and it grows its own grass there with normal rendering and wind. |
| Control fire as a real element | [Managed fire](/neon/fire) | Server-synchronized `fire` elements that keep their identity, can be retargeted onto a moving element, and are changed while burning. |
| Fill the sky with controllable birds | [Scriptable birds](/neon/birds) | Client `bird` elements with their own renderer, steerable flight, restyling and optional gunshot hit testing, past GTA's six native ambient slots. |
| Light the world with GTA's own effects | [Model 2DFX effects](/neon/model-2dfx) | Read, edit, add and remove the 2DFX records baked into GTA models: lights with native blink modes, particles, roadsign text, escalators and sun glare. |
| Break any object, not just the prepared ones | [Object fracture effects](/neon/break-effects) | Fragments cut from an object's live RenderWare geometry at runtime, with durability profiles so ordinary GTA damage triggers the break. |
| Give an object real physics | [Dynamic object physics](/neon/object-physics) | Opt an MTA object into GTA's rigid-body simulation, with position, rotation and both velocities synchronized across clients. |
| Load SA-MP / Texture Studio maps | [SA-MP maps](/neon/samp-maps) | Parse Pawn exports directly, resolve SA-MP custom objects, apply material slots, building removals, interiors/worlds, and redistribute the fixed object-streaming budget when needed. |
| Give the game a PS2-style image or DE radar | [SkyGFX, radar, and client visuals](/neon/skygfx) | Selected SkyGFX effects, a Definitive Edition radar profile, layout controls, and resource-owned temporary visual overrides. |
| Read or synchronize GTA radio playback | [Native GTA radio playback](/neon/native-radio) | Capture and restore the real GTA radio station/track/position/queue state; multiplayer synchronization remains resource-owned. |
| Discover and join Neon servers | [Neon client experience](/neon/client-experience) | A GTA-style menu combines the public registry with live server data, filters, favorites, artwork, localization, and connection states. |
| Add verified community identity | [Neon Identity](/neon/identity) | Servers can choose disabled, optional, or required Neon/Discord identity and use verified IDs in resources and bans. |
| Give custom vehicles their own sound | [Custom vehicle audio](/neon/vehicle-audio) | One client resource owns a configuration lease and presents opted-in vehicles through the packaged FMOD runtime. |
| Use more of the world | [Extended world](/neon/extended-world) | A 20 km XY domain with matching sectors, water, radar, map, pickup, and network work. |
| Load static worlds through GTA | [Native world packs](/neon/native-world) | A server can select an ordered set from the reviewed city packs. One imported city is resident at a time; changing the selected set requires the documented lifecycle. |
| Give resources stable custom model IDs | [Custom models](/neon/models-and-streaming) | Server identities map to local GTA slots with native-parent fallback and cleanup. |
| Build GTA-style scenes or missions | [Story runtime](/neon/story-runtime) | Native tasks, camera and cutscene leases, mission audio and text, recordings, and actor policies. |
| See what the mission harnesses prove | [Mission checkpoints](/neon/mission-checkpoints) | Tagging Up Turf and Drive-Thru have substantial in-game coverage; Nines and AK's remains partially exercised. |
| Call a specific function | [Neon Lua API](/neon/functions) | Searchable reference with side, lifecycle, source, commit, native mapping, and test evidence. |

## World and streaming

![Rooftop view over Los Santos: distant buildings are flat low-detail blobs in MTA:SA and resolve into detailed geometry in Neon](/neon-media/compare-draw-distance.jpg)

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
| Native minimap | Fixed 12 × 12 stock grid | Sparse 40 × 40 logical grid plus Vanilla/Definitive client radar profiles |
| F11 map | Packaged San Andreas image | Runtime atlas composed from native and registered extended tiles |
| MTA object streaming split | Fixed 500 normal / 500 low-LOD | Same 1000-slot hard budget, resource-adjustable split including 1000/0 |
| SA-MP map exports | Conversion normally required | Native Texture Studio/Pawn parser, custom-object loader, removals, worlds/interiors, and the `SetDynamicObjectMaterial` slots a retextured map depends on |
| Large IMG-backed cities | Basic client IMG links | Bounded resource-managed residency and safe city switching |
| Native world packs | Not available | Legacy single-pack formats plus format-3 multi-IMG child packs, an audited selected-set coordinator, immutable cache, and owner-server isolation |
| Reviewed native-world catalog | Not available | Bullworth, Vice City, Liberty City, and Carcer City; automatic spatial residency with one imported city active at a time |

## Rendering and native pools

![Night view over the city: fogged out beyond a short distance in MTA:SA, full skyline with hundreds of distant lights in Neon](/neon-media/compare-project2dfx.jpg)

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
| PS2-style post effects | Not built in | Integrated SkyGFX color filter, YCbCr and depth-bias first-run profile; blur and radiosity remain opt-in |
| Radar renderer | Stock GTA radar | Configurable Vanilla or Definitive Edition profile with widescreen-safe layout controls |
| Resource visual overrides | No Neon layer | Allowlisted radar/SkyGFX settings stack by resource and restore player preferences on stop |
| Native CULL editing | Internal only | Resource-owned Lua CRUD, stable IDs, and cleanup |
| Project2DFX distant lights | Not integrated | Opt-in static coronas and timed traffic lights from the complete startup IPL catalogue, using a private 25,000-light render queue |

## Models and gameplay

![A cardboard box bound to a worldobject element, tracked with a live label next to a green objective zone](/neon-media/world-objects-poster.jpg)

| Area | Standard MTA:SA | Neon |
| --- | --- | --- |
| Custom model identity | Client-local runtime allocation | Server-stable logical IDs mapped to per-client GTA slots |
| Supported server model types | Not available | Objects, vehicles, and peds with native-parent fallback |
| SA-MP custom-object identity | Not integrated | Original SA-MP IDs resolved to resource-owned Neon runtime models by the reference loader |
| Model-native ped locomotion | No synchronized explicit mode | Shared Lua policy that follows skin changes and recreation |
| Ambient pedestrian population | Local GTA population remains disabled | Server-owned civilians, native gang groups, dealers, and city cops proposed from GTA's popcycle/model/path rules with owner epochs and cleanup |
| Ambient gang behavior | Local-only single-player logic | Owner-only native groups with leader/follower movement, fight/flee decisions, gang weapons, synchronized damage admission, and bike-jack handoff |
| Ambient city cops | Local-only, and the retail cop task is unsafe on an MTA ped | A safe ambient-cop wander task on GTA's verified base locomotion: real path nodes, pauses, and road crossing with wanted, pursuit, and arrest unreachable by construction |
| Ambient couples | Local-only single-player logic | Atomic two-ped native couple leases with GTA-owned walk side, hand holding, look-at, and give-up distance, plus a separate observer presentation lease |
| Native dynamic objects | Not exposed to scripts | GTA-owned physics props published as client `worldobject` elements with live read/write transforms and cancellable damage and break events |
| Collision authoring | A packaged `.col` file, fixed at build time | Collision serialized from a Lua table of spheres, boxes and meshes, rebuildable in place on models that are already streamed in |
| Vegetation placement | Whatever the shipped map contains | Up to 64 resource-owned `foliage` triangles driving GTA's native plant manager, with live surface and density changes and dimension support |
| Fire | Client-only `createFire`, returning a boolean with no handle | Synchronized `fire` elements with persistent identity, live strength, duration, damage-mask, spread and target changes, past GTA's 60-fire pool |
| Ambient birds | Six native GTA slots, no script access | Resource-owned `bird` elements with steerable flight, colors, wing beat, render distance and shootability; 128 verified at once |
| Model 2DFX effects | Baked into models, not exposed | 13 client functions to read, edit, add and remove them, with per-resource overrides that roll back on stop |
| Breakable objects | Only models shipping the DFF breakable plugin | Any streamed object, fractured from its own geometry with no breakable DFF or fracture metadata |
| Object physics | Objects are static unless scripted frame by frame | Opt-in native GTA rigid-body simulation, with linear and angular velocity synchronized through syncer changes |
| Native ped story tasks | No direct reusable surface | Reusable movement, driving, combat, dialogue, sequence, and actor-policy primitives |
| Native AI on non-syncers | Ordinary synchronized element state | Reusable locomotion, rotation, ordered animation, fight/chat, weapon audiovisual, and selected physical/group presentation without competing AI or duplicate damage |
| Ambient vehicle traffic | Local GTA population remains disabled | Not implemented yet; native vehicle tasks are available for server-authored missions, convoys, escorts, and scripted traffic |
| Native route continuity | Stream range normally ends native simulation | Resource-owned streaming leases plus a server-owned route harness with owner epochs and syncer reconstruction |
| Story actor and vehicle policy | General MTA abstractions | Persistent native actor flags, event-profile leases, raw door locks, tyre policy, vehicle proofs, and mission collision loading |
| Native script camera | Standard MTA camera setters | Resource-exclusive generation-token lease over GTA primitives |
| Native file cutscenes | Not exposed as a resource-owned API | Stock DAT/CUT/IFP playback with load/start barriers, synchronized skip, fades, completion, and cleanup |
| Stock entry-exit transitions | Native manager disabled by MTA because its entry path crashes | Optional server-owned Lua runtime using audited IPL pairs, exact on-foot triggers, fades, authoritative interior moves, and rollback |
| Mission audio | No owned GTA mission slots | Four resource-owned native slots with load recovery and cleanup, plus the original mission-passed tunes |
| GTA radio playback state | Not exposed to Lua | Client Lua snapshot/restore for station, track, seek position and queue; resources can relay it between clients |
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
- A native SA-MP map parser/loader fixture, object-streaming quota harness, native-radio playback resource, and a world-object scripting showcase.
- Focused test resources for engine limits, world systems, native tasks, synchronized population, scene primitives, mission checkpoints, compatibility, and cleanup.
- A CI-built Windows Neon installer with its own branding, registry state, protocol registration, shortcuts, and uninstall path, isolated from an existing official MTA installation.

See [Tooling and verification](/neon/tooling-and-verification) for the broader test-level definitions. A successful build or static check is not described as an in-game pass.

## API inventory

The [Neon Lua API](/neon/functions) is generated from the final C++ registrations and documents both Neon additions and existing MTA functions whose side, task, or lifecycle contract Neon extends. Each entry identifies its actual side, implementation commit, ownership rules, failure conditions, and focused test resource when one exists.
