---
title: Compatibility
description: What works between Neon, standard MTA clients, and older packet layouts.
sidebar:
  order: 7
---

Neon keeps MTA's resource model and normal gameplay defaults. Its extra engine features are opt-in, and compatibility varies by feature. The current Neon server requires its matching deathmatch network epoch; an older client is rejected before join instead of being allowed to reinterpret a changed contract.

Before depending on Neon behavior:

1. detect optional Lua functions when a resource can fall back to standard MTA;
2. require matching Neon builds when the resource depends on native-world startup or another engine-specific protocol;
3. keep stable server identities separate from client-local GTA slots.

## Detect Neon APIs

Resources intended to run on both distributions should feature-detect before calling Neon-only functions:

```lua
if type(engineGetRendererStats) ~= "function" then
    outputDebugString("This optional diagnostic requires MTA:SA Neon")
    return
end

local stats = engineGetRendererStats()
```

If a resource cannot work without Neon, stop early with a clear error. That is much easier to diagnose than failing halfway through startup.

## Capability-gated network changes

Neon advertises bitstream capabilities before it changes a packet layout. This applies to:

- extended low-precision world coordinates;
- extended absolute camera coordinates;
- server model registry definitions and logical IDs;
- native-world legacy transport and startup authorization;
- format-3 child packs, ordered selected sets, and registrar generations;
- synchronized `fastweaponstrafe` state.

Versioned serializers still preserve their defined ordinary packet layouts. Native World v3 is stricter: the server requires the exact current capability contract and does not silently downgrade a selected set into ordinary resource files.

## Model fallback

Server-managed elements retain a native parent. A connected client maps the stable logical ID to one of its own runtime slots; if that client has no active slot, it renders and simulates the parent model instead.

This keeps the client connected and the element usable, but it cannot reproduce the custom model's appearance. The resource still has to decide whether that fallback is good enough for its gameplay.

## Existing MTA APIs extended by Neon

[`setPedEnterVehicle`](/neon/functions/setPedEnterVehicle) and [`setPedExitVehicle`](/neon/functions/setPedExitVehicle) remain MTA APIs. Neon verifies and uses the underlying GTA passenger/leave task layouts while keeping the server-confirmed occupant lifecycle.

[`setGlitchEnabled`](/neon/functions/setGlitchEnabled) and [`isGlitchEnabled`](/neon/functions/isGlitchEnabled) accept the additional `fastweaponstrafe` name. The option is synchronized and disabled by default.

The `fastweaponstrafe-toggle` resource now provides a focused enable/disable and native-walking check. Its commit records the harness and Lua parse result, not an in-game pass, so the feature remains documented as experimental rather than runtime-validated.

While a resource owns the Neon script-camera lease, legacy client camera setters are rejected. An authoritative server camera RPC revokes the lease before applying server control.

Native file cutscenes use that same exclusive lease and exist only on the client that requested them. Multiplayer resources must coordinate loading, start, skip, completion, and release through their own server-authoritative barriers; the API does not synchronize a cutscene automatically.

## Server-side sync validation hooks

Neon registers six server events so a resource can observe or reject suspicious client reports without replacing normal MTA synchronization. In every case, the event source is the player who sent the report.

| Event | Behavior |
| --- | --- |
| `onPlayerInvalidVehicleExplosion(element|nil, reason)` | Diagnostic notification after an invalid vehicle-origin explosion is rejected. Cancellation has no effect. |
| `onPlayerInvalidVehicleSync(vehicle, reason)` | Diagnostic notification after an invalid frozen-vehicle transform is rejected. Cancellation has no effect. |
| `onPlayerVehicleTeleport(vehicle, previousX, previousY, previousZ, currentX, currentY, currentZ)` | Raised at the configured `playerTeleportAlert` distance. Cancellable; cancelling rejects the move and resynchronizes authoritative state. |
| `onPlayerVehicleHealthSyncIncrease(vehicle, currentHealth, reportedHealth)` | Cancellable when reported vehicle health rises by more than `0.5`. |
| `onPlayerHealthSyncIncrease(currentHealth, reportedHealth)` | Cancellable when reported player health rises by more than `1.0`. |
| `onPlayerArmorSyncIncrease(currentArmor, reportedArmor)` | Cancellable when reported armour rises by more than `1.0`. |

