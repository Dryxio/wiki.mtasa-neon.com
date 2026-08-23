---
title: Custom vehicle audio
description: Give selected vehicle models custom engine sounds and backfires, then restore GTA audio automatically when the system stops.
---

Give selected vehicle models custom engine sounds and backfires from a resource. The server can choose which vehicles use them, every client hears the same configured sound set, and GTA audio returns automatically when the system stops.

This is useful beyond racing: custom cars, mission vehicles, convoys, roleplay fleets, cinematics, and scripted events can all share the same audio layer.

<!-- MEDIA PLACEHOLDER: Custom vehicle audio demonstration. Prefer a captioned video with sound, plus a still thumbnail at /neon-media/vehicle-audio.webp. Show an ordinary vehicle and a configured vehicle at similar RPM, then a mode-2 backfire. -->

## Resource flow

```lua
addEventHandler("onClientResourceStart", resourceRoot, function()
    if not engineLoadVehicleAudioConfig("audio/vehicles.conf") then
        outputDebugString("Vehicle audio configuration was not accepted")
    end
end)
```

The configuration path must be non-empty and resolve inside the calling resource. One resource owns the single global vehicle-audio lease on a client. That owner can call [`engineReloadVehicleAudioConfig`](/neon/functions/engineReloadVehicleAudioConfig) after changing its files or [`engineUnloadVehicleAudioConfig`](/neon/functions/engineUnloadVehicleAudioConfig) when it no longer needs the system.

The configuration directory must contain `base/common.bank` and `base/common.strings.bank`. Vehicle banks live below `banks/`; each `*.bank` needs a same-stem `*.ini` metadata file. A vehicle-definition line can combine these flags:

| Flag | Enables |
| ---: | --- |
| `1` | Automatic and scripted backfire audio. |
| `2` | Exhaust flame effects when the vehicle uses a full/flames audio mode. |
| `4` | Turbo boost and blow-off presentation. |

Add the values together when a definition needs more than one behavior.

A successful load means the configuration and lease were accepted. FMOD and its banks initialize lazily, so `true` does not by itself prove that a requested bank will play in game.

## Activate a vehicle

Set the synchronized `neon:vehicleAudio` element data on vehicles that should use the loaded definitions:

| Value | Result |
| --- | --- |
| `"sound"` or `1` | Custom sound presentation. |
| `"full"`, `"flames"`, `2`, or `true` | Custom sound plus configured backfire effects. |
| `"silent-local"` or `3` | Keeps the vehicle in the custom manager while suppressing its local custom sound mix. |

Unknown or absent values leave the vehicle on the ordinary path. The separate `neon:vehicleAudioCompetitive` flag is used by a specific showcase mix and should not be treated as the general public activation contract.

The owner resource can call [`enginePlayVehicleAudioBackfire`](/neon/functions/enginePlayVehicleAudioBackfire) with mode `1` or `2` for a vehicle already active in its configuration. Other modes, a foreign owner, or an inactive vehicle return `false`.

## Lifecycle and current limits

Reload and unload are owner-only. Stopping the owner resource releases the lease and tears down the manager automatically. Commit [`fd9045aea`](https://github.com/Dryxio/mtasa-neon/commit/fd9045aea) corrected shutdown ordering so the audio manager releases FMOD state before the backend disappears.

The engine currently emits an internal `onClientVehicleAudioBackfire` call, but the name is not registered in the client's built-in event list. Do not document or depend on it as a normal public event yet; a future engine change must register and test that contract first.

Commit [`0418bcea7`](https://github.com/Dryxio/mtasa-neon/commit/0418bcea7) introduced the four public Lua functions and the resource lease. The client project built, and AE86/Soundize-bank and BUST gameplay runs exercised the path manually. There is no public checked-in test resource, configuration, or bank that reproduces those checks, so this guide does not call playback broadly validated. Commit [`0464ee0c1`](https://github.com/Dryxio/mtasa-neon/commit/0464ee0c1) packages the required FMOD 2.02.26 x86 runtime with the Windows client.
