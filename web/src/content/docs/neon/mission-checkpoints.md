---
title: Mission checkpoints
description: Explore five GTA mission recreations built from the public Lua APIs documented here.
sidebar:
  order: 7
---

Explore and inspect five GTA mission recreations—`Sweet & Kendl`, `OG Loc`, `Tagging Up Turf`, `Drive-Thru`, and `Nines and AK's`—built from the public Lua APIs documented here.

They are useful for two reasons. Players can explore recognizable mission paths, and resource authors can inspect working combinations of native tasks, file cutscenes, cameras, mission audio and text, gang tags, route handoffs, actor policies, and cleanup.

These are regression checkpoints, not a finished campaign runtime. “Implemented” means the resource contains the path. “Exercised” means that exact path was observed in game. Static checks or successful builds alone are not presented as gameplay validation.

<!-- MEDIA PLACEHOLDER: Mission checkpoint gallery. Add Sweet & Kendl and OG Loc to the existing Tagging Up Turf, Drive-Thru, and Nines and AK's set. Link each still to a captioned gameplay video and keep the evidence label consistent with the status table below. -->

## Current status

| Resource | What is currently available | Strongest evidence | Still open |
| --- | --- | --- | --- |
| `sweet-and-kendl` | Both stock `INTRO1` cutscenes, Smoke's in-world scene, funeral drive-by, co-op BMX ride, Ballas chase, split and return, recorded-car finale, save-house tutorial, failures, reward, and cleanup | Two consecutive two-client headless passes covered the complete graph, both native-task ownership phases, handoff, synchronized results, and teardown; a natural two-client run also reached the Smoke scene through real cutscene start and skip | Complete human review of natural cameras, audio, dialogue timing, combat presentation, and every failure/restart path |
| `og-loc` | Both stock `SMOKE1` cutscenes, Grove/police/Freddy's-house scenes, recordings 30–40, ten obstacle vehicles, distance-based chase speed, basketball-court fight, Burger Shot return, failures, reward, and cleanup | Two consecutive two-client headless passes covered the complete mission graph, every chase recording, native ownership, combat result, return, reward, and teardown | Complete natural two-client replay after the latest transition fixes; full human review of cameras, audio, chase, combat, death scene, and failures |
| `tagging-up-turf` | Native `SWEET1A`, the following world intro, gang-tag objectives, Ballas encounter, Grove Street finale, reward, and cleanup | A complete two-client success path covered synchronized cutscene start/skip, locomotion, spray FX, both Ballas tags, chat and melee presentation, return, finale, reward, cleanup, and CJ appearance restoration | Failure, abort, resource-stop restoration, native file-cutscene subtitles, and remaining adapted or uncertain SCM branches |
| `drive-thru` | Native `SWEET2A` and `SWEET2B`, authoritative seating, Cluckin' Bell gate, Ballas chase, vehicle-to-foot combat, return scenes, reward, and an off-stream failure simulation | Complete single-client route plus a two-client pursuit covering vehicle and on-foot weapon presentation, authoritative damage, both Ballas deaths, and stale-presentation cleanup | Low-health branches, every reminder variant, native subtitles, frozen-owner reassignment, the intermittent restaurant reconstruction timeout, and a complete two-client return path |
| `nines-and-aks` | Both stock cutscenes, Emmet range, bottle rounds, Tampa objective, return drive, phone and Binco path, entry-exit transaction, pass/fail, and cleanup logic | Static/resource checks plus partial in-game progress through the Emmet range and automatic Binco transition | Fresh end-to-end bottle, Tampa, departure, Binco exit, alternate failure and cleanup matrix; complete multiplayer pass |

The resources use server-owned mission state and are structured for multiple participants. That architecture is not the same as a completed in-game multiplayer validation. Until the open barriers above are exercised together, the wiki describes multiplayer support as experimental.

## Sweet & Kendl

`test-resources/sweet-and-kendl` rebuilds the first San Andreas mission as a co-op checkpoint. Every connected player rides a separate BMX while one client runs the native gang and Ballas AI. The server owns the route, objectives, pass/fail state, rewards, and cleanup.

The resource keeps the recognizable mission flow: `INTRO1A` and `INTRO1B`, Smoke's Peren scene, the funeral drive-by, the first bike ride, Ballas pursuit, split and return, recordings `201`, `205`, and `206`, the save-house tutorial, and the three-respect reward. `/sweetandkendl` starts the presentation path; the headless command exercises the same mission graph with bounded automatic gates.

Two consecutive two-client headless runs ended in `PASS`, including both task-cohort ownership phases and cleanup. A natural two-client run also loaded and skipped the real opening cutscene and entered Smoke's world scene. That is strong multiplayer logic evidence, but it is not a complete human review of every camera, sound, line, fight, failure, restart, or resource-stop transition.

## OG Loc

`test-resources/og-loc` rebuilds the OG Loc mission as a synchronized co-op checkpoint. Every player participates in the ride; one client owns Freddy, his PCJ-600, and the native recorded paths while the server owns mission progress and validates the result.

