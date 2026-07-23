---
title: Story runtime
description: Native ped tasks, file cutscenes, camera leases, mission audio and text, recorded cars, and synchronized mission primitives.
sidebar:
  order: 6
---

Neon exposes reusable GTA story primitives instead of hard-coding a mission in C++. `Tagging Up Turf` tests the first complete slice, `Drive-Thru` covers its main chase and return path, and `Nines and AK's` now maps the multiplayer-visible `sweet2` graph through the Binco return. The server runs mission state; the current syncer or client handles native cutscenes, tasks, camera work, audio, text, recorded cars, and local presentation.

## Model-native walking

[`setPedUseNativeWalkingStyle`](/neon/functions/setPedUseNativeWalkingStyle) and [`isPedUsingNativeWalkingStyle`](/neon/functions/isPedUsingNativeWalkingStyle) select the current skin model's native motion group. The state is synchronized, follows model changes and recreation, retains jetpack priority, and coexists with numeric `setPedWalkingStyle` through deterministic last-writer-wins behavior.

## Native ped tasks

The [native task API group](/neon/functions#tasks) includes:

- go-to-and-stand-still with walk/run/sprint, radii, and SCM timeout semantics;
- coordinate `GunControl` shooting plus explicit shooting-rate and accuracy bytes;
- GTA's native vehicle drive-by task against a ped, vehicle, or coordinate;
- indefinite `DriveWander` and finite point-to-point road AI with GTA driving modes and styles;
- partner chat, stand-still, seek-offset, on-foot kill, and standard wander tasks;
- turn-to-face and short composed task sequences;
- GTA's persistent facial-talk controller for scene dialogue;
- per-ped scripted-speech suppression for scenes that provide their own dialogue;
- verified MTA-authoritative enter/exit lifecycles using GTA passenger/leave tasks;
- persistent client-local mission-actor, story-protection, critical-hit, stay-put, and never-targeted policies for script peds;
- resource-owned activation of the narrow native mission-event profile;
- resource-owned gang tags driven by GTA's real spray hits.

Mutating task/combat calls require a living streamed ped simulated by the caller: the local player, a client-local ped, or a server ped for which the client is current syncer.

Each function page names the original GTA class it creates and the verified SCM command it corresponds to. The short version is:

| Neon function | Original GTA task | SCM source |
| --- | --- | --- |
| [`setPedGoTo`](/neon/functions/setPedGoTo) | `CTaskComplexGoToPointAndStandStill` or its timed variant | `05D3 TASK_GO_STRAIGHT_TO_COORD` |
| [`setPedChatWith`](/neon/functions/setPedChatWith) | `CTaskComplexPartnerChat` | `0677 TASK_CHAT_WITH_CHAR` |
| [`setPedStandStill`](/neon/functions/setPedStandStill) | `CTaskSimpleStandStill` | `05BA TASK_STAND_STILL` |
| [`setPedGoToOffset`](/neon/functions/setPedGoToOffset) | `CTaskComplexSeekEntityRadiusAngleOffset`, optionally wrapped by `CTaskComplexUseSequence` | `06A8 TASK_GOTO_CHAR_OFFSET` |
| [`setPedKillOnFoot`](/neon/functions/setPedKillOnFoot) | `CTaskComplexKillPedOnFoot` | `05E2 TASK_KILL_CHAR_ON_FOOT` |
| [`setPedWander`](/neon/functions/setPedWander) | `CTaskComplexWanderStandard` | `05DE TASK_WANDER_STANDARD` |
| [`setPedTurnToFace`](/neon/functions/setPedTurnToFace) | `CTaskComplexTurnToFaceEntityOrCoord` | `0639 TASK_TURN_CHAR_TO_FACE_CHAR` |
| [`setPedEnterVehicle`](/neon/functions/setPedEnterVehicle) | `CTaskComplexEnterCarAsDriver` or `CTaskComplexEnterCarAsPassenger` | `05CA / 05CB` |
| [`setPedExitVehicle`](/neon/functions/setPedExitVehicle) | `CTaskComplexLeaveCar` | `05CD TASK_LEAVE_CAR` |
| [`setPedDriveWander`](/neon/functions/setPedDriveWander) | `CTaskComplexCarDriveWander` | `05D2 TASK_CAR_DRIVE_WANDER` |
| [`setPedDriveTo`](/neon/functions/setPedDriveTo) | `CTaskComplexCarDriveToPoint` | `05D1 TASK_CAR_DRIVE_TO_COORD` |
| [`setPedShootAt`](/neon/functions/setPedShootAt) | `CTaskSimpleGunControl` | `0668 TASK_SHOOT_AT_COORD` |
| [`setPedDriveBy`](/neon/functions/setPedDriveBy) | `CTaskSimpleGangDriveBy` | `0713 TASK_DRIVE_BY` |
| [`setPedFacialTalk`](/neon/functions/setPedFacialTalk) / [`stopPedFacialTalk`](/neon/functions/stopPedFacialTalk) | Persistent `CTaskComplexFacial` controller | `0967 / 0968` |
| [`setPedTaskSequence`](/neon/functions/setPedTaskSequence) | `CTaskComplexSequence` dispatched through `CTaskComplexUseSequence` | `0615 / 0616 / 0618 / 063F` |
| [`getPedTaskSequenceProgress`](/neon/functions/getPedTaskSequenceProgress) | Reads the active child from `CTaskComplexUseSequence` | `0646 GET_SEQUENCE_PROGRESS` |
| [`setPedScriptedSpeechMuted`](/neon/functions/setPedScriptedSpeechMuted) | No task; changes the native scripted-speech state | `0A09 SHUT_CHAR_UP_FOR_SCRIPTED_SPEECH` |
| [`setPedWeaponShootingRate`](/neon/functions/setPedWeaponShootingRate) | No task; updates a value consumed by gun tasks | `07DD SET_CHAR_SHOOT_RATE` |
| [`setPedWeaponAccuracy`](/neon/functions/setPedWeaponAccuracy) | No task; updates a value consumed by weapon tasks | `02E2 SET_CHAR_ACCURACY` |
| [`setPedMissionActor`](/neon/functions/setPedMissionActor) / [`isPedMissionActor`](/neon/functions/isPedMissionActor) | No task; persists or reads the `PED_MISSION` policy | — |
| [`setPedStoryProtected`](/neon/functions/setPedStoryProtected) / [`isPedStoryProtected`](/neon/functions/isPedStoryProtected) | No task; persists a group of native story-actor safety flags | — |
| [`setPedSuffersCriticalHits`](/neon/functions/setPedSuffersCriticalHits) / [`getPedSuffersCriticalHits`](/neon/functions/getPedSuffersCriticalHits) | No task; persists or reads GTA's inverse no-critical-hits bit | `0446 SET_CHAR_SUFFERS_CRITICAL_HITS` |
| [`setPedStayInSamePlace`](/neon/functions/setPedStayInSamePlace) / [`getPedStayInSamePlace`](/neon/functions/getPedStayInSamePlace) | No task; persists or reads GTA's stay-put flag | `0350 SET_CHAR_STAY_IN_SAME_PLACE` |
| [`setPedNeverTargeted`](/neon/functions/setPedNeverTargeted) / [`isPedNeverTargeted`](/neon/functions/isPedNeverTargeted) | No task; persists or reads the targeting flag | `0568 SET_CHAR_NEVER_TARGETTED` |

[`setPedChatWith`](/neon/functions/setPedChatWith), [`setPedStandStill`](/neon/functions/setPedStandStill), [`setPedGoToOffset`](/neon/functions/setPedGoToOffset), [`setPedKillOnFoot`](/neon/functions/setPedKillOnFoot), [`setPedWander`](/neon/functions/setPedWander), and [`setPedScriptedSpeechMuted`](/neon/functions/setPedScriptedSpeechMuted) came from restoring the Ballas encounter in `SWEET1`. They queue GTA's own script-command events instead of assigning a primary task directly, so `true` means GTA accepted the command—not that the task has already reached its active state.

Repeat mode in `setPedGoToOffset` uses GTA's mission-sequence pool and `CTaskComplexUseSequence`. It is not a Lua timer that repeatedly moves a ped around its target.

[`setPedTaskSequence`](/neon/functions/setPedTaskSequence) exposes a deliberately small part of that same native sequence system. One call composes between one and eight `leave_car`, `leave_car_immediately`, `go_to`, `shoot_at`, `drive_to`, `smart_flee`, or `die` descriptors and dispatches them as a single GTA task; `repeat=true` uses the original repeated-sequence path. A `drive_to` child needs finite `x`, `y`, `z`, a speed below `255`, mode `0..3`, driving style `0..6`, and an optional native `vehicleModel`. It carries no vehicle pointer, matching SCM's `-1, -1` placeholders so GTA binds the ped's current vehicle when the child starts.

The three failure-path descriptors follow the original commands directly. `leave_car_immediately` creates `CTaskComplexLeaveCar` with the `0622` immediate-leave parameters and needs a streamed vehicle. `smart_flee` creates `CTaskComplexSmartFleeEntity` for `05DD`, with a positive safe distance and a duration of `-1` or at least zero. `die` creates the unarmed `CTaskComplexDie` used by `05BE`; native health reaches zero without an ordinary MTA damage event. The alternate `/drivethrusimfar` run exercised these sequence paths together, but the mission's low-health branches still need their own dedicated runs.

[`getPedTaskSequenceProgress`](/neon/functions/getPedTaskSequenceProgress) returns the zero-based active child index, or `-1` when that sequence is no longer active. GTA still owns a global 64-slot sequence pool, and the returned boolean only confirms that the sequence was built and queued—it is not a durable Lua handle. The eight-point `SWEET3` harness observed indices `0` through `7` in order and completed naturally after `77,584 ms`, with client and server agreeing on the final position `1.81 m` from the last target. That validates the sequence form. The standalone [`setPedDriveTo`](/neon/functions/setPedDriveTo) entry uses the same constructor but has not been exercised separately in game.

[`setPedFacialTalk`](/neon/functions/setPedFacialTalk) updates GTA's persistent facial controller without replacing the ped's primary movement or combat task. It works for streamed script peds and the local player; remote players are intentionally rejected because their local presentation is owned elsewhere. [`stopPedFacialTalk`](/neon/functions/stopPedFacialTalk) stops that controller cleanly.

[`setPedDriveBy`](/neon/functions/setPedDriveBy) creates GTA's original `CTaskSimpleGangDriveBy` (`0713 TASK_DRIVE_BY`) for a script ped already riding in a locally controlled, streamed vehicle. The target can be a distinct living ped, another non-blown vehicle, or a finite coordinate. The call exposes the native abort range, one of GTA's nine drive-by styles, the right-seat flag, and a `0..100` firing frequency. It rejects the local player and any ped/vehicle pair the caller does not simulate together. The focused harness fired at ped, vehicle, and coordinate targets with native task evidence, real client/server damage, cancellation, destruction, and cleanup. Drive-Thru then validated bidirectional fire and the vehicle-to-foot transition. Follow-up fixes keep scripted AI aim and spread on GTA's mission-actor path without changing player/manual drive-by behavior.

The low-level task calls still have these limitations:

- no resource-owned task handles;
- no native completion events;
- no automatic task reconstruction after syncer migration unless the resource uses the separate route runtime described below;
- mission-actor policy is client-local and must be replicated/cleared by synchronized resources;
- story-protection, critical-hit, and vehicle policies are also client-local and must be applied by the resource on each participant;
- the server must still own mission progress and validate any client observation before advancing it.

## Streaming leases and native route handoffs

[`acquireElementStreamingLease`](/neon/functions/acquireElementStreamingLease) adds one resource-owned streaming reference to a compatible element and returns an independent token. This keeps the element's native instance and current task available beyond ordinary stream range. A token is private to the resource generation that acquired it; explicit release removes it, element destruction invalidates its target, and resource shutdown releases every surviving token. The older `setElementStreamable` state uses a separate reference and is not overwritten.

A streaming lease does not reconstruct a task or decide who should simulate it. The `native-task-runtime` test resource adds that server layer for `drive_to`: it owns stable route handles, immutable waypoint lists, accepted logical progress, cancellation, and monotonically increasing owner epochs. After a syncer handoff, the new owner receives the accepted waypoint and rebuilds the native route instead of restarting it from zero. These functions are resource exports, not core Neon Lua registrations, so they are not counted in the API catalog.

The long-route gate covered more than 3.3 km with stable road height. Its handoff moved from owner epoch 1 at waypoint 3 to epoch 2 at the same waypoint with `0.00 m` discontinuity, then produced `22.2 m` of new motion before cleanup. A connected owner whose client freezes without disconnecting is not yet reassigned by heartbeat, and this route layer does not reconstruct combat groups.

## Native gang tags

[`acquireObjectGangTag`](/neon/functions/acquireObjectGangTag) gives one resource exclusive ownership of a supported tag object. GTA then detects actual spray-can hits through `CShotInfo`, advances the tag in its original eight-alpha steps, renders the Grove material, and emits:

```lua
onClientObjectGangTagProgress(previousProgress, currentProgress, creator)
```

The event source is the tag object. `creator` is the client element GTA associated with the spray hit, or `nil` when it cannot be mapped. A synchronized resource should treat that event as a report: validate it on the server, then mirror the accepted byte with [`setObjectGangTagProgress`](/neon/functions/setObjectGangTagProgress).

Progress lives on the MTA object, so it survives stream-out and native object recreation. Explicit release or resource shutdown unregisters the object from the spray path and clears the material override. [`setObjectGangTagAlpha`](/neon/functions/setObjectGangTagAlpha) remains available for visual-only use, but it does not provide ownership or gameplay progress.

## Story actor and vehicle state

[`setPedMissionActor`](/neon/functions/setPedMissionActor) keeps a script ped in GTA's `PED_MISSION` population class. [`setPedStoryProtected`](/neon/functions/setPedStoryProtected) handles a different concern: it applies the five native flags used to keep story actors from being casually targeted, critically hit, dragged from a car, forced out during a jacking attempt, or made to leave an upside-down vehicle. Both policies survive local native-ped recreation, and clearing either one restores the values that were present before Neon took ownership.

[`setPedSuffersCriticalHits`](/neon/functions/setPedSuffersCriticalHits) controls just one of those flags. It maps to `0446 SET_CHAR_SUFFERS_CRITICAL_HITS`, whose boolean is stored by GTA as the inverse no-critical-hits bit. This lets an enemy mission actor resist critical hits without inheriting the protagonist's targeting and carjacking protections. [`getPedSuffersCriticalHits`](/neon/functions/getPedSuffersCriticalHits) reads the persisted local policy even while the ped is streamed out. Before any override it returns `true`; like the other boolean query, `false` can also mean an invalid or non-script ped.

[`setPedStayInSamePlace`](/neon/functions/setPedStayInSamePlace) maps to `0350` and [`setPedNeverTargeted`](/neon/functions/setPedNeverTargeted) maps to Rockstar's misspelled `0568 SET_CHAR_NEVER_TARGETTED`. Both keep an explicit client-local value on the script ped and reapply it after native recreation. The scalar never-targeted setting takes precedence over the grouped [`setPedStoryProtected`](/neon/functions/setPedStoryProtected) value regardless of call order. These are last-writer-wins policies, not leases; they do not restore a captured value when a resource stops.

The mission event profile is different. A resource can call [`acquirePedNativeEventProfile`](/neon/functions/acquirePedNativeEventProfile) only for a script ped already marked as a mission actor. The returned token is exclusive for that ped and remains logically owned across stream and syncer changes, but [`isPedNativeEventProfileActive`](/neon/functions/isPedNativeEventProfileActive) becomes true only while this client is current syncer and the native mission ped exists. The `mission` profile restores stock vehicle-on-fire event admission and mission decisions only at the verified GTA call sites; it does not turn normal players into mission peds or serialize an active event task across migration. Drive-Thru validated reactivation, vehicle exit, smart flee, seating, real damage, and the transition to foot combat. The isolated harness still needs a clean final full run after its manual-cleanup adjustment.

Vehicles now expose GTA's raw policy instead of forcing it through MTA's broader damage or lock abstractions. [`setVehicleDoorLockMode`](/neon/functions/setVehicleDoorLockMode) and [`getVehicleDoorLockMode`](/neon/functions/getVehicleDoorLockMode) preserve all seven native lock modes, including mode 3's player-only lockout. [`setVehicleTyresCanBurst`](/neon/functions/setVehicleTyresCanBurst) and [`getVehicleTyresCanBurst`](/neon/functions/getVehicleTyresCanBurst) control tyre bursting without making the vehicle body invulnerable. The setters map to SCM commands `020A` and `053F`, and their values are reapplied after stream-out or native vehicle recreation.

[`setVehiclePhysicalProofs`](/neon/functions/setVehiclePhysicalProofs) maps to `02AC SET_CAR_PROOFS` and stores the bullet, fire, explosion, collision, and melee flags independently. This is how Drive-Thru can ask for a fire-only Greenwood instead of using MTA's broader all-or-nothing damage-proof switch. The complete tuple survives native vehicle recreation, but there is no getter or automatic restore on resource stop. A resource should pass five `false` values when it wants to clear the policy.

[`setVehicleLoadCollisionFlag`](/neon/functions/setVehicleLoadCollisionFlag) reproduces `0587 SET_LOAD_COLLISION_FOR_CAR_FLAG`. A false SCM value sets native physical mask `0x4000`, allowing a mission car to use ghost physics when world collision is not loaded. This is separate from MTA contact collision. The client-local value survives native recreation, but it has no getter, captured prior value, lease, or automatic resource-stop restore.

These are client-local presentation and native-behaviour policies. In a synchronized mission, the server should decide the intended state and have every participant apply or clear it as part of the scene lifecycle.

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

The [file-cutscene API group](/neon/functions#cutscene) exposes GTA's stock DAT/CUT/IFP playback through the same exclusive camera lease. [`requestFileCutscene`](/neon/functions/requestFileCutscene) accepts only names from GTA's stock cutscene-audio table, limited to seven characters, and returns a generation token before the asynchronous load begins.

The current signature is:

```lua
requestFileCutscene(name [, visibleArea])
```

`visibleArea` is an optional integer from `0` through `255`. It reproduces the SCM world-area selection without changing the player's interior. When supplied, the lease captures the previous GTA visible area before loading and restores it on release, camera takeover, failure, or resource shutdown.

A normal synchronized flow is:

1. Every participant requests the cutscene and waits for its native load.
2. The server crosses a readiness barrier, then tells every client to start.
3. Clients report native camera-spline completion. GTA's local skip action is suppressed while managed playback is active.
4. If skipping is allowed, one authorized participant reports the original skip input and the server broadcasts the decision.
5. Every client fades to black, releases the native cutscene, and acknowledges cleanup before synchronized mission entities are created.

File cutscenes are global GTA state. Ordinary script-camera setters cannot use a file-cutscene token, and an authoritative camera takeover deletes the cutscene before gameplay state is restored. Explicit release, resource stop, disconnect, timeout, and replacement all follow that same cleanup path.

MTA normally reuses GTA's `CUTOBJ01` through `CUTOBJ13` slots as playable special characters. That happened to work for `SWEET1A`, whose first extra model is a skinned ped, but `SWEET2A` loads an unskinned cigarette prop first and crashed when GTA treated it as a ped model. Managed cutscenes now restore all 13 stock generic mappings for the native load and rebuild MTA's `RYDER2` through `PSYCHO` mappings during teardown. The Drive-Thru run completed `SWEET2A` in `31,453 ms` without the former crash or model `304` load dialog.

`SWEET3A` exposed two more generic problems. Teardown now clears stale unlinked `CUTS.IMG` streaming records before restoring MTA's special-character models. After native load completes, Neon sets universal area `13` only on the current cutscene-manager actors and props, so they remain visible across world-area changes without changing ordinary MTA objects. These changes and the optional visible-area argument were introduced in [`e6e485ba2`](https://github.com/Dryxio/mtasa-neon/commit/e6e485ba2) and are exercised by `test-resources/nines-and-aks`.

The loader also reproduces vanilla's temporary `SWITCH_STREAMING OFF` window immediately before `LOAD_CUTSCENE`; GTA restores the flag during normal postload or deletion, and Neon clears it on load failure. After raising the resource watchdog to 120 seconds, `SWEET2B` completed naturally in `83,313 ms` and continued into the validated world reconstruction. Nines and AK's testing reached the Emmet range and exposed the original cutscene crash and visibility failures; the corrected C++ path built successfully, but a fresh full run of both `SWEET3A` and `SWEET3B` is still required. Native file-cutscene subtitle behavior has not yet been proved.

`Tagging Up Turf` now starts with the native `SWEET1A` cutscene, then reproduces the following SCM world intro with native camera shots, mission audio, actor movement, walking groups, barriers, and checkpoint commands. The managed cutscene model slot keeps `CSPLAY`'s 61-bone clump separate from gameplay CJ's 37-bone cache, while preserving and restoring the original model and streaming state. That separation fixed the invisible, frozen, and deformed CJ failures caused by sharing the two incompatible clumps.

Single-player validation completed the roughly 34-second cutscene at native speed, showed the animated spray prop, continued through `SWE1_AA` to `SWE1_AE`, and restored camera and audio. Multi-participant validation is still pending.

## SWEET1 world transition and finale

After the native file cutscene, world CJ uses model 0 with the fresh-game clothes expected by the original mission: vest, player face, denim jeans, and black sneakers. Neon snapshots model 0 and all 18 clothing slots before the transition, then restores them during cleanup. Other participants keep their own skins rather than being rewritten as CJ.

The completed Grove Street finale uses GTA's native building blocks rather than a pre-rendered replacement: an 18-second vector camera, the seven `SWE1_BN` through `SWE1_BU` lines, facial talk, the `GANGS` handshake, Sweet's exit and walk, a leader-authorized skip, and full actor, vehicle, camera, audio, model, and clothing cleanup. The mission also preserves the `GROVE4L` plate, Bounce FM station, raw lock mode, tyre policy, story protection, and off-screen vehicle storage expected by the SCM transition.

The complete single-player path has reached the reward in about 17.6 seconds for the finale itself with visible, stable CJ. Multi-participant appearance and restoration still need a live co-op pass.

The seven finale dialogue lines now pair their native mission audio with GTA's two-second facial-talk request on Sweet or CJ. Ambient scripted speech is muted only on the owning client, then both states are restored after natural finish, failure, skip, or cleanup. `/tagupfinal` was validated in game with the expected audio and facial movement.

## Drive-Thru checkpoint

The `drive-thru` resource ports `SWEET3` from native `SWEET2A` through the main chase, return scenes, and reward. The opening remains validated: the cutscene completed, the crew entered the Greenwood through authoritative seats, dialogue finished, the exact `09D0` arrival gate passed, and abort cleanup restored mission state.

`SWEET2B` now completes naturally, then reconstructs the Greenwood, Voodoo, CJ, and Ballas under the black screen. The checked seat layout is Smoke in seat 3, Sweet in seat 2, and Ryder in seat 1. The pursuit activated all three Ballas drive-bys, produced real damage in both directions, moved the encounter from vehicles to foot combat, and ended with both Ballas dead. The native route layer kept the long path alive off stream and rebuilt it on syncer handoff.

The main return path is also validated: Grove support and Smoke drove their native routes, both return scenes completed, the mission awarded $200, showed the passed text, and played the expected tune. `/drivethrusimfar` separately covered the alternate distant failure path with five stable off-stream entities, route index 7, slow driving, coordinate drive-by, scripted deaths, escape, camera restoration, and `TW2_Y`.

This is not every branch. Dedicated runtime passes are still needed for the Greenwood low-health exits during the outward trip, chase, Grove return, and Smoke return; `DM_PED_MISSION_EMPTY` is not implemented; native file-cutscene subtitles remain unverified; and not every return-to-car reminder variant has been exercised. Campaign bookkeeping is outside the harness, which restores its own snapshot. Multi-client cutscene and migration barriers also remain open.

The later `Tagging Up Turf` parity patch now preserves CJ's health, armour, and loadout, adds spray ammo in 30,000-round chunks, corrects the Greenwood creation height and colours, scopes spray-can failure to the right stage, restores the two jump prompts, and separates the two Ballas failure formulas. Lua parsing and resource checks passed, but no in-game validation is recorded for this patch yet.

## Safe stock entry-exit transitions

Commit [`f71089e96`](https://github.com/Dryxio/mtasa-neon/commit/f71089e96) adds the optional `story-entry-exit-runtime` Lua resource. It provides server-authoritative, resource-owned transitions for audited GTA entry-exit sites without re-enabling `CEntryExitManager::Update`, which MTA disables because its legacy entry path crashes.

The public server exports are:

```lua
element|false, string|nil acquireStoryEntryExit(
    player thePlayer,
    string site,
    int dimension
    [, table options]
)

bool releaseStoryEntryExit(element handle)
table|false getStoryEntryExitState(element handle)
```

`options` may set `fadeOut`, `blackHold`, and `fadeIn`; each duration is clamped to `0..3` seconds. The returned handle belongs to the calling resource. Only one transition may run for a player at a time, acquisition must receive its client acknowledgement within five seconds, and only the owner can inspect or release the handle.

The handle emits `onStoryEntryExitStateChange(state, data)`. Important states are `active`, `fading_out`, `committed`, `entered`, `exited`, `failed`, and `released`. `committed` is the black-screen area/position change; `entered` or `exited` is the terminal state after the destination and fade-in are verified.

The initial `cschp_ls` definition comes from the linked `CSCHP` IPL pair used by `sweet2`. The client detects the exact on-foot trigger, then the server rechecks the player, dimension, interior, vehicle state, and position before freezing or moving anything. GTA's `+1.0` entry-exit Z conversion, half-width trigger rectangles, destination headings, area `15` interior, and return to area `0` are preserved.

An explicit release, caller shutdown, player departure, timeout, or runtime shutdown rolls an unfinished transaction back to its source transform and restores the previous frozen and camera state. The service does not run GTA's native door task, populate the shop, or open the clothing menu. Its source is `test-resources/story-entry-exit-runtime`, with isolated lifecycle coverage in `test-resources/story-entry-exit-test`.

The user reached Binco through the automatic transition. The follow-up `entered`/`exited` terminal-barrier correction is committed, but still needs a fresh confirmation through the tutorial, automatic exit, and pass delay. The standalone harness also still prescribes vehicle rejection, repeated entry/exit, and resource-stop checks during every fade phase.

These three exports are part of an optional Lua resource, not C++ registrations, so the engine API catalog remains at 127 entries.

## Nines and AK's checkpoint

Commit [`e6e485ba2`](https://github.com/Dryxio/mtasa-neon/commit/e6e485ba2) adds `test-resources/nines-and-aks`, a server-owned port of the multiplayer-visible `sweet2` graph from native `SWEET3A` through the return from Binco.

The resource covers:

- both stock file cutscenes and the `SWEET2` mission-text block;
- the Glendale journey, exact all-wheel gates, Smoke and Emmet actor lifecycles, navigation and dialogue;
- the one-, three-, and five-bottle rounds with SCM/raw-bytecode heights, native shooting tasks, and progress-timed camera cuts;
- the Tampa petrol-cap weakpoint, delayed proof removal, destruction gate, departure cameras and authoritative seats;
- the return drive, Smoke goodbye, phone sequence, Binco objective, entry/exit transaction, pass/fail presentation, and deterministic cleanup.

Several parts are intentional multiplayer adaptations. Bottle damage events replace SCM object-damage polling; native point routes, phone tasks, nested duck/idle graphs, target lock-on, `DM_PED_MISSION_EMPTY`, the full set of Smoke's ped flags, and temporary ped explosion proofs are not all exposed. Campaign counters, respect, contacts, shop blips, purchases, and save statistics remain outside the harness.

Static checks passed for the C++ changes, Lua files, resource XML, and affected `Game SA` and `Client Deathmatch` Release Win32 builds. User testing reached the Emmet range and later the automatic Binco transition, but the corrected bottle heights, full camera timing, Tampa weakpoint, departure, terminal Binco barriers, alternate failures, cleanup, and multi-player path have not completed the prescribed end-to-end matrix. This checkpoint is mapped and partially exercised; it is not documented as full mission parity.

## Mission audio

GTA exposes four physical mission-audio slots. Neon wraps them with generation-scoped resource handles:

- supported native families are 1800..1829 and 2000..45400;
- custom event 65535 is excluded;
- the service never preempts a foreign native slot;
- owned pending loads are periodically re-armed when GTA silently drops the hardware request;
- playback is one-shot per handle;
- shutdown releases every owned event.

GTA's event-to-bank calculation depends on the original 24-bit x87 precision. Neon now scopes the native resolver call to that precision and restores the caller's control word afterward. This fixes exact 200-event boundaries such as `SWE1_AA` event `37400`, which previously selected the preceding bank under extended precision. Tagging Up Turf replayed `37400` in game and heard the expected line before continuing normally.

Co-op resources should preload on every participant, cross a server readiness barrier, broadcast play, and wait for completion acknowledgements from every client.

[`playMissionPassedTune`](/neon/functions/playMissionPassedTune) is the smaller `0394 PLAY_MISSION_PASSED_TUNE` path used at the reward screen. It accepts selector `1` or `2`, maps that to GTA's native beat track, and plays it as a local one-shot without consuming one of the four mission-audio handles. `Tagging Up Turf` uses tune 1 alongside its $200 reward.

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
- native facial talk start/stop, turn-to-face, composed leave/go-to/shoot sequences, and zero-based sequence progress;
- the seven-line Grove finale facial-talk lifecycle on natural dialogue completion and cleanup;
- the eight-point `SWEET3` native drive sequence, indices `0..7`, natural completion, and matching client/server endpoint evidence;
- `SWE1_AV` request-before-camera ordering, synchronized natural completion, authoritative exits, then `DriveWander`;
- exact `09D0` all-wheel arrival gates, including rolled-vehicle cases where `isVehicleOnGround` stayed true but the native predicate stayed false;
- a 15.011-second native drive covering 71.95 synchronized metres;
- isolated recording 207 completion at 8,087/8,088 ms;
- full mission playback completion at 8,040 ms with 0.00 m endpoint error;
- the post-rooftop directional load, two vehicle audio events, `SWE1_BH`, camera restoration, and Sweet's passenger restoration;
- the Grove Street finale, fresh-game CJ clothing snapshot/restore, story and vehicle policies, mission-passed tune, reward, and skip cleanup;
- the complete `SWEET2A` opening, managed cutscene slot restoration, authoritative passengers, dialogue, exact `09D0` gate, and abort cleanup;
- natural `SWEET2B` completion in `83,313 ms`, correct world reconstruction and seats, three active native drive-bys, real bidirectional damage, vehicle-to-foot combat, both return scenes, and the $200 reward;
- Nines and AK's progress through the Emmet range and automatic Binco entry, with the complete `sweet2` graph, raw bottle data, cameras, audio, Tampa, departure, ENEX pair, and cleanup statically mapped;
- resource-owned streaming-lease lifecycle and a 3.3 km route handoff with stable waypoint progress, zero measured handoff discontinuity, and cleanup;
- the `/drivethrusimfar` off-stream alternate failure, including coordinate drive-by, immediate exit, smart flee, scripted deaths, escape, and camera restoration;
- script-camera fixed/move/track/fade/restoration completion in 8,620 ms;
- resource restart cleanup without a new crash artifact;
- server-authoritative co-op barriers and lifecycle acknowledgements in the mission resource.

The mission resources remain regression harnesses rather than the final SCM runtime. The `native-task-runtime` provides server-owned `drive_to` handles and syncer reconstruction, while `story-entry-exit-runtime` provides audited server-owned ENEX transitions. Both are resource layers rather than core engine APIs. Low-level engine tasks still have no general completion event or universal migration reconstruction. Multi-participant cutscene validation, frozen-owner heartbeat reassignment, combat-group reconstruction, the Drive-Thru low-health branches, the latest Tagging Up Turf parity changes, and the remaining Nines and AK's matrix are future runtime work.
