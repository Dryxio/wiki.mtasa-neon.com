---
title: Native GTA radio playback
description: Read, restore, and synchronize GTA:SA's real radio playback state from client Lua.
---

Neon exposes the state of **GTA:SA's native radio manager**, not a replacement sound player. A client resource can capture the current station and track, restore it later, or relay the snapshot to another client when a game mode wants synchronized radio playback.

## Save and restore

```lua
local saved = getRadioPlaybackState()

-- later
if saved then
    setRadioPlaybackState(saved)
end
```

[`getRadioPlaybackState`](/neon/functions/getRadioPlaybackState) returns the current radio on/off state, station, track identity/type/index, playback position and length, flags, and GTA's queued tracks.

[`setRadioPlaybackState`](/neon/functions/setRadioPlaybackState) validates the complete snapshot before asking GTA to restore it. The current implementation lets GTA finish its asynchronous stopping transition before applying the requested playback state, so a restore does not race the native radio state machine and leave playback silent.

## Synchronizing between clients

The API is client-local. Neon does not automatically broadcast radio state.

A multiplayer resource can relay a snapshot through normal server events and apply it on another client:

```lua
local state = getRadioPlaybackState()
if state then
    triggerServerEvent("radio:share", resourceRoot, state)
end
```

The resource remains responsible for deciding **when** to capture, how to account for network delay, and whether clients should seek to a later position before applying the snapshot.

## Scope

- This controls GTA's built-in radio playback only.
- The snapshot must contain the required track and queue fields; invalid ranges are rejected.
- Track indices use GTA's native signed range.
- The functions do not create MTA sound elements or alter server authority.
- Restoring one snapshot does not create a persistent synchronization lease.

The focused `native-radio-playback` resource covers state capture, restore, seek, and two-client relay. The final playback-restore fix is tracked by [`ebd8931b9`](https://github.com/Dryxio/mtasa-neon/commit/ebd8931b9).
