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

Enabled modes also require the stable server ID, issuer, active key ID, and matching published Ed25519 public key. Keep deployment secrets and private service administration outside resources and public documentation.

## Read identity from Lua

Server resources can use:

- [`isPlayerNeonAuthenticated`](/neon/functions/isPlayerNeonAuthenticated);
- [`getPlayerNeonID`](/neon/functions/getPlayerNeonID);
- [`getPlayerDiscordID`](/neon/functions/getPlayerDiscordID);
- [`getBanNeonID`](/neon/functions/getBanNeonID) and [`getBanDiscordID`](/neon/functions/getBanDiscordID);
- Neon's extended [`addBan`](/neon/functions/addBan) contract for identity keys.

Discord IDs are returned as strings because a Discord snowflake can exceed the exact integer precision available to Lua 5.1.

## Tickets and privacy boundaries

The client requests a short-lived, one-use signed ticket for the specific server ID and actual IPv4 endpoint. The server checks issuer, audience, key ID, signature, lifetime, endpoint, and replay state before accepting it. Discord OAuth requests only the basic identity scope, and OAuth access tokens are not stored as server-visible Lua data.

When Identity is enabled, the verified Neon ID and Discord ID are intentionally available to that server's Lua resources. Server owners should disclose how they use and retain those identifiers. Players should not treat an Identity-enabled server as unable to see the linked Discord ID.

## Identity-aware bans

A ban can store a Neon account ID and Discord ID alongside its ordinary IP, username, or serial keys. A live serial ban automatically captures identities that were verified for that player. An offline `addBan` call cannot infer identities from a serial, so a resource must pass any identity keys explicitly.

Identity-only bans are accepted, but an invalid or already-overlapping identifier makes the complete `addBan` call fail. Strong enforcement depends on `neon_auth=required`: with optional or disabled authentication, a player without verified identity can only be matched by the other available ban keys.

## Current limits and evidence

Registry verification confirms the registered service flow, not the integrity of every server binary or resource. Key-rotation overlap and a general owner administration portal are not presented as completed workflows.

Commit [`e71b499eb`](https://github.com/Dryxio/mtasa-neon/commit/e71b499eb) introduced the player ticket flow and three player getters. Commit [`637f84214`](https://github.com/Dryxio/mtasa-neon/commit/637f84214) finalized identity-aware bans, the two ban getters, and the extended `addBan` contract. Service tests and development runtime flows exist, but there is no checked-in MTA test resource that directly asserts these five getters and `addBan` end to end.
