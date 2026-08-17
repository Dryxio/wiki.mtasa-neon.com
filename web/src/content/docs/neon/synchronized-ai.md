---
title: Synchronized NPCs and traffic
description: How Neon runs GTA:SA's native pedestrian AI in one shared multiplayer world.
sidebar:
  order: 2
---

Neon uses **GTA:SA's original pedestrian AI as the simulation layer for server-owned MTA peds**. One eligible client runs the native task tree. The server owns the population and authority epochs, while other clients receive synchronized movement and supported native presentation without running competing AI.

The shared ambient runtime now covers **civilians, native gang groups, gang combat, motorcycle carjacks, dealers, city cops, and civilian couples**. Autonomous ambient vehicles, attractors, conversations, and headless simulation are still outside the completed slice.

<!-- MEDIA PLACEHOLDER: Shared population overview. Show two clients observing the same civilians and a gang group. -->

## One shared population, not one crowd per client

Neon does not turn GTA's local `CPopulation::AddToPopulation` loop back on. Each client would otherwise create a different crowd.

Instead, the reference population runtime follows one authority path:

1. Clients keep GTA's native population models and zone state current.
2. The server combines synchronized population targets with live civilian, gang, dealer, and cop counts.
3. One client asks GTA for a read-only spawn, gang-group, or couple candidate.
4. Near-enough clients can veto a candidate they can already see.
5. The server validates the proposal, creates real MTA peds, and assigns one owner epoch.
6. Only that owner runs GTA's native AI. Observers receive the supported movement, animation, combat, and physical presentation.
7. Handoff revokes the old generation before a new client resumes simulation.

The server remains authoritative for element lifetime, health, seats, damage admission, ownership, and cleanup.

## Native population profiles

[`getAmbientPedPopulationProfile`](/neon/functions/getAmbientPedPopulationProfile) exposes GTA's current popcycle targets instead of making a Lua resource approximate density from scratch. The profile includes civilian, gang, cop, and dealer targets plus the active zone, time slice, density multipliers, creation distance, and gang weights.

It also reports why the ambient-cop target is what it is. `rawCopTarget` keeps the unmodified popcycle result while `copTarget` applies the normal ambient-cop guards, and `copSuppressionFlags` names which guard fired:

| Flag | Meaning |
| --- | --- |
| `1` | The active zone is flagged no-cops |
| `2` | Random cops are disabled |
| `4` | A gang war is being fought |
| `8` | The streaming position is at high altitude |

`worldLevel` and `zoneLabel` complete the picture by identifying the native world level and navigation zone the profile was computed for.

[`getAmbientPedSpawnCandidate`](/neon/functions/getAmbientPedSpawnCandidate) can now request `civilian`, `gang`, `dealer`, or `cop` candidates explicitly, and every candidate reports its own `worldLevel`. [`getAmbientPedGangGroupCandidate`](/neon/functions/getAmbientPedGangGroupCandidate) returns a native two-to-four-member gang placement. All of these are **proposal APIs**: they create nothing by themselves.

The reversible zone layer also exposes [`setAmbientPedPopulationZoneState`](/neon/functions/setAmbientPedPopulationZoneState) and [`resetAmbientPedPopulationZonesToBootstrap`](/neon/functions/resetAmbientPedPopulationZonesToBootstrap) so a resource can apply campaign-style zone state without permanently mutating the process.

## Population families

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

### City cops

Ambient cops are the one family where Neon deliberately does **not** run the retail task.

MTA peds are physically `CPlayerPed` instances. GTA's `CTaskComplexWanderCop` reads `CCopPed`-only storage in its first/next/control paths and can enter the wanted, alarm, criminal-scan, pursuit, and arrest systems. Running it on an MTA ped is unsafe, and a server-owned ambient cop that can start a real pursuit is not the intended behavior anyway.

Neon instead reuses GTA's verified base `CTaskComplexWander` locomotion vtable slots, identifies the task as `WANDER_TYPE_COP`, and supplies a deliberately empty scanner. Path nodes, walking, pauses, road crossing, and blocked-node avoidance are preserved, while wanted level, alarms, criminal scans, pursuit, and arrest are unreachable by construction rather than by a runtime check.

A resource opts into that behavior through the new `ambient-cop-safe` event profile:

```lua
-- client, on the current syncer
local token = acquirePedNativeEventProfile(ped, "ambient-cop-safe")
if token then
    -- Under this profile setPedWander routes to the safe ambient-cop task
    setPedWander(ped, "walk", -1)
end
```

Two behavior notes matter when writing against this profile:

