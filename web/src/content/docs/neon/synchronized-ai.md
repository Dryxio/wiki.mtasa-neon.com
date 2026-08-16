---
title: Synchronized NPCs and traffic
description: How Neon runs GTA:SA's native pedestrian AI in one shared multiplayer world.
sidebar:
  order: 2
---

Neon uses **GTA:SA's original pedestrian AI as the simulation layer for server-owned MTA peds**. One eligible client runs the native task tree. The server owns the population and authority epochs, while other clients receive synchronized movement and supported native presentation without running competing AI.

The shared ambient runtime now covers **civilians, native gang groups, gang combat, motorcycle carjacks, and dealers**. Autonomous ambient vehicles, police population, couples, attractors, conversations, and headless simulation are still outside the completed slice.

<!-- MEDIA PLACEHOLDER: Shared population overview. Show two clients observing the same civilians and a gang group. -->

## One shared population, not one crowd per client

Neon does not turn GTA's local `CPopulation::AddToPopulation` loop back on. Each client would otherwise create a different crowd.

Instead, the reference population runtime follows one authority path:

1. Clients keep GTA's native population models and zone state current.
2. The server combines synchronized population targets with live civilian, gang, and dealer counts.
3. One client asks GTA for a read-only spawn or gang-group candidate.
4. Near-enough clients can veto a candidate they can already see.
5. The server validates the proposal, creates real MTA peds, and assigns one owner epoch.
6. Only that owner runs GTA's native AI. Observers receive the supported movement, animation, combat, and physical presentation.
7. Handoff revokes the old generation before a new client resumes simulation.

The server remains authoritative for element lifetime, health, seats, damage admission, ownership, and cleanup.

## Native population profiles

[`getAmbientPedPopulationProfile`](/neon/functions/getAmbientPedPopulationProfile) exposes GTA's current popcycle targets instead of making a Lua resource approximate density from scratch. The profile includes civilian, gang, cop, and dealer targets plus the active zone, time slice, density multipliers, creation distance, and gang weights.

[`getAmbientPedSpawnCandidate`](/neon/functions/getAmbientPedSpawnCandidate) can now request `civilian`, `gang`, or `dealer` candidates explicitly. [`getAmbientPedGangGroupCandidate`](/neon/functions/getAmbientPedGangGroupCandidate) returns a native two-to-four-member gang placement. Both are **proposal APIs**: they create nothing by themselves.

The reversible zone layer also exposes [`setAmbientPedPopulationZoneState`](/neon/functions/setAmbientPedPopulationZoneState) and [`resetAmbientPedPopulationZonesToBootstrap`](/neon/functions/resetAmbientPedPopulationZonesToBootstrap) so a resource can apply campaign-style zone state without permanently mutating the process.

## Civilians, gangs, and dealers

### Civilians

Civilian peds use GTA's loaded zone models, path placement, `CTaskComplexWanderStandard`, avoidance, threat, damage reaction, flee/fight decisions, and the existing owner-handoff presentation paths.

### Gang groups

Gang population is no longer represented as unrelated single peds. The owner can acquire one of GTA's native ambient group slots with [`acquirePedNativeGroup`](/neon/functions/acquirePedNativeGroup). GTA then owns leader/follower locomotion, social behavior, collective decisions, and the selected fight/flee task allocation.

The resource keeps the group server-owned and reacquires the native group only on the current syncer. [`releasePedNativeGroup`](/neon/functions/releasePedNativeGroup) and resource shutdown remove the local native lease. [`getPedNativeGroupDiagnostic`](/neon/functions/getPedNativeGroupDiagnostic) exists for focused debugging, not gameplay state.

### Gang combat

Ambient gang members use GTA's runtime gang weapon tables and native combat decisions. A native owner hit is authenticated before it is replayed on the authoritative victim, so observers can present the attack without applying duplicate damage.

Motorcycle carjacks use the same boundary. GTA resolves the jack on the group owner, the server validates the target and seat state, and the real player owner installs the canonical bike-jacked task. [`addPedNativeBikeJackTask`](/neon/functions/addPedNativeBikeJackTask) is the low-level victim-side bridge used by that flow.

### Dealers

Dealer population uses GTA's dealer quota, race/weather model choice, dealer ped type, and unarmed WanderStandard behavior. Dealers reduce their own native deficit but are kept separate from GTA's ordinary stock-counted total-ped gate, matching the retail population rules instead of folding them into civilians.

## Presentation and ownership

Only the current syncer runs the real native AI. Reusable observer channels cover:

- locomotion, rotation, and bounded spatial updates;
- ordered native task animations;
- fight/chat and weapon audiovisual presentation;
- selected avoidance, threat, damage, flee, airborne, jump, landing, and climb state;
- gang-group handoff and selected combat context.

Normal MTA synchronization remains authoritative for element transforms, health, death, occupants, and network ownership. A resource should never treat observer-side GTA presentation as a second gameplay simulation.

## Minimal resource shape

A production population resource normally needs only this high-level loop:

```lua
-- client: keep GTA's native population context current
updateAmbientPedPopulationModels(localPlayer.position)

local profile = getAmbientPedPopulationProfile()
local candidate = getAmbientPedSpawnCandidate(localPlayer.position, "civilian")

if profile and candidate then
    triggerServerEvent("population:candidate", resourceRoot, candidate)
end
```

The server still has to validate proposals, compare live deficits, create the actual peds, assign ownership epochs, handle player departure, and remove every owned element on shutdown.

For groups, the current owner acquires the native group only after the server has assigned the complete member set.

## Current limits

- Ambient **vehicle** population is not complete. Native vehicle tasks remain available for server-authored missions, convoys, escorts, and scripted traffic.
- The completed ambient population slice is still focused on outdoor world simulation; arbitrary interiors and every GTA population family are not implied.
- No eligible client means no native AI simulation. There is no headless GTA task runner.
- Syncer migration does not serialize every arbitrary GTA task tree. Supported families have explicit handoff or presentation state.
- Different clients can reach collision on different frames, so short local divergence can still occur before authoritative state reconverges.

The later population work is tracked by [`1004257b9`](https://github.com/Dryxio/mtasa-neon/commit/1004257b9), [`39f782fd9`](https://github.com/Dryxio/mtasa-neon/commit/39f782fd9), [`75dd85f77`](https://github.com/Dryxio/mtasa-neon/commit/75dd85f77), [`9fa50ed6a`](https://github.com/Dryxio/mtasa-neon/commit/9fa50ed6a), [`53478fdb3`](https://github.com/Dryxio/mtasa-neon/commit/53478fdb3), and [`083927c23`](https://github.com/Dryxio/mtasa-neon/commit/083927c23). Two-client runs cover density, group handoff, melee and firearm combat, motorcycle carjacks, dealer handoff, observer state, and deterministic cleanup.

Use [Story runtime](/neon/story-runtime) for server-authored mission actors and vehicle tasks.
