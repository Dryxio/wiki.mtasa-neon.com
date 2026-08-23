---
title: Story runtime
description: Synchronized ambient pedestrians, native ped tasks, file cutscenes, camera leases, mission audio and text, recorded cars, and multiplayer-oriented mission primitives.
sidebar:
  order: 6
---

Neon exposes reusable GTA story systems instead of hard-coding one mission in C++. A resource can combine synchronized native NPCs, ped and vehicle tasks, cameras, file cutscenes, mission audio and text, recorded vehicles, and actor policies while keeping mission progress on the server.

Most low-level calls run on the client that currently simulates the ped or vehicle. They do not make a mission authoritative by themselves: the server still has to own state, validate client observations, coordinate participants, and clean up every scene.

The high-level model is one native simulator, server-owned state, and presentation for every other player. Start with [Synchronized NPCs and traffic](/neon/synchronized-ai).

<!-- MEDIA PLACEHOLDER: Multiplayer story-runtime montage. Suggested file: /neon-media/story-runtime.webp or a short video. Combine one cutscene/camera moment with one native task visible to a second player; label the mission harness used. -->

## Model-native walking

[`setPedUseNativeWalkingStyle`](/neon/functions/setPedUseNativeWalkingStyle) and [`isPedUsingNativeWalkingStyle`](/neon/functions/isPedUsingNativeWalkingStyle) make a ped follow the current skin model's native motion group.

The setting is synchronized, follows model changes and native recreation, and retains jetpack priority. Numeric `setPedWalkingStyle` calls still work; whichever walking-style API writes last determines the active policy.

## Synchronized ambient pedestrians

Neon keeps GTA's unmanaged `CPopulation::AddToPopulation` loop disabled. Instead, three [client-side population primitives](/neon/functions#population) expose GTA's civilian-model residency and pedestrian path-placement rules without creating a local-only ped. A multiplayer resource can validate the proposal on the server, create one real MTA ped, and choose exactly one client to run `CTaskComplexWanderStandard`.

