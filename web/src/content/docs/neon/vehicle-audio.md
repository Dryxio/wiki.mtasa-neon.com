---
title: Custom vehicle audio
description: Give chosen cars high-quality engine sounds that react to driving, plus backfire sounds and exhaust flames.
---

Give a chosen car its own high-quality engine sound. Neon makes it rise and fall with the engine RPM, throttle and gear changes. It can also play backfire pops and shoot matching flames from the exhaust.

Already have an Assetto Corsa or Soundize `.bank`? The audio work is already done. Copy the bank into your resource, add a small text file, assign it to a GTA vehicle, and activate that vehicle. Neon then follows its RPM, throttle and gears automatically—there is no FMOD project, bank conversion, or per-frame audio script to write for an existing compatible bank.

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

## Import an Assetto Corsa sound step by step

This complete example gives the Elegy an existing `ae86.bank` sound and enables its backfire sound and flames.

### 1. Copy the sound files

Create this structure in your resource:

```text
vehicle-audio/
├── meta.xml
├── client.lua
├── server.lua
└── audio/
    ├── vehicles.conf
    ├── base/
    │   ├── common.bank
    │   └── common.strings.bank
    └── banks/
        ├── ae86.bank
        └── ae86.ini
```

Copy the vehicle `.bank` from the Assetto Corsa or Soundize pack into `audio/banks/`. Copy the shared `base` banks once; every vehicle in the resource reuses them. Keep the pack's `GUIDs.txt` nearby if it has one—it is useful for checking event names, but Neon does not need to download it.

Only distribute sounds that you have permission to use.

### 2. Describe the events in a small INI file

The INI filename must match the bank filename. For `ae86.bank`, create `audio/banks/ae86.ini`:

```ini
[Event]
EngineExtEvent=event:/cars/<name>/engine_ext
EngineIntEvent=event:/cars/<name>/engine_int
BackfireExtEvent=event:/cars/<name>/backfire_ext
BackfireIntEvent=event:/cars/<name>/backfire_int
GearExtEvent=event:/cars/<name>/gear_ext
GearIntEvent=event:/cars/<name>/gear_int
```

`<name>` automatically becomes `ae86`. These are the usual Assetto Corsa event names, and the usual `rpms`, `throttle`, and `state` parameters already work by default. If your pack uses different event names, copy the exact paths shown in its `GUIDs.txt` instead.

### 3. Assign the bank to a GTA vehicle

Create `audio/vehicles.conf`:

```text
version 1

vehicle
# model bank   volume minRPM maxRPM shiftRPM rpmUp rpmDown shiftMs backfireMs turboBov flags
elegy  "ae86"  1.0    1000   8000   7000     50    100     800     250        0        3
end
```

This assigns `ae86.bank` to the Elegy. In practice, the values you will most often tune are the volume and the three RPM values. The final `3` enables backfire audio (`1`) plus exhaust flames (`2`). Add the values together when a vehicle needs several features:

| Flag | Enables |
| ---: | --- |
| `1` | Automatic and scripted backfire audio. |
| `2` | Exhaust flame effects when the vehicle uses a full/flames audio mode. |
| `4` | Turbo boost and blow-off presentation. |

### 4. Add the files to `meta.xml`

```xml
<meta>
    <script src="client.lua" type="client" />
    <script src="server.lua" type="server" />

    <file src="audio/vehicles.conf" />
    <file src="audio/base/common.bank" />
    <file src="audio/base/common.strings.bank" />
    <file src="audio/banks/ae86.bank" />
    <file src="audio/banks/ae86.ini" />
</meta>
```

### 5. Load the configuration

Put this in `client.lua`:

```lua
addEventHandler("onClientResourceStart", resourceRoot, function()
    if not engineLoadVehicleAudioConfig("audio/vehicles.conf") then
        outputDebugString("Vehicle audio configuration was not accepted")
    end
end)
```

### 6. Activate the vehicle

Set the synchronized `neon:vehicleAudio` element data on the vehicle. This `server.lua` creates an Elegy with the full sound-and-flames mode:

```lua
addEventHandler("onResourceStart", resourceRoot, function()
    local vehicle = createVehicle(562, 2495, -1668, 13.3)
    setElementData(vehicle, "neon:vehicleAudio", "full")
end)
```

Start the resource and drive the car. Neon now reads the real vehicle state and controls the engine sound, throttle, gear changes, backfire pops, and configured flames. Other players who receive the resource hear the custom engine too.

To add another car, repeat only the vehicle `.bank`, matching `.ini`, one line in `vehicles.conf`, and the two relevant `<file>` entries. The base banks and Lua loading code stay the same.

This quick path is for an existing compatible `.bank`. Creating a new bank from raw recordings is separate audio-authoring work; it is not required when importing a prepared Assetto Corsa or Soundize sound.

## Activation modes and reloading

Use these synchronized `neon:vehicleAudio` values on configured vehicles:

| Value | Result |
| --- | --- |
| `"sound"` or `1` | Custom sound presentation. |
| `"full"`, `"flames"`, `2`, or `true` | Custom sound plus configured backfire effects. |
| `"silent-local"` or `3` | Keeps the vehicle in the custom manager while suppressing its local custom sound mix. |

Unknown or absent values leave the vehicle on the ordinary path. The separate `neon:vehicleAudioCompetitive` flag is used by a specific showcase mix and should not be treated as the general public activation contract.

One resource owns the vehicle-audio system on each client. That resource can call [`engineReloadVehicleAudioConfig`](/neon/functions/engineReloadVehicleAudioConfig) while tuning local files, or [`engineUnloadVehicleAudioConfig`](/neon/functions/engineUnloadVehicleAudioConfig) when it no longer needs the system. Restart the resource after changing files that clients must download.

A successful load means the configuration was accepted. The banks open when Neon first needs them, so test the vehicle in game to catch a missing file or incorrect event path.

## Script and share a backfire

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
