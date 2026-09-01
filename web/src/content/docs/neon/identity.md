---
title: Neon Identity
description: Optional Neon and Discord identity for server connections, Lua resources, registry listings, and identity-aware bans.
---

Neon Identity lets a server associate a connected player with a verified Neon account and Discord account. It is optional and disabled by default, so an existing server can keep its current connection behavior until its owner deliberately configures the service.

Use it when a server needs a stable platform identity for access policy, community roles, administration, or bans that should not rely only on an MTA serial.

<!-- MEDIA PLACEHOLDER: Player identity flow. Suggested file: /neon-media/identity-sign-in.webp or a short video. Show the player-facing sign-in and successful return to Neon; never capture OAuth tokens, tickets, public-key configuration, or private admin data. -->

## Choose an authentication policy

`neon_auth` accepts three modes in `mtaserver.conf`:

| Mode | Connection behavior |
| --- | --- |
| `disabled` | Identity is not requested or verified. This is the default. |
| `optional` | A signed-in player can provide verified identity, but a player without it may still join. |
| `required` | The player must provide a valid, fresh ticket before the server creates the player element. |

For an ordinary public server, enabling Identity is now one setting:

```xml
<neon_auth>optional</neon_auth>
```

On first start, the server creates `neon-identity.keys`, keeps the same `nsrv_...` identity across restarts, proves its exact public endpoint through ASE, and renews its registration automatically. Keep that file private and include it in backups; replacing it creates a different server identity.

Automatic onboarding needs a public ASE endpoint and Internet access. A private or LAN-only server can leave Identity disabled or use the existing complete manual/custom configuration. In `required` mode, connections are refused while automatic registration is unavailable or still pending. In `optional` mode, ordinary connections continue but their verified IDs may be unavailable.

`neon_registry=0` hides the server from the public Neon list; it does not disable Identity registration when `neon_auth` is enabled.

## Read identity from Lua

Server resources can use:

- [`isPlayerNeonAuthenticated`](/neon/functions/isPlayerNeonAuthenticated);
- [`getPlayerNeonID`](/neon/functions/getPlayerNeonID);
- [`getPlayerDiscordID`](/neon/functions/getPlayerDiscordID);
- [`getBanNeonID`](/neon/functions/getBanNeonID) and [`getBanDiscordID`](/neon/functions/getBanDiscordID);
- Neon's extended [`addBan`](/neon/functions/addBan) contract for identity keys.

The cancellable `onPlayerConnect` event also appends both IDs after its existing arguments:

```lua
local allowedNeonIDs = {
    ["replace-with-an-allowed-neon-id"] = true,
}

addEventHandler("onPlayerConnect", root, function(
    nickname, ip, username, serial, versionNumber, versionString, neonID, discordID
)
    if neonID == false or not allowedNeonIDs[neonID] then
        cancelEvent(true, "Sign in with an allowed Neon account before joining.")
    end
end)
```

`neonID` and `discordID` are verified strings when available, otherwise `false`. In `required` mode both are verified before this event runs, so a resource can apply its own account policy before `onPlayerJoin`.

Discord IDs are returned as strings because a Discord snowflake can exceed the exact integer precision available to Lua 5.1.

## Tickets and privacy boundaries

The client requests a short-lived, one-use signed ticket for the specific server ID and actual IPv4 endpoint. The server checks issuer, audience, key ID, signature, lifetime, endpoint, and replay state before accepting it. Discord OAuth requests only the basic identity scope, and OAuth access tokens are not stored as server-visible Lua data.

When Identity is enabled, the verified Neon ID and Discord ID are intentionally available to that server's Lua resources. Server owners should disclose how they use and retain those identifiers. Players should not treat an Identity-enabled server as unable to see the linked Discord ID.

## Identity-aware bans

A ban can store a Neon account ID and Discord ID alongside its ordinary IP, username, or serial keys. A live serial ban automatically captures identities that were verified for that player. An offline `addBan` call cannot infer identities from a serial, so a resource must pass any identity keys explicitly.

Identity-only bans are accepted, but an invalid or already-overlapping identifier makes the complete `addBan` call fail. Strong enforcement depends on `neon_auth=required`: with optional or disabled authentication, a player without verified identity can only be matched by the other available ban keys.

## Current limits and evidence

Registry verification confirms the registered service flow, not the integrity of every server binary or resource. Key-rotation overlap and a general owner administration portal are not presented as completed workflows.

Commit [`e71b499eb`](https://github.com/Dryxio/mtasa-neon/commit/e71b499eb) introduced the player ticket flow and three player getters. Commit [`637f84214`](https://github.com/Dryxio/mtasa-neon/commit/637f84214) finalized identity-aware bans. Commit [`27101451c`](https://github.com/Dryxio/mtasa-neon/commit/27101451c) added automatic server onboarding, and [`1f1dc78e9`](https://github.com/Dryxio/mtasa-neon/commit/1f1dc78e9) added the two `onPlayerConnect` values.

The onboarding change passed 24 Identity service tests, PostgreSQL migration and concurrent-claim checks, client/server builds, and two real server restarts that confirmed automatic key creation and stable identity persistence. [`neon-identity-connect-test`](https://github.com/Dryxio/mtasa-neon/tree/master/test-resources/neon-identity-connect-test) directly checks the connection-event values against the player getters and verifies that cancellation prevents `onPlayerJoin`. Identity-aware ban paths and key-rotation overlap still do not have one complete checked-in MTA runtime pass.