For the existing cancellable `onExplosion(x, y, z, type, origin)` event, `origin` now receives the validated vehicle for a vehicle-origin explosion and `nil` otherwise.

Commits [`34af4e4a2`](https://github.com/Dryxio/mtasa-neon/commit/34af4e4a2) and [`37a823ccd`](https://github.com/Dryxio/mtasa-neon/commit/37a823ccd) implement these checks. A later full Win32/x64 checkpoint build included the code. There is no focused checked-in resource or recorded adversarial runtime matrix, so these are documented as server hooks rather than a validated anti-cheat system.

## Client binary pairing

Use the complete client payload from one Neon build. The current public installer keeps the MTA-provided `netc.dll` whose ABI matches this source revision, but copying an arbitrary module from another official, older, or custom installation remains unsupported.

## Windows packages and local builds

| Build | Version type | Intended use |
| --- | --- | --- |
| Public CI installer | `VERSION_TYPE_UNSTABLE` | Player-facing package with the normal anti-cheat and service checks. |
| Clean local clone | `VERSION_TYPE_CUSTOM` | Developer build that can launch without installer-created HKLM state. |

The public workflow produces `MTA-Neon-Setup.exe` only when the required client executable, bootstrap files, runtime DLLs, data, fonts, and default skin files are present. Its branding, shortcuts, protocol registration, install state, and uninstall path remain separate from an official MTA installation.

The packaging path passed the Nightly Win32 build, NSIS compilation, archive inspection, silent install, standard-user registry and ProgramData checks, and a localhost CONNECT/JOIN. This validates packaging and connection, not every experimental Neon feature. The installer work is tracked by commit [`7f96f186f`](https://github.com/Dryxio/mtasa-neon/commit/7f96f186f), and the build-mode split by [`11ed444dc`](https://github.com/Dryxio/mtasa-neon/commit/11ed444dc).

Public Neon builds keep crash artifacts and report logs local rather than uploading them through the upstream diagnostics service. That privacy-oriented release configuration is implemented by [`a0ea9c032`](https://github.com/Dryxio/mtasa-neon/commit/a0ea9c032); the commit built the affected client projects but did not record a runtime crash-report exercise.

Do not redistribute a local `CUSTOM` build as if it were the public package.

## Native world requirements

Native-world transport and activation need matching Neon client and server builds. A format-3 child can be published inertly, but only the selected-set coordinator may request startup. An incompatible client is rejected rather than receiving a partial set.

The first authorization requires a clean two-launch transaction to the same passwordless numeric endpoint. While a selected catalogue is active, the session is pinned to its owner endpoint and suppresses saved or supplied credentials. Exact reconnect remains possible after the opaque server identity is revalidated, and spatial residency can switch between packs already admitted to the set.

Connecting to a different server or changing the selected set no longer requires the player to close GTA first. Neon queues the connection, unloads the active native content, returns the process to a clean state, and admits the new audited set. If that safe drain cannot be proved, it uses an exact-readback restart fallback instead of mixing two native-world sessions.

## Narrow compatibility fixes

Recent engine work also preserves native mission-ped fight and choking reactions, avoids two audited shadow/IK streaming crash paths, and prevents extended-world relocation operands from being overwritten by later vehicle/melee patches. Those paths have different evidence: the mission reactions and helicopter entry were checked in game, while the original shadow/IK crash timing was not reproduced after the guards were added.

The SilentPatch-compatible DFT-30 wheel-name fallback accepts `wheel_lm` where the model normally expects `wheel_lm_dummy`. The implementation is present, but that commit did not record a dedicated runtime validation.

## Local preview security

The drag-and-drop DFF/TXD and IFP tools are local previews, not secure multiplayer features. They do not ask the server for permission. Replacing a base model also changes every locally rendered ped that uses it.

## Project identity

MTA:SA Neon is built on the GPLv3 MTA:SA source history but is independently maintained. It is not affiliated with or endorsed by the Multi Theft Auto team. Use upstream MTA channels for official downloads, documentation, and support.