The path includes `SMOKE1A` and `SMOKE1B`, the Grove, police, and Freddy's-house scenes, chase recordings `30` through `40`, ten recorded obstacle vehicles, GTA's distance-based playback speed, the basketball-court fight, Burger Shot return, failure labels, five-respect reward, and cleanup.

Two consecutive two-client headless runs completed the full graph, every chase recording, combat result, return, reward, and teardown. A natural run reached the stock opening, synchronized skip, Grove sequence, and delayed travel audio before the test's participant-death guard stopped it. Later world-transition and cutscene-barrier fixes still need a fresh natural replay, so the full visual, camera, audio, chase, and combat presentation remains open.

## Tagging Up Turf

`test-resources/tagging-up-turf` is the broadest first example of the story runtime.

It combines:

- managed native file-cutscene loading and release;
- server readiness and cleanup barriers;
- synchronized mission text and audio;
- native camera shots and fades;
- actor movement, social and combat tasks;
- resource-owned gang-tag progress;
- story actor and vehicle policies;
- player appearance snapshot and restoration;
- reward presentation and deterministic teardown.

The complete two-client success run reached its reward with camera, audio, clothing, actor, vehicle, and gang-tag state restored. It covered native `SWEET1A` startup and synchronized skip, the world intro, matched walk/run intent, Sweet's spray animation and FX, both Ballas tag objectives, remote paired-chat gestures, synchronized melee presentation, recording `207`, the return drive, all seven finale lines, handshake, walk-away, reward, and CJ appearance restoration.

The non-syncer never receives Sweet's authoritative spray task, tag progress, melee decisions, or damage authority; it reconstructs only the supported presentation. The resource is still not proof of full SCM parity. Campaign bookkeeping and save progress are outside the harness, native file-cutscene subtitles remain unresolved, and the failure, abort, resource-stop restoration, plus several adapted or uncertain branches still need separate runtime passes.

## Drive-Thru

`test-resources/drive-thru` exercises longer-lived actors and vehicles than the first checkpoint.

Its main path combines:

- two managed native file cutscenes;
- server-confirmed passenger seats;
- the exact native all-wheel arrival predicate;
- mission audio and dialogue barriers;
- native vehicle routes that remain meaningful beyond ordinary stream range;
- syncer-aware route reconstruction;
- native drive-bys with real damage in both directions;
- transition from vehicle combat to on-foot combat;
- return scenes, mission-passed presentation, and cleanup.

The main single-client route has completed from the opening through the reward. A two-client pursuit then checked Sweet, Ryder, and the Ballas passenger firing from vehicles, both surviving Ballas firing on foot, authoritative Voodoo damage, both Ballas deaths, and removal of stale presentation before `return_grove_drive`. The observer reproduced animation, muzzle flash, shells, light, audio, and spray FX without applying damage or creating projectiles. One fast-motion aim sample lagged the visible target by roughly 12 metres and one heading differed by about 37 degrees until the next update.

A separate distant simulation exercised off-stream entities, coordinate drive-by, immediate vehicle exit, smart flee, scripted failure, camera restoration, and cleanup.

This does not cover every branch. The four Greenwood low-health windows still need dedicated passes, and not every return-to-car reminder has been observed. The current native mission-event profile does not expose every original decision-maker behavior. A connected owner that freezes without disconnecting is not yet reassigned by heartbeat.

## Nines and AK's

`test-resources/nines-and-aks` maps the multiplayer-visible `sweet2` graph through the Binco return.

The implemented graph includes:

- `SWEET3A` and `SWEET3B` managed file cutscenes;
- the Glendale trip and all-wheel gates;
- Smoke and Emmet actor lifecycles;
- one-, three-, and five-bottle range rounds;
- timed cameras and native shooting tasks;
- the Tampa weakpoint and destruction gate;
- departure and return sequences;
- phone, Binco, entry-exit, pass/fail, and cleanup states.

The resource has been exercised through the Emmet range and later through automatic Binco entry. Those runs found cutscene-model, visibility, camera, and terminal-barrier problems that were corrected in code. Guards were also added for oversized volumetric shadows and invalid streamed IK bone chains, but the original crash timing was not reproduced afterward. A successful correction build does not replace the missing end-to-end run: the full bottle timing, Tampa, departure, automatic exit, alternate failures, cleanup, and multiplayer path remain only partially exercised.

Some differences from SCM are deliberate multiplayer adaptations. Client damage reports replace direct object-damage polling, and server state replaces local mission progression. Campaign respect, contacts, shop purchases, save statistics, and several unexposed native task graphs remain outside the resource.

## Reusing the checkpoints

The mission resources are examples, not a required framework. A new resource can use the underlying APIs directly.

The reusable design is:

1. keep mission state and participant authority on the server;
2. assign each native ped or vehicle to its current simulator;
3. acquire camera, cutscene, audio, text, streaming, and event-profile ownership explicitly;
4. cross server barriers before synchronized presentation changes;
5. treat local task completion and damage as reports to validate;
6. release every token and restore every client-local policy on success, failure, timeout, player departure, and resource stop.

See [Story runtime](/neon/story-runtime) for the primitives and lifecycle rules. See [Tooling and verification](/neon/tooling-and-verification) for the meaning of each evidence level and the focused resources behind these checkpoints.