The [`native-ped-traffic`](https://github.com/Dryxio/mtasa-neon/tree/master/test-resources/native-ped-traffic) reference resource demonstrates that full layer: conservative global, per-player, cell, separation, and ped-pool limits; one streaming lease and native Wander task on the current syncer; monotonically increasing owner epochs; acknowledged or timed-out handoffs; corpse cleanup; and destruction of every owned ped on shutdown.

The engine calls are deliberately lower-level than a complete population manager. [`updateAmbientPedPopulationModels`](/neon/functions/updateAmbientPedPopulationModels) retains GTA's eight zone-model slots until [`resetAmbientPedPopulationModels`](/neon/functions/resetAmbientPedPopulationModels) is called. [`getAmbientPedSpawnCandidate`](/neon/functions/getAmbientPedSpawnCandidate) proposes one model and position but does not establish network ownership, validate it against other players, create an element, or clean anything up.

The `ambient-wander` profile adds GTA's stock pedestrian and parked-vehicle avoidance plus civilian threat and damage decisions on the current owner. A server-validated aim transition can reach that owner through [`addPedNativeGunAimedAtEvent`](/neon/functions/addPedNativeGunAimedAtEvent). When MTA's normal synchronized hit did not create the native response there, [`addPedNativeDamageResponseEvent`](/neon/functions/addPedNativeDamageResponseEvent) can replay only the behavior decision, never the physical damage.

The V1 reference resource is limited to civilians outdoors in dimension and interior zero. Autonomous ambient vehicles, police, gangs, dealers, couples, attractors, conversations, and simulation without an eligible client remain open work. Two-client runs in Los Santos and Las Venturas checked 23 owner-epoch changes with zero task failures; the observing client showed no freeze, teleport, disappearance, or walk-to-run transition during the final handoff run. A later two-client behavior pass covered cross-owner aim, non-lethal damage, hands-up interruption, physical reaction, recovery, flee, parked-vehicle avoidance, surrounding panic, handoff, and cleanup. Complex local collision turns can still diverge by roughly one to two metres before reconverging.

## Native ped tasks

These are not animation helpers or a new Lua movement solver. Neon exposes the
**original GTA:SA task system**, previously unavailable to Lua resources. Give
an NPC a destination and GTA's pedestrian AI takes over: it follows the native
path network, navigates around obstacles, moves naturally, slows down, and stops
at the target. Put an NPC behind the wheel and GTA's driving AI can do the same
on the road network. Lua chooses the intent while the game performs the movement.

That unlocks several high-level behaviors without simulating controls or writing
a pathfinder in the resource:

- [`setPedGoTo`](/neon/functions/setPedGoTo) sends an NPC to one coordinate using
  GTA's pedestrian pathfinding, including native obstacle steering, slowdown,
  and arrival.
- [`setPedWander`](/neon/functions/setPedWander) lets an NPC choose successive
  pedestrian path nodes on its own, which is useful for ambient street life.
- [`setPedDriveWander`](/neon/functions/setPedDriveWander) starts GTA's continuous
  road autopilot for ambient traffic.
- [`setPedDriveTo`](/neon/functions/setPedDriveTo) gives that autopilot a specific
  world destination, as in a single-player mission.

```lua
-- client.lua: no waypoint loop and no simulated movement controls
local npc = createPed(270, 2495.2, -1687.4, 13.5)
local destination = Vector3(2520.0, -1672.0, 13.8)

if npc then
    setPedGoTo(npc, destination, "run", 0.75, 3.0)
end
```

The [native task API group](/neon/functions#tasks) also covers social actions,
combat, actor policies, task sequences, and gang tags.

Mutating task or combat calls require a living, streamed ped simulated by the caller. That can be the local player, a client-local ped, or a server ped for which this client is the current syncer. Vehicle tasks also require local control of the streamed vehicle.

### Complete GTA task and SCM mapping

Every mapped function page names the original `CTask`, opcode, command, source commit, and focused evidence. The public C++ bindings below live in [`CLuaPedDefs.cpp`](https://github.com/Dryxio/mtasa-neon/blob/master/Client/mods/deathmatch/logic/luadefs/CLuaPedDefs.cpp).

<details>
<summary>Show all native ped task and SCM mappings</summary>

| Neon API | Original GTA C++ task or state | SCM opcode / command |
| --- | --- | --- |
| [`setPedGoTo`](/neon/functions/setPedGoTo) | `CTaskComplexGoToPointAndStandStill` or timed variant | `05D3 TASK_GO_STRAIGHT_TO_COORD` |
| [`setPedChatWith`](/neon/functions/setPedChatWith) | `CTaskComplexPartnerChat` | `0677 TASK_CHAT_WITH_CHAR` |
| [`setPedStandStill`](/neon/functions/setPedStandStill) | `CTaskSimpleStandStill` | `05BA TASK_STAND_STILL` |
| [`setPedGoToOffset`](/neon/functions/setPedGoToOffset) | `CTaskComplexSeekEntityRadiusAngleOffset`, optionally through `CTaskComplexUseSequence` | `06A8 TASK_GOTO_CHAR_OFFSET` |
| [`setPedKillOnFoot`](/neon/functions/setPedKillOnFoot) | `CTaskComplexKillPedOnFoot` | `05E2 TASK_KILL_CHAR_ON_FOOT` |
| [`setPedWander`](/neon/functions/setPedWander) | `CTaskComplexWanderStandard` | `05DE TASK_WANDER_STANDARD` |
| [`setPedJump`](/neon/functions/setPedJump) | `CTaskComplexJump`, `CTaskSimpleJump`, `CTaskComplexInAirAndLand`, optional `CTaskSimpleClimb`, and `CTaskSimpleLand` | `TASK_JUMP`; numeric opcode not verified in the audited source |
| [`setPedTurnToFace`](/neon/functions/setPedTurnToFace) | `CTaskComplexTurnToFaceEntityOrCoord` | `0639 TASK_TURN_CHAR_TO_FACE_CHAR` |
| [`setPedEnterVehicle`](/neon/functions/setPedEnterVehicle) | `CTaskComplexEnterCarAsDriver` or `CTaskComplexEnterCarAsPassenger` | `05CA / 05CB` |
| [`setPedExitVehicle`](/neon/functions/setPedExitVehicle) | `CTaskComplexLeaveCar` | `05CD TASK_LEAVE_CAR` |
| [`setPedDriveWander`](/neon/functions/setPedDriveWander) | `CTaskComplexCarDriveWander` | `05D2 TASK_CAR_DRIVE_WANDER` |
| [`setPedDriveTo`](/neon/functions/setPedDriveTo) | `CTaskComplexCarDriveToPoint` | `05D1 TASK_CAR_DRIVE_TO_COORD` |
| [`setPedShootAt`](/neon/functions/setPedShootAt) | `CTaskSimpleGunControl`, which creates its own `CTaskSimpleUseGun` subtask | `0668 TASK_SHOOT_AT_COORD` |
| [`setPedDriveBy`](/neon/functions/setPedDriveBy) | `CTaskSimpleGangDriveBy` | `0713 TASK_DRIVE_BY` |
| [`setPedFacialTalk`](/neon/functions/setPedFacialTalk) / [`stopPedFacialTalk`](/neon/functions/stopPedFacialTalk) | Persistent `CTaskComplexFacial` controller | `0967 / 0968` |
| [`setPedTaskSequence`](/neon/functions/setPedTaskSequence) | `CTaskComplexSequence` dispatched through `CTaskComplexUseSequence` | `0615 / 0616 / 0618 / 063F` |
| [`getPedTaskSequenceProgress`](/neon/functions/getPedTaskSequenceProgress) | Reads the active child from `CTaskComplexUseSequence` | `0646 GET_SEQUENCE_PROGRESS` |
| [`setPedScriptedSpeechMuted`](/neon/functions/setPedScriptedSpeechMuted) | Native scripted-speech state; no `CTask` | `0A09 SHUT_CHAR_UP_FOR_SCRIPTED_SPEECH` |
| [`getPedWeaponShootingRate`](/neon/functions/getPedWeaponShootingRate) / [`setPedWeaponShootingRate`](/neon/functions/setPedWeaponShootingRate) | Read or write the persistent byte consumed by native gun tasks; no `CTask` | Getter has no SCM opcode; setter is `07DD SET_CHAR_SHOOT_RATE` |
| [`setPedWeaponAccuracy`](/neon/functions/setPedWeaponAccuracy) | Persistent byte consumed by native weapon tasks | `02E2 SET_CHAR_ACCURACY` |
| [`setPedMissionActor`](/neon/functions/setPedMissionActor) / [`isPedMissionActor`](/neon/functions/isPedMissionActor) | Persistent `PED_MISSION` policy; no `CTask` | No SCM opcode |
| [`setPedStoryProtected`](/neon/functions/setPedStoryProtected) / [`isPedStoryProtected`](/neon/functions/isPedStoryProtected) | Grouped native story-actor flags; no `CTask` | No SCM opcode |
| [`setPedSuffersCriticalHits`](/neon/functions/setPedSuffersCriticalHits) / [`getPedSuffersCriticalHits`](/neon/functions/getPedSuffersCriticalHits) | Persistent inverse no-critical-hits bit | `0446 SET_CHAR_SUFFERS_CRITICAL_HITS` |
| [`setPedStayInSamePlace`](/neon/functions/setPedStayInSamePlace) / [`getPedStayInSamePlace`](/neon/functions/getPedStayInSamePlace) | Persistent stay-put flag; no movement task | `0350 SET_CHAR_STAY_IN_SAME_PLACE` |
| [`setPedNeverTargeted`](/neon/functions/setPedNeverTargeted) / [`isPedNeverTargeted`](/neon/functions/isPedNeverTargeted) | Persistent targeting flag; no `CTask` | `0568 SET_CHAR_NEVER_TARGETTED` |

`setPedTaskSequence` also exposes three child-only mappings that do not have separate public functions:

| Sequence descriptor | Original GTA C++ task | SCM opcode |
| --- | --- | --- |
| `leave_car_immediately` | `CTaskComplexLeaveCar` with the immediate-leave parameters | `0622` |
| `smart_flee` | `CTaskComplexSmartFleeEntity` | `05DD` |
| `die` | Unarmed `CTaskComplexDie` | `05BE TASK_DIE` |

</details>

Use the [GTA mapping and SCM opcode filters](/neon/functions?gta=1&scm=1) when you want the same information grouped with signatures, lifecycle, source commits, and test resources.

### Task dispatch and completion

Some calls replace the ped's primary task directly. Others use GTA's script-command event path. In both cases, a `true` return means the task was accepted; it does not mean the ped has already started or completed the action.

Low-level tasks do not return durable resource handles and do not emit a universal completion event. A resource can observe the relevant world state, but the server should validate that observation before advancing the mission.

[`getPedTaskSequenceProgress`](/neon/functions/getPedTaskSequenceProgress) is the exception for composed sequences: it reports the zero-based active child index, or `-1` after that sequence is no longer active. GTA still owns the underlying global sequence pool, so this is progress inspection rather than a persistent Lua object.

### Task sequences

[`setPedTaskSequence`](/neon/functions/setPedTaskSequence) builds one native sequence containing up to eight supported child descriptors:

- `leave_car` and `leave_car_immediately`;
- `go_to` and `drive_to`;
- `shoot_at`;
- `smart_flee`;
- `die`.

`repeat=true` uses GTA's repeated-sequence path. A `drive_to` child binds the ped's current vehicle when that child starts, matching the original SCM behavior; it does not retain a Lua vehicle pointer inside the sequence.

Sequence construction validates each descriptor before handing its child task to GTA. The [function reference](/neon/functions/setPedTaskSequence) documents the accepted fields and defaults.

### General task limitations

- Stream-out can destroy the local GTA instance and its active task.
- A syncer migration does not automatically reconstruct arbitrary task state.
- Mission-actor and vehicle policies are client-local unless a resource deliberately mirrors them.
- Native task acceptance is not proof of arrival, damage, dialogue completion, or mission success.
- The server remains responsible for ownership epochs, timeouts, failure handling, and progression.

Only the current syncer executes the real GTA AI task. Other clients receive ordinary synchronized world state plus reusable presentation channels for active go-to and Wander locomotion; ordered task-generated animations on a dedicated 100 ms lane; fight and paired-chat associations; on-foot and drive-by weapon audiovisuals; and selected avoidance, threat, damage, physical-response, and flee states. Observer weapon presentation is cancelled before ammo, projectiles, line-of-sight hits, damage, script fire, or tag progress can become authoritative.

This is not yet a universal serialization of GTA's task tree. Generic vehicle-entry and exit presentation, arbitrary look or aim state, every physical response, every task family, and complete join-in-progress or migration coverage remain open. Coordinate weapon snapshots are also not frame-perfect entity tracking during fast motion.

The intended general model keeps one native simulator and gives observers generation-scoped visual baselines and snapshots. Observers may render locomotion, pose and animation through GTA, but must not run competing AI, create damage, change seats, or report task completion. Verifying that path requires at least two connected clients, although the observer may be automated and controlled by the same tester.

## Streaming leases and native route handoffs

[`acquireElementStreamingLease`](/neon/functions/acquireElementStreamingLease) adds one resource-owned streaming reference to a compatible element. The returned token is private to that resource generation. Explicit release removes the reference, element destruction invalidates the target, and resource shutdown releases every remaining token.

A lease can keep an existing native instance and task alive outside ordinary stream range. It does not decide which client should simulate the element, and it does not reconstruct work after a syncer change.

The optional `native-task-runtime` test resource demonstrates the missing server layer for `drive_to` routes. It owns stable route handles, immutable waypoints, accepted progress, cancellation, and monotonically increasing owner epochs. A new syncer rebuilds the route from the last accepted waypoint instead of starting from zero.

Those runtime exports are resource code, not core Neon Lua registrations, so they are not part of the engine API catalog. The current route layer also has no frozen-client heartbeat reassignment and does not reconstruct combat groups.

## Native gang tags

[`acquireObjectGangTag`](/neon/functions/acquireObjectGangTag) gives one resource exclusive ownership of a supported tag object. GTA then detects real spray-can hits, advances progress in its original eight-alpha steps, applies the Grove material, and emits:

```lua
onClientObjectGangTagProgress(previousProgress, currentProgress, creator)
```

The event source is the tag object. `creator` is the client element GTA associated with the spray hit, or `nil` when it cannot be mapped. A synchronized resource should treat the event as a client report, validate it on the server, then mirror the accepted progress with [`setObjectGangTagProgress`](/neon/functions/setObjectGangTagProgress).

Progress lives on the MTA object and survives native object recreation. Release or resource shutdown unregisters the tag and clears the material override. [`setObjectGangTagAlpha`](/neon/functions/setObjectGangTagAlpha) remains a visual-only helper and does not provide ownership or gameplay progress.

## Story actor and vehicle state

Story resources often need native policies that are narrower than MTA's general abstractions.

[`setPedMissionActor`](/neon/functions/setPedMissionActor) keeps a script ped in GTA's `PED_MISSION` population class. [`setPedStoryProtected`](/neon/functions/setPedStoryProtected) controls the grouped safety flags used for important actors. Independent APIs expose critical-hit, stay-put, and targeting policies when a resource needs only one behavior.

These ped policies survive local native recreation. Some restore a captured value when cleared; others are explicit last-writer-wins values. Check each function's lifecycle before sharing a ped between resources.

The resource-owned [`acquirePedNativeEventProfile`](/neon/functions/acquirePedNativeEventProfile) lease is different. Its current `mission` profile restores a narrow set of GTA mission-ped event decisions while this client is the authoritative syncer with a live native ped. It does not load arbitrary decision-maker files or serialize an active response task across migration.

The audited mission-ped response path preserves GTA's native choking and melee/fight reactions at the call sites used by Tagging Up Turf. The Ballas fight style, player melee damage, and choking exit were first checked in a single-client run. Later two-client passes verified reusable fight and paired-chat animation presentation, including GTA's missing command-3 melee advance correction. Choking still has no separate two-client claim, and these checkpoints do not prove a universal combat snapshot system.

Vehicles expose their native story state through:

- [`setVehicleDoorLockMode`](/neon/functions/setVehicleDoorLockMode), including all seven GTA lock modes;
- [`setVehicleTyresCanBurst`](/neon/functions/setVehicleTyresCanBurst);
- [`setVehiclePhysicalProofs`](/neon/functions/setVehiclePhysicalProofs) for separate bullet, fire, explosion, collision, and melee flags;
- [`setVehicleLoadCollisionFlag`](/neon/functions/setVehicleLoadCollisionFlag) for GTA's mission-car collision-loading policy.

These are client-local policies reapplied after native vehicle recreation. Physical proofs and collision loading have no automatic resource-stop restoration, so the resource must clear the values or destroy the vehicle during cleanup.

For synchronized missions, the server should decide the intended actor and vehicle policy and have every participant apply or clear it as part of the scene lifecycle.

## Scene loading and vehicle gates

The [native scene API group](/neon/functions#scene) exposes three small primitives:

- [`enginePreloadWorldAreaInDirection`](/neon/functions/enginePreloadWorldAreaInDirection) reproduces opcode `0A0B` and can block while GTA loads the requested scene;
- [`reportVehicleMissionAudioEvent`](/neon/functions/reportVehicleMissionAudioEvent) reports one supported script-audio event through a streamed vehicle's native audio entity;
- [`isVehicleOnAllWheels`](/neon/functions/isVehicleOnAllWheels) reproduces opcode `09D0` for automobiles and bikes.

`isVehicleOnAllWheels` is stricter than `isVehicleOnGround`: it reads GTA's native contact count and has no geometric or streamed-out fallback. Query it on the vehicle syncer and let the server decide whether the mission gate passed.

## Script camera

The [camera API group](/neon/functions#camera) wraps GTA's fixed and look-at cameras, vector movement and tracking, fades, widescreen, persistence, and scripted near clip.

GTA has one global camera, so one resource owns it at a time:

1. [`acquireScriptCamera`](/neon/functions/acquireScriptCamera) captures gameplay state and returns a generation token.
2. Every later camera call proves resource ownership and the current generation.
3. Stale delayed callbacks fail instead of controlling a newer scene.
4. Release restores the captured camera, near clip, widescreen, and optional control inhibition.
5. Resource stop, restart, disconnect, or an authoritative server camera RPC revokes the lease.

Control inhibition uses GTA's player-safe pad behavior rather than calling the broader `MakePlayerSafe` routine. It remains independent from `toggleAllControls`.

## Native file cutscenes

The [file-cutscene API group](/neon/functions#cutscene) plays GTA's stock DAT/CUT/IFP cutscenes through the same exclusive camera lease.

```lua
local token = assert(requestFileCutscene("SWEET3A", 1))
```

The optional visible-area value is an integer from `0` through `255`. The lease captures the previous visible area and restores it on release, camera takeover, load failure, or resource shutdown.

Loading is asynchronous. A synchronized flow should:

1. request the cutscene on every participant;
2. wait for every client to report that native loading finished;
3. have the server broadcast one start decision;
4. collect native completion or an authorized skip request;
5. broadcast the skip when allowed;
6. fade to black, release on every client, and wait for cleanup acknowledgements before creating synchronized world entities.

File cutscenes are local GTA state. The API does not synchronize participants automatically, and ordinary script-camera setters cannot use a file-cutscene token. An authoritative camera takeover deletes the cutscene before restoring gameplay state.

Managed loading temporarily restores GTA's generic cutscene-model mappings and isolates cutscene objects from MTA's playable special-character mappings. It also cleans stale cutscene streaming state during teardown. These compatibility corrections are part of the generic loader; mission resources should not depend on particular temporary model slots.

Native subtitles have not yet been proved across the supported file-cutscene paths. Multi-participant loading, skip, finish, appearance, and release still require a complete in-game co-op pass.

<span id="sweet1-world-transition-and-finale"></span>
<span id="drive-thru-checkpoint"></span>
<span id="nines-and-aks-checkpoint"></span>

## Mission checkpoints

`Tagging Up Turf`, `Drive-Thru`, and `Nines and AK's` are runnable regression resources that combine these primitives. They are examples and validation checkpoints, not a finished campaign runtime.

Their implemented paths, strongest evidence, and remaining gaps are tracked on [Mission checkpoints](/neon/mission-checkpoints). The resources are designed around server-owned mission state and multiple participants, but current in-game evidence is stronger for their single-client paths than for complete co-op execution.

## Safe stock entry-exit transitions

The optional `story-entry-exit-runtime` resource provides server-authoritative transitions for audited GTA entry-exit sites without re-enabling the native manager path disabled by MTA.

Its public server exports are:

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

The handle belongs to the calling resource. Only one transition may run for a player at a time, and only the owner can inspect or release it. Acquisition becomes active only after a client acknowledgement and fails after five seconds otherwise. Optional fade durations are clamped to `0..3` seconds.

`onStoryEntryExitStateChange(state, data)` reports `active`, `fading_out`, `committed`, `entered`, `exited`, `failed`, or `released`. `committed` is the black-screen position/interior change; `entered` or `exited` is the terminal state after destination and fade-in checks. Failure, timeout, player departure, owner shutdown, or explicit release rolls an unfinished transition back to its source transform and restores the previous frozen and camera state.

The first supplied site reproduces the audited `cschp_ls` IPL pair used by the original story. The service preserves its trigger bounds, heading, area, and Z conversion, but it does not run a native door task, populate the shop, or open a clothing menu.

These three exports belong to the optional [`story-entry-exit-runtime`](https://github.com/Dryxio/mtasa-neon/tree/master/test-resources/story-entry-exit-runtime) Lua resource, not to the C++ registration table. They therefore do not change the engine API catalog. The focused [`story-entry-exit-test`](https://github.com/Dryxio/mtasa-neon/tree/master/test-resources/story-entry-exit-test) covers its lifecycle separately.

## Mission audio

GTA exposes four physical mission-audio slots. Neon wraps them in generation-scoped resource handles:

- a request reserves a supported event and starts loading;
- polling can re-arm a pending native request that GTA silently dropped;
- playback is one-shot per handle;
- the service never preempts a foreign native slot;
- release and resource shutdown clear owned events.

Co-op resources should preload on every participant, cross a server readiness barrier, broadcast playback, and wait for completion acknowledgements.

[`playMissionPassedTune`](/neon/functions/playMissionPassedTune) is a separate local one-shot path for GTA's two original reward tracks. It does not consume a mission-audio handle.

## Mission text

GTA has one global mission GXT block, so the [mission text APIs](/neon/functions#text) use an exclusive resource lease.

The owner can show small, help, and big text. Main-table keys remain available, spoken lines respect the player's subtitle option, and shutdown clears tracked HUD pointers before releasing ownership. The loaded block may remain cached until another owner replaces it.

## Recorded-car playback

The [recording APIs](/neon/functions#recording) expose GTA's direct non-looped opcode `05EB` playback.

The calling resource must own the recording and playback slot. The vehicle must be streamed, locally synchronized through the unoccupied-vehicle path, non-frozen, non-blown, and not player-driven.

Resource shutdown, vehicle destruction, stream-out, or sync ownership loss stops playback. Neon stops when the network frame is gone rather than guessing where playback should resume.

## Current limitations

- Low-level native tasks have no general completion event or durable migration-safe handle.
- Streaming leases preserve instances; they do not choose a syncer or reconstruct arbitrary work.
- Remote native-task presentation covers the checked locomotion, ordered animation, fight/chat, weapon audiovisual, and selected physical-response channels, not every GTA task or transition.
- Client-local actor and vehicle policies must be replicated and cleared by the resource.
- File cutscenes, camera state, audio, and text are local presentation systems coordinated by server barriers.
- Complete multi-participant cutscene and mission checkpoint validation remains open.
- Campaign counters, save statistics, shops, progression, and a general SCM interpreter are outside these resources.

See [Mission checkpoints](/neon/mission-checkpoints) for current resource coverage and [Tooling and verification](/neon/tooling-and-verification) for the evidence levels used throughout the wiki.
