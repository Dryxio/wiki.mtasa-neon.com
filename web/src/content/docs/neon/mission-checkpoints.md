---
title: Mission checkpoints
description: Story resources that exercise Neon's mission primitives, with honest validation scope and remaining gaps.
sidebar:
  order: 7
---

Neon includes three story resources built from the same public primitives available to other resources: `Tagging Up Turf`, `Drive-Thru`, and `Nines and AK's`.

They are useful for two reasons. Players can explore recognizable mission paths, and resource authors can inspect working combinations of native tasks, file cutscenes, cameras, mission audio and text, gang tags, route handoffs, actor policies, and cleanup.

These are regression checkpoints, not a finished campaign runtime. “Implemented” means the resource contains the path. “Exercised” means that exact path was observed in game. Static checks or successful builds alone are not presented as gameplay validation.

## Current status

| Resource | What is currently available | Strongest evidence | Still open |
| --- | --- | --- | --- |
| `tagging-up-turf` | Native `SWEET1A`, the following world intro, gang-tag objectives, Ballas encounter, Grove Street finale, reward, and cleanup | Main single-client path and finale exercised in game | Complete multi-participant cutscene, appearance, skip, finish, and restoration pass; latest parity adjustments need a fresh runtime pass |
| `drive-thru` | Native `SWEET2A` and `SWEET2B`, authoritative seating, Cluckin' Bell gate, Ballas chase, vehicle-to-foot combat, return scenes, reward, and an off-stream failure simulation | Main single-client route and one distant failure path exercised in game | Low-health branches, every reminder variant, native subtitles, frozen-owner reassignment, and complete multi-client barriers |
| `nines-and-aks` | Both stock cutscenes, Emmet range, bottle rounds, Tampa objective, return drive, phone and Binco path, entry-exit transaction, pass/fail, and cleanup logic | Static/resource checks plus partial in-game progress through the Emmet range and automatic Binco transition | Fresh end-to-end bottle, Tampa, departure, Binco exit, alternate failure and cleanup matrix; complete multiplayer pass |

The resources use server-owned mission state and are structured for multiple participants. That architecture is not the same as a completed in-game multiplayer validation. Until the open barriers above are exercised together, the wiki describes multiplayer support as experimental.

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

The principal single-client path has reached its reward with camera, audio, clothing, actor, vehicle, and gang-tag state restored. The Grove Street finale has also been exercised with native dialogue presentation and facial movement.

The resource is not proof of full mission parity. Campaign bookkeeping and save progress are outside the harness. The latest parity work around player loadout, spray ammunition, prompts, vehicle placement, and failure conditions has passed resource checks but still needs a fresh in-game run. Co-op appearance and cutscene lifecycle remain the most important open gate.

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

The main single-client route has completed from the opening through the reward. A separate distant simulation exercised off-stream entities, coordinate drive-by, immediate vehicle exit, smart flee, scripted failure, camera restoration, and cleanup.

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

The resource has been exercised through the Emmet range and later through automatic Binco entry. Those runs found cutscene-model, visibility, camera, and terminal-barrier problems that were corrected in code. A successful correction build does not replace the missing end-to-end run: the full bottle timing, Tampa, departure, automatic exit, alternate failures, cleanup, and multiplayer path remain only partially exercised.

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
