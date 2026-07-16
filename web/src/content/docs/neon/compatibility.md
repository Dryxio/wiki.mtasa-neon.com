---
title: Compatibility
description: How Neon APIs, packet capabilities, legacy clients, and upstream MTA behavior coexist.
sidebar:
  order: 7
---

Neon preserves MTA's resource model and ordinary gameplay behavior while adding opt-in engine capabilities. Compatibility must be evaluated per feature; “it connects” does not imply that every Neon API or extended packet field is available.

## Detect Neon APIs

Resources intended to run on both distributions should feature-detect before calling Neon-only functions:

```lua
if type(engineGetRendererStats) ~= "function" then
    outputDebugString("This optional diagnostic requires MTA:SA Neon")
    return
end

local stats = engineGetRendererStats()
```

For a resource whose content fundamentally requires Neon, fail early with a clear message instead of silently degrading halfway through a lifecycle.

## Capability-gated network changes

Neon uses bitstream capabilities for packet-layout changes including:

- extended low-precision world coordinates;
- extended absolute camera coordinates;
- server model registry definitions and logical IDs;
- native-world transport;
- the separate startup-authorization request;
- synchronized `fastweaponstrafe` state.

Older clients retain the packet layout they understand. Native-world engine-only files and descriptors are omitted entirely for clients lacking the transport capability.

## Model fallback

Server-managed elements retain a native parent. A capable client maps the stable logical ID to one of its own runtime slots; a legacy client or a client without an active slot renders and simulates the parent model instead.

This fallback preserves connectivity and basic behavior, but it does not reproduce the custom model's appearance. Resources must decide whether that is acceptable for their gameplay.

## Existing MTA APIs extended by Neon

[`setPedEnterVehicle`](/neon/functions/setPedEnterVehicle) and [`setPedExitVehicle`](/neon/functions/setPedExitVehicle) remain MTA APIs. Neon verifies and uses the underlying GTA passenger/leave task layouts while keeping the server-confirmed occupant lifecycle.

[`setGlitchEnabled`](/neon/functions/setGlitchEnabled) and [`isGlitchEnabled`](/neon/functions/isGlitchEnabled) accept the additional `fastweaponstrafe` name. The option is synchronized and disabled by default.

While a resource owns the Neon script-camera lease, legacy client camera setters are rejected. An authoritative server camera RPC revokes the lease before applying server control.

## Client binary pairing

The current custom `netc.dll` must remain paired with the current Neon source ABI. The old MTA 1.6 network module is not a drop-in replacement. Keep official MTA installations isolated from the custom build.

## Native world requirements

Native-world transport and authorization require matching capable client/server builds. Activation, once implemented, will also require a clean startup transaction and exact server identity/endpoint continuity. Hot-loading an audited cache object into a running GTA process is not a supported compatibility path.

## Local preview security

Drag-and-drop DFF/TXD and IFP preview features are intentionally insecure local developer prototypes. They do not provide server authorization and must not be treated as a competitive-client feature. Replacing a base model also changes every locally rendered ped using that model.

## Project identity

MTA:SA Neon is built on the GPLv3 MTA:SA source history but is independently maintained. It is not affiliated with or endorsed by the Multi Theft Auto team. Use upstream MTA channels for official downloads, documentation, and support.
