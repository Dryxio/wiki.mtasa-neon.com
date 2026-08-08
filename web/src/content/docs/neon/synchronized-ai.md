---
title: Synchronized NPCs and traffic
description: How Neon turns GTA:SA's native pedestrian and mission AI into shared multiplayer entities, what works today, and what remains.
sidebar:
  order: 2
---

Neon's central gameplay direction is simple: **use GTA:SA's original single-player AI in one shared multiplayer world**. Pedestrians and mission actors are real server-owned MTA elements. One eligible client runs the native GTA task, while the other players receive synchronized movement and native-looking presentation without running competing AI.

The first ambient-traffic milestone is usable now, but it is not the whole San Andreas population system. Current runtime evidence covers outdoor civilian pedestrians, owner handoff, several native reactions, moving-vehicle knockdowns, airborne and climb presentation, and selected mission-task presentation with two clients. Autonomous ambient vehicles, police, gangs, dealers, couples, attractors, conversations, and simulation without an eligible client remain in progress.

<!-- MEDIA PLACEHOLDER: Shared traffic overview. Suggested file: /neon-media/synchronized-traffic.webp or a short video. Show two players observing the same server-owned crowd, not two unrelated local populations. -->

## The multiplayer model

Neon does not re-enable GTA's local `CPopulation::AddToPopulation` loop. That would let every client create a different, unsynchronized crowd. Instead, a resource follows one authority path:

1. A client asks GTA for a civilian model and native path-placement candidate.
2. The server validates that proposal against all players, population caps, spacing, dimension, and resource state.
3. The server creates one real MTA ped and assigns one current syncer.
4. That syncer runs GTA's native AI. Observers receive transforms, locomotion, animation, and the supported presentation channels without gaining damage, seat, tag, or mission authority.
5. If ownership changes, the resource revokes the old generation before assigning a newer epoch. The server remains responsible for cleanup and progression throughout.

This pattern is reusable beyond background traffic. The same separation between one simulator, server-owned state, and observer-only presentation supports mission actors, convoys, escorts, hostile NPCs, scripted traffic, and freeroam events.

## What works now

### Shared civilian pedestrians

