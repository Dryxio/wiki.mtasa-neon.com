---
title: Story runtime
description: Native ped tasks, camera leases, mission audio and text, recorded cars, and synchronized mission primitives.
sidebar:
  order: 6
---

Neon exposes reusable GTA story primitives instead of hard-coding a mission in C++. The `Tagging Up Turf` resource tests them together: the server runs the mission, while the current syncer or client handles native tasks, camera work, audio, text, and recorded cars.

## Model-native walking

[`setPedUseNativeWalkingStyle`](/neon/functions/setPedUseNativeWalkingStyle) and [`isPedUsingNativeWalkingStyle`](/neon/functions/isPedUsingNativeWalkingStyle) select the current skin model's native motion group. The state is synchronized, follows model changes and recreation, retains jetpack priority, and coexists with numeric `setPedWalkingStyle` through deterministic last-writer-wins behavior.

## Native ped tasks

The [native task API group](/neon/functions#tasks) includes:

- go-to-and-stand-still with walk/run/sprint, radii, and SCM timeout semantics;
- coordinate `GunControl` shooting plus explicit shooting-rate and accuracy bytes;
- indefinite `DriveWander` road AI with GTA driving styles;
- verified MTA-authoritative enter/exit lifecycles using GTA passenger/leave tasks;
- persistent client-local `PED_MISSION` classification for script peds;
- opt-in gang-tag Grove-material alpha.

Mutating task/combat calls require a living streamed ped simulated by the caller: the local player, a client-local ped, or a server ped for which the client is current syncer.

Current limitations:

- no resource-owned task handles;
- no native completion events;
- no automatic task reconstruction after syncer migration;
- mission-actor policy is client-local and must be replicated/cleared by synchronized resources;
- tag alpha must be reapplied after stream-in or native object recreation.

## Script camera

The [camera API group](/neon/functions#camera) wraps GTA's fixed/look-at, vector move/track, persistence, fade, widescreen, and scripted near-clip primitives.

GTA has one global camera, so Neon gives control to one resource at a time and returns a generation token:

1. `acquireScriptCamera` captures gameplay state and returns a token.
2. Every later call proves both resource ownership and the current generation.
3. Delayed callbacks from an older run fail instead of controlling a new lease.
4. Release restores the captured camera, near clip, widescreen, and optional input inhibition.
5. Stop, restart, disconnect, or an authoritative server camera RPC revokes the lease.

Control inhibition is independent from `toggleAllControls`. Neon raises GTA's native player-safe pad bit so driven vehicles receive the original zero-throttle, full-brake, handbrake, and 0.28 speed-clamp behavior without calling the broader `MakePlayerSafe` routine.

## Mission audio

GTA exposes four physical mission-audio slots. Neon wraps them with generation-scoped resource handles:

- supported native families are 1800..1829 and 2000..45400;
- custom event 65535 is excluded;
- the service never preempts a foreign native slot;
- owned pending loads are periodically re-armed when GTA silently drops the hardware request;
- playback is one-shot per handle;
- shutdown releases every owned event.

Co-op resources should preload on every participant, cross a server readiness barrier, broadcast play, and wait for completion acknowledgements from every client.

## Mission text

GTA has one global loaded mission GXT block. Neon therefore uses an exclusive resource lease rather than last-writer-wins mutation.

The [mission text APIs](/neon/functions#text) load a seven-character block name and expose small `PRINT_NOW`, help, and big-text queues. Main-table keys remain usable during a mission lease, spoken `~z~` lines honor the player's subtitle option, and shutdown clears tracked HUD pointers before releasing ownership. The block itself remains cached until another owner replaces it.

## Recorded-car playback

The [recording APIs](/neon/functions#recording) expose GTA's direct non-looped opcode 05EB semantics over the native 16-slot player.

The calling resource must own the requested recording and the playback slot. The vehicle must be streamed, locally synchronized through the unoccupied-vehicle path, non-frozen, non-blown, and not player-driven. A locally synchronized script ped may remain driver after its competing task is cleared.

Resource shutdown, vehicle destruction, stream-out, or sync ownership loss stops playback. If the network frame is gone, Neon stops instead of guessing where playback should resume.

## Integrated validation

Validation includes:

- isolated go-to, enter, leave, drive-wander, camera, braking, mission-audio, and recorded-car harnesses;
- a 15.011-second native drive covering 71.95 synchronized metres;
- isolated recording 207 completion at 8,087/8,088 ms;
- full mission playback completion at 8,040 ms with 0.00 m endpoint error;
- script-camera fixed/move/track/fade/restoration completion in 8,620 ms;
- resource restart cleanup without a new crash artifact;
- server-authoritative co-op barriers and lifecycle acknowledgements in the mission resource.

Successful builds cover the code path, not the final cinematic feel. Cinematic quality still needs an in-game review.