- Under `ambient-cop-safe`, [`setPedWander`](/neon/functions/setPedWander) routes to the safe ambient-cop task instead of `WanderStandard`, and it **refuses `wanderSensibly = false`**. Retail `WanderCop` hardcodes sensible walking, so accepting `false` would produce a hybrid state neither the retail cop nor this profile can reach.
- [`isPedNativeAmbientCopWanderTask`](/neon/functions/isPedNativeAmbientCopWanderTask) reports whether the exact custom ambient-cop task is the primary task. It walks every primary slot rather than only the active leaf, so a temporary native hit or avoidance response does not make the check lie.

Cop density comes from the same profile path as the other families: `copTarget`, `rawCopTarget`, and `copSuppressionFlags` on the population profile, plus `"cop"` selection on the spawn-candidate proposal.

### Civilian couples

Couples are **atomic**: two peds are placed into one GTA `CTaskComplexBeInCouple` relationship with an explicit leader, or neither is. A half-formed couple is refused rather than partially applied.

```lua
-- client, on the current syncer
local check = validatePedNativeCouple(pedA, pedB)
if check and check.compatible then
    local token = acquirePedNativeCouple(pedA, pedB, check.leaderIndex)
    if token then
        -- GTA now owns walk-side selection, hold-hands, look-at, and give-up distance
    end
end
```

[`validatePedNativeCouple`](/neon/functions/validatePedNativeCouple) is the pre-flight check. It reports whether the pair is `compatible` and which member GTA should lead, based on the two peds' native walk speeds — a couple whose members walk at incompatible speeds would immediately break its own give-up distance. Passing that `leaderIndex` straight into [`acquirePedNativeCouple`](/neon/functions/acquirePedNativeCouple) is the intended flow.

After the lease exists, GTA owns the pair behavior: walk-side selection and swapping, hand holding, looking at each other, and abandoning the couple past the give-up distance.

Observers use a separate lease. [`acquirePedNativeCouplePresentation`](/neon/functions/acquirePedNativeCouplePresentation) opens a presentation channel on a non-syncing client, [`updatePedNativeCouplePresentation`](/neon/functions/updatePedNativeCouplePresentation) refreshes the synchronized walk-side and pairing state each frame, and [`releasePedNativeCouplePresentation`](/neon/functions/releasePedNativeCouplePresentation) closes it. Observers therefore present a couple walking together without running a second couple simulation.

Keep the two families distinct: the **couple lease** is owner-only real native AI; the **presentation lease** is observer-only appearance. [`getPedNativeCoupleDiagnostic`](/neon/functions/getPedNativeCoupleDiagnostic) reports which of the two is wrong when a pair looks broken, including partner reciprocity and leader-role mismatches.

## Presentation and ownership

Only the current syncer runs the real native AI. Reusable observer channels cover:

- locomotion, rotation, and bounded spatial updates;
- ordered native task animations;
- fight/chat and weapon audiovisual presentation;
- selected avoidance, threat, damage, flee, airborne, jump, landing, and climb state;
- gang-group handoff and selected combat context;
- couple pairing and walk-side presentation through its own observer lease.

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
- Ambient cops walk and avoid, but they never escalate. There is no wanted level, pursuit, or arrest behavior, and this is intentional rather than an unfinished stage — the retail cop task is not safe on an MTA ped.
- The completed ambient population slice is still focused on outdoor world simulation; arbitrary interiors and every GTA population family are not implied.
- No eligible client means no native AI simulation. There is no headless GTA task runner.
- Syncer migration does not serialize every arbitrary GTA task tree. Supported families have explicit handoff or presentation state.
- Different clients can reach collision on different frames, so short local divergence can still occur before authoritative state reconverges.

The later population work is tracked by [`1004257b9`](https://github.com/Dryxio/mtasa-neon/commit/1004257b9), [`39f782fd9`](https://github.com/Dryxio/mtasa-neon/commit/39f782fd9), [`75dd85f77`](https://github.com/Dryxio/mtasa-neon/commit/75dd85f77), [`9fa50ed6a`](https://github.com/Dryxio/mtasa-neon/commit/9fa50ed6a), [`53478fdb3`](https://github.com/Dryxio/mtasa-neon/commit/53478fdb3), [`083927c23`](https://github.com/Dryxio/mtasa-neon/commit/083927c23), [`3accf283f`](https://github.com/Dryxio/mtasa-neon/commit/3accf283f), [`5318f4360`](https://github.com/Dryxio/mtasa-neon/commit/5318f4360), [`500d3cf7e`](https://github.com/Dryxio/mtasa-neon/commit/500d3cf7e), and [`d709fa696`](https://github.com/Dryxio/mtasa-neon/commit/d709fa696). Two-client runs cover density, group handoff, melee and firearm combat, motorcycle carjacks, dealer handoff, cop locomotion and handoff, couple formation, observer state, and deterministic cleanup.

Use [Story runtime](/neon/story-runtime) for server-authored mission actors and vehicle tasks.
