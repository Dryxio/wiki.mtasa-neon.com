---
title: Custom vehicle audio
description: Give chosen cars high-quality engine sounds that react to driving, plus backfire sounds and exhaust flames.
---

Give a chosen car its own high-quality engine sound. Neon makes it rise and fall with the engine RPM, throttle and gear changes. It can also play backfire pops and shoot matching flames from the exhaust.

Adding another car sound is mostly a content step, not a new audio script. Convert a vehicle sound set—an Assetto Corsa engine pack, for example—to the expected FMOD banks, map its event names and basic RPM settings once, then assign it to a model. Neon adapts the sound while the car drives; the resource does not have to change pitch or switch samples every frame.

Other players hear the custom engines of configured cars around them too. A resource can also relay a scripted backfire to nearby clients, so everyone hears the pop and sees the exhaust burst at the same moment.

<video controls playsinline preload="metadata"
       poster="/neon-media/vehicle-audio-poster.jpg"
       style="display:block;width:100%;max-width:45rem;height:auto;margin-inline:auto;border-radius:.5rem;">
  <source src="/neon-media/vehicle-audio-showcase.mp4" type="video/mp4" />
  Your browser cannot play this clip. It shows a car using a custom engine sound
  while Neon fires visible backflames from both exhausts.
</video>

**Turn the sound on.** This BUST race uses a resource-provided HD engine bank. The resource supplies the sounds and chooses the car; Neon handles the live engine mix, automatic backfires and exhaust flames. The backfire is part of Neon, not a video-only server effect, and Lua can also trigger it on demand with [`enginePlayVehicleAudioBackfire`](/neon/functions/enginePlayVehicleAudioBackfire).

This is useful beyond racing: custom cars, mission vehicles, convoys, roleplay fleets, cinematics, and scripted events can all share the same audio layer. GTA audio returns automatically when the system stops.

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

The owner resource can call [`enginePlayVehicleAudioBackfire`](/neon/functions/enginePlayVehicleAudioBackfire) with mode `1` or `2` for a vehicle already active in its configuration. That immediately plays the configured pop and, in a full/flames audio mode, creates a normal or stronger burst at the exhaust. The function is client-side: relay the trigger to the relevant clients when other players should hear and see the same backfire. Other modes, a foreign owner, or an inactive vehicle return `false`.

For example, the server can tell every client to render the same scripted backfire:

```lua
-- server.lua
function playBackfireForEveryone(vehicle, mode)
    triggerClientEvent(root, "garage:playBackfire", resourceRoot, vehicle, mode)
end
```

```lua
-- client.lua, in the resource that owns the vehicle-audio configuration
addEvent("garage:playBackfire", true)
addEventHandler("garage:playBackfire", resourceRoot, function(vehicle, mode)
    if isElement(vehicle) then
        enginePlayVehicleAudioBackfire(vehicle, mode)
    end
end)
```

The server decides when the backfire happens; each client nearby can then render the configured sound and exhaust effect locally. In a production resource, send the event only to players close enough to see or hear the vehicle.

## Lifecycle and current limits

Reload and unload are owner-only. Stopping the owner resource releases the lease and tears down the manager automatically. Commit [`fd9045aea`](https://github.com/Dryxio/mtasa-neon/commit/fd9045aea) corrected shutdown ordering so the audio manager releases FMOD state before the backend disappears.

The engine currently emits an internal `onClientVehicleAudioBackfire` call, but the name is not registered in the client's built-in event list. Do not document or depend on it as a normal public event yet; a future engine change must register and test that contract first.

Commit [`0418bcea7`](https://github.com/Dryxio/mtasa-neon/commit/0418bcea7) introduced the four public Lua functions and the resource lease. The client project built, and AE86/Soundize-bank and BUST gameplay runs exercised the path manually. There is no public checked-in test resource, configuration, or bank that reproduces those checks, so this guide does not call playback broadly validated. Commit [`0464ee0c1`](https://github.com/Dryxio/mtasa-neon/commit/0464ee0c1) packages the required FMOD 2.02.26 x86 runtime with the Windows client.
