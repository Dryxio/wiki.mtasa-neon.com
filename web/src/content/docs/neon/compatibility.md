---
title: Compatibility
description: What works between Neon, standard MTA clients, and older packet layouts.
sidebar:
  order: 7
---

Neon keeps MTA's resource model and normal gameplay defaults. Its extra engine features are opt-in, and compatibility varies from one feature to another. A client being able to connect does not mean it understands every Neon API or packet field.

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
- native-world transport;
- the separate startup-authorization request;
- synchronized `fastweaponstrafe` state.

Older clients keep the packet layout they already understand. If a client does not support native-world transport, the server leaves those engine-only files and descriptors out completely.

## Model fallback

Server-managed elements retain a native parent. A capable client maps the stable logical ID to one of its own runtime slots; a legacy client or a client without an active slot renders and simulates the parent model instead.

This keeps the client connected and the element usable, but it cannot reproduce the custom model's appearance. The resource still has to decide whether that fallback is good enough for its gameplay.

## Existing MTA APIs extended by Neon

[`setPedEnterVehicle`](/neon/functions/setPedEnterVehicle) and [`setPedExitVehicle`](/neon/functions/setPedExitVehicle) remain MTA APIs. Neon verifies and uses the underlying GTA passenger/leave task layouts while keeping the server-confirmed occupant lifecycle.

[`setGlitchEnabled`](/neon/functions/setGlitchEnabled) and [`isGlitchEnabled`](/neon/functions/isGlitchEnabled) accept the additional `fastweaponstrafe` name. The option is synchronized and disabled by default.

While a resource owns the Neon script-camera lease, legacy client camera setters are rejected. An authoritative server camera RPC revokes the lease before applying server control.

## Client binary pairing

Use client binaries from the same Neon build. Mixing `netc.dll` from an official or older MTA installation with a current Neon client is unsupported because the module ABI may differ.

## Native world requirements

Native-world transport and authorization need matching client and server builds. Future activation will also need a clean startup transaction with the same server identity and endpoint. Neon will not hot-load an audited cache object into an already running GTA process.

## Local preview security

The drag-and-drop DFF/TXD and IFP tools are local previews, not secure multiplayer features. They do not ask the server for permission. Replacing a base model also changes every locally rendered ped that uses it.

## Project identity

MTA:SA Neon is built on the GPLv3 MTA:SA source history but is independently maintained. It is not affiliated with or endorsed by the Multi Theft Auto team. Use upstream MTA channels for official downloads, documentation, and support.