The [`native-ped-traffic`](https://github.com/Dryxio/mtasa-neon/tree/master/test-resources/native-ped-traffic) reference resource creates a conservative outdoor population shared by every player. GTA supplies the stock civilian models and path candidates, the server owns the peds, and the active syncer runs `CTaskComplexWanderStandard`, the task behind SCM `05DE TASK_WANDER_STANDARD`.

The resource limits the population globally, near each player, and per map cell. It rejects proposals that are too close to another player, reserves space under MTA's logical ped ceiling, transfers ownership only after a sustained distance advantage, removes corpses, and destroys every resource-owned ped when traffic stops.

### Native reactions

The `ambient-wander` event profile lets GTA choose reactions on the active owner while observers remain presentation-only. The checked slice includes pedestrian and parked-vehicle avoidance, aimed-at and nearby-gunfire responses, non-lethal damage decisions, physical reaction and recovery, surrounding panic, and flee or fight choices from the civilian model's decision maker.

MTA still owns bullet, health, death, and ordinary element synchronization. [`addPedNativeDamageResponseEvent`](/neon/functions/addPedNativeDamageResponseEvent) replays only the missing GTA behavior decision; it cannot apply damage a second time. [`addPedNativeGunAimedAtEvent`](/neon/functions/addPedNativeGunAimedAtEvent) inserts GTA's real `CEventGunAimedAt` only for the resource that owns the active profile token.

### Presentation for other players

Only the syncer runs the real task tree. Reusable engine channels currently present these parts to non-syncers:

- locomotion mode, speed, direction, and bounded higher-rate spatial updates when movement changes materially;
- ordered task-generated animations, including loop metadata, on a dedicated 100 ms lane;
- native fight and paired-chat animation associations;
- on-foot and drive-by weapon animation, muzzle flash, shells, audio, gun light, and spray FX, with local damage and tag progress suppressed;
- selected ambient avoidance, threat, damage, physical-response, and flee presentation.
- moving-vehicle impacts, knockdown recovery, airborne state, jump/land transitions, and selected climb/vault phase and anchor data.

This is broader than one mission-specific workaround. Tagging Up Turf, Drive-Thru, Nines and AK's, and ambient traffic use the same network and presentation layers. New task families still need their own two-client comparison when they introduce a visual state that those shared channels do not carry.

### Jump, airborne state, and climbing

[`setPedJump`](/neon/functions/setPedJump) starts GTA's `CTaskComplexJump` lifecycle on a living, streamed ped controlled by the caller. GTA owns the jump, in-air, landing, and optional `CTaskSimpleClimb` decisions instead of a resource approximating them with a fixed animation.

Neon's observer channel carries the airborne transition and the selected climb/vault anchor, phase, and handoff state. The focused `native-ped-traffic` air and climb commands exercised three airborne handoffs plus climb/vault handoff with two clients. This evidence applies to the recorded cases; it is not a universal snapshot of every GTA physical task.

<!-- MEDIA PLACEHOLDER: Jump/climb handoff. Suggested file: /neon-media/synchronized-climb-handoff.webp or a captioned video. Keep both clients visible if possible and mark the moment authority changes. -->

### Native mission driving

Neon exposes GTA's original road-driving, drive-to, drive-by, entry, exit, and task-sequence primitives. Drive-Thru has two-client coverage for vehicle and on-foot weapon presentation, while normal MTA synchronization remains authoritative for transforms, occupants, vehicle health, player health, and death.

This makes mission vehicles, convoys, escorts, and scripted traffic possible today. It does **not** mean Neon already spawns a complete autonomous ambient vehicle population.

## Build a population resource

The complete [population API group](/neon/functions#population) documents signatures, ownership, source, commits, and focused evidence. The core flow uses:

- [`updateAmbientPedPopulationModels`](/neon/functions/updateAmbientPedPopulationModels) while generation is active;
- [`getAmbientPedSpawnCandidate`](/neon/functions/getAmbientPedSpawnCandidate) for a read-only native proposal;
- [`resetAmbientPedPopulationModels`](/neon/functions/resetAmbientPedPopulationModels) when generation stops;
- [`acquirePedNativeEventProfile`](/neon/functions/acquirePedNativeEventProfile) with `ambient-wander` on every client;
- [`addPedNativeGunAimedAtEvent`](/neon/functions/addPedNativeGunAimedAtEvent) and [`addPedNativeDamageResponseEvent`](/neon/functions/addPedNativeDamageResponseEvent) for the cross-owner event cases.

The functions do not replace the server layer. A production resource still needs proposal validation, caps, ownership epochs, timeouts, handoff acknowledgements, player departure handling, corpse policy, and deterministic shutdown.

For a local check, start the reference resource, enable `/pedtraffic debug on`, then use `/pedtraffic on`. `/pedtraffic status` reports its current counters and `/pedtraffic off` must return the resource-owned population to zero. `/pedtraffic weapon` gives the caller a pistol for the threat and damage checkpoint.

## Evidence and real limits

Commit [`b159bcd0c`](https://github.com/Dryxio/mtasa-neon/commit/b159bcd0c) introduced the civilian V1 and its three population primitives. Release Win32 builds and two-client runs in Los Santos and Las Venturas covered 23 owner-epoch changes with zero client task failures. The final observing-client pass showed no visible freeze, teleport, disappearance, or walk-to-run transition; restart and last-player departure returned the owned population to zero.

Commit [`65c6b103c`](https://github.com/Dryxio/mtasa-neon/commit/65c6b103c) added the ambient reaction profile and two event bridges. The affected client projects and the x64 server built successfully. A later two-client run covered cross-owner aim, non-lethal damage, hands-up interruption, physical reaction, recovery, flee, parked-vehicle avoidance, surrounding panic, owner handoff, and shutdown.

Commits [`adb30851a`](https://github.com/Dryxio/mtasa-neon/commit/adb30851a) and [`161dc1b7`](https://github.com/Dryxio/mtasa-neon/commit/161dc1b7) added moving-vehicle and airborne reactions, the public jump task, and climb/vault handoff state. The focused resource and `SyncMovement_Tests.cpp` cover the encoded lifecycle; the commits also record the two-client handoff runs described above.

The current boundaries matter:

- V1 is civilian-only, outdoors, in dimension and interior zero.
- There is no autonomous ambient vehicle population yet.
- Complex local collision turns can diverge by roughly one to two metres before reconverging because clients reach collision on different frames.
- A syncer migration does not reconstruct every arbitrary native task. Purpose-built resource layers still own route or mission reconstruction.
- Coordinate weapon snapshots are not frame-perfect entity tracking during fast movement.
- Vehicle transitions, arbitrary look/aim state, every physical response, and every GTA task family are not covered by one universal observer format. The new airborne and climb states cover their selected lifecycles rather than removing that limitation.
- No eligible client means no native AI simulation; headless or offline simulation is not implemented.

Use [Story runtime](/neon/story-runtime) for the full task, lifecycle, camera, cutscene, audio, and mission architecture. Use [Mission checkpoints](/neon/mission-checkpoints) to see exactly which story paths were exercised in game.
