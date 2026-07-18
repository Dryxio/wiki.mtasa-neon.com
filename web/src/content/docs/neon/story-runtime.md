---
title: Story runtime
description: Native ped tasks, file cutscenes, camera leases, mission audio and text, recorded cars, and synchronized mission primitives.
sidebar:
  order: 6
---

Neon exposes reusable GTA story primitives instead of hard-coding a mission in C++. The `Tagging Up Turf` resource tests them together: the server runs the mission, while the current syncer or client handles native cutscenes, tasks, camera work, audio, text, and recorded cars.

## Model-native walking

[`setPedUseNativeWalkingStyle`](/neon/functions/setPedUseNativeWalkingStyle) and [`isPedUsingNativeWalkingStyle`](/neon/functions/isPedUsingNativeWalkingStyle) select the current skin model's native motion group. The state is synchronized, follows model changes and recreation, retains jetpack priority, and coexists with numeric `setPedWalkingStyle` through deterministic last-writer-wins behavior.

## Native ped tasks

The [native task API group](/neon/functions#tasks) includes:

- go-to-and-stand-still with walk/run/sprint, radii, and SCM timeout semantics;
- coordinate `GunControl` shooting plus explicit shooting-rate and accuracy bytes;
- indefinite `DriveWander` road AI with GTA driving styles;
- partner chat, stand-still, seek-offset, on-foot kill, and standard wander tasks;
- per-ped scripted-speech suppression for scenes that provide their own dialogue;
- verified MTA-authoritative enter/exit lifecycles using GTA passenger/leave tasks;
- persistent client-local `PED_MISSION` classification for script peds;
- resource-owned gang tags driven by GTA's real spray hits.

Mutating task/combat calls require a living streamed ped simulated by the caller: the local player, a client-local ped, or a server ped for which the client is current syncer.

[`setPedChatWith`](/neon/functions/setPedChatWith), [`setPedStandStill`](/neon/functions/setPedStandStill), [`setPedGoToOffset`](/neon/functions/setPedGoToOffset), [`setPedKillOnFoot`](/neon/functions/setPedKillOnFoot), [`setPedWander`](/neon/functions/setPedWander), and [`setPedScriptedSpeechMuted`](/neon/functions/setPedScriptedSpeechMuted) came from restoring the Ballas encounter in `SWEET1`. They queue GTA's own script-command events instead of assigning a primary task directly, so `true` means GTA accepted the command—not that the task has already reached its active state.

Repeat mode in `setPedGoToOffset` uses GTA's mission-sequence pool and `CTaskComplexUseSequence`. It is not a Lua timer that repeatedly moves a ped around its target.

Current limitations:

- no resource-owned task handles;
- no native completion events;
- no automatic task reconstruction after syncer migration;
- mission-actor policy is client-local and must be replicated/cleared by synchronized resources;
- the server must still own mission progress and validate any client observation before advancing it.

## Native gang tags

[`acquireObjectGangTag`](/neon/functions/acquireObjectGangTag) gives one resource exclusive ownership of a supported tag object. GTA then detects actual spray-can hits through `CShotInfo`, advances the tag in its original eight-alpha steps, renders the Grove material, and emits:

```lua
onClientObjectGangTagProgress(previousProgress, currentProgress, creator)
```

The event source is the tag object. `creator` is the client element GTA associated with the spray hit, or `nil` when it cannot be mapped. A synchronized resource should treat that event as a report: validate it on the server, then mirror the accepted byte with [`setObjectGangTagProgress`](/neon/functions/setObjectGangTagProgress).

Progress lives on the MTA object, so it survives stream-out and native object recreation. Explicit release or resource shutdown unregisters the object from the spray path and clears the material override. [`setObjectGangTagAlpha`](/neon/functions/setObjectGangTagAlpha) remains available for visual-only use, but it does not provide ownership or gameplay progress.

## Scene loading and vehicle gates

The [native scene primitives](/neon/functions#scene) expose three small pieces used by the post-rooftop `SWEET1` scene:

- [`enginePreloadWorldAreaInDirection`](/neon/functions/enginePreloadWorldAreaInDirection) reproduces opcode `0A0B`: it asks GTA for objects in one heading, loads the scene, and updates the timer around that blocking work;
- [`reportVehicleMissionAudioEvent`](/neon/functions/reportVehicleMissionAudioEvent) sends one verified `1000..1190` script-audio event through the streamed vehicle's native audio entity;
- [`isVehicleOnAllWheels`](/neon/functions/isVehicleOnAllWheels) reproduces opcode `09D0` exactly for automobiles and bikes.

`isVehicleOnAllWheels` is deliberately stricter than `isVehicleOnGround`: it checks GTA's native four-contact counter and has no geometric or streamed-out fallback. Query it on the vehicle syncer, then let the server decide whether the mission gate has passed.

## Script camera

The [camera API group](/neon/functions#camera) wraps GTA's fixed/look-at, vector move/track, persistence, fade, widescreen, and scripted near-clip primitives.

GTA has one global camera, so Neon gives control to one resource at a time and returns a generation token:

1. `acquireScriptCamera` captures gameplay state and returns a token.
2. Every later call proves both resource ownership and the current generation.
3. Delayed callbacks from an older run fail instead of controlling a new lease.
4. Release restores the captured camera, near clip, widescreen, and optional input inhibition.
5. Stop, restart, disconnect, or an authoritative server camera RPC revokes the lease.

Control inhibition is independent from `toggleAllControls`. Neon raises GTA's native player-safe pad bit so driven vehicles receive the original zero-throttle, full-brake, handbrake, and 0.28 speed-clamp behavior without calling the broader `MakePlayerSafe` routine.

## Native file cutscenes

The [file-cutscene API group](/neon/functions#cutscene) exposes GTA's stock DAT/CUT/IFP playback through the same exclusive camera lease. `requestFileCutscene` accepts only names from GTA's stock cutscene-audio table, limited to seven characters, and returns a generation token before the asynchronous load begins.

A normal synchronized flow is:

1. Every participant requests the cutscene and waits for its native load.
2. The server crosses a readiness barrier, then tells every client to start.
3. Clients report native camera-spline completion. GTA's local skip action is suppressed while managed playback is active.
4. If skipping is allowed, one authorized participant reports the original skip input and the server broadcasts the decision.
5. Every client fades to black, releases the native cutscene, and acknowledges cleanup before synchronized mission entities are created.

File cutscenes are global GTA state. Ordinary script-camera setters cannot use a file-cutscene token, and an authoritative camera takeover deletes the cutscene before gameplay state is restored. Explicit release, resource stop, disconnect, timeout, and replacement all follow that same cleanup path.

`Tagging Up Turf` now starts with the native `SWEET1A` cutscene, then reproduces the following SCM world intro with native camera shots, mission audio, actor movement, walking groups, barriers, and checkpoint commands. Single-player validation completed the roughly 34-second cutscene at native speed, showed the animated spray prop, continued through `SWE1_AA` to `SWE1_AE`, and restored camera and audio. Multi-participant validation is still pending.

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

- the native `SWEET1A` load/start/finish/release lifecycle, stock-name rejection, leader-authorized skip flow, and cleanup barriers;
- isolated go-to, enter, leave, drive-wander, gang-tag, camera, braking, mission-audio, and recorded-car harnesses;
- exact native eight-alpha tag deltas, completion, synchronization, explicit release, and restart cleanup;
- the Ballas partner-chat/seek/kill/wander encounter through the `Tagging Up Turf` mission;
- `SWE1_AV` request-before-camera ordering, synchronized natural completion, authoritative exits, then `DriveWander`;
- exact `09D0` all-wheel arrival gates, including rolled-vehicle cases where `isVehicleOnGround` stayed true but the native predicate stayed false;
- a 15.011-second native drive covering 71.95 synchronized metres;
- isolated recording 207 completion at 8,087/8,088 ms;
- full mission playback completion at 8,040 ms with 0.00 m endpoint error;
- the post-rooftop directional load, two vehicle audio events, `SWE1_BH`, camera restoration, and Sweet's passenger restoration;
- script-camera fixed/move/track/fade/restoration completion in 8,620 ms;
- resource restart cleanup without a new crash artifact;
- server-authoritative co-op barriers and lifecycle acknowledgements in the mission resource.

The mission resource remains a regression harness rather than the final SCM runtime. It proves the current primitives together, while server-owned task handles, completion events, syncer-migration reconstruction, and multi-participant cutscene validation remain future work.
