---
title: Native world packs
description: Load reviewed city packs such as Vice City, Liberty City, Bullworth, and Carcer City through GTA's own streaming system.
sidebar:
  order: 4
---

Load reviewed city packs such as **Bullworth, Vice City, Liberty City, and Carcer City** through GTA's own streaming system, then travel between the selected cities while GTA streams the correct world around the player.

The active native-world session owns that selected catalogue, but it does not keep every imported city resident at once. Neon automatically retires the previous city and materializes the selected pack whose reviewed bounds contain the new streaming position. San Andreas remains available between those regions.

This is a reviewed multi-city path, not a general-purpose arbitrary-world loader.

<!-- MEDIA PLACEHOLDER: Native-world residency. Suggested file: /neon-media/native-world-city-switch.webp or a video showing travel between two reviewed city regions. State which generated test packs are shown and avoid implying that their assets ship with Neon. -->

## What a player or server operator should expect

- The client downloads, audits, and caches the exact set before GTA may load it.
- Activation still uses a controlled two-launch flow and the same passwordless numeric endpoint.
- The server chooses an ordered set of one to eight unique, compatible child packs. Order is part of the set identity.
- One imported city is spatially resident at a time. Travel can switch cities inside the selected set without restarting MTA.
- Session shutdown can now drain and detach the committed format-3 content. The supported path to a different selected set or server still requires a new startup ticket and clean restart because same-process readmission is not complete.
- Current Neon client and server builds must match the native-world protocol. There is no silent downgrade to an ordinary resource download.
- Radar, paths, population, zones, audio, interiors, and environment data are separate work.

## Format 3: selected static-world sets

A child pack is publish-only. It contains one manifest, one IDE, a mandatory LOD relationship file, and between one and 32 IMG archives:

```xml
<native_world format="3" policy="static-world-v3"
              manifest="native/native-world.json" />
```

```text
native/native-world.json
native/world.ide
native/world.lod
native/w000.img ... native/w031.img
```

Each IMG is limited to 256 MiB and the complete child payload to 8 GiB. A child cannot set `startup="true"`; only the coordinator may authorize a set.

The coordinator publishes the canonical ordered selection:

```xml
<native_world format="3" policy="static-world-v3-set"
              manifest="native/static-world-v3-set.json"
              startup="true" />
```

Before any native mutation, the server and client lock and re-audit the set envelope and every selected child, then rerun the aggregate planner. Pack IDs, content IDs, logical model ranges, files, coordinates, LOD relationships, and combined capacities must still match the accepted plan.

## Runtime residency

Selected packs keep their stable logical model identities, while the active city uses one of two 4,096-slot physical banks:

```text
bank A   20000 .. 24095
bank B   24096 .. 28191
```

Each child may define at most 4,096 models. The selected set may describe at most 12,000 models across its non-overlapping logical ranges. When travel crosses reviewed city bounds, Neon prepares the target scene, retires the old generation, and reuses the other physical bank.

The generation fence removes cover data, IPL and LOD anchors, archive channels, collision, models, and stale bindings before a bank is reused. This switching is automatic engine behavior; there is no public Lua function that selects a city.

Commit [`ac3a54f57`](https://github.com/Dryxio/mtasa-neon/commit/ac3a54f57) also moved resource-managed server model IDs to 42,341–65,534, above Neon's complete native FileID layout. Those server IDs are separate from the two physical residency banks.

## Download, audit, and cache

After normal resource download checks, a cancellable worker:

1. copies each payload into same-volume quarantine;
2. parses its manifest, IDE, LOD relationships, IMG directories, DFF/TXD data, COL, and binary IPLs;
3. derives model, texture, collision, placement, archive, coordinate, and streaming budgets;
4. rejects unknown grammar, unsafe names, non-finite values, collisions, overflows, and unsupported content;
5. publishes immutable cache objects with atomic directory renames;
6. reopens and validates the final objects under no-write/no-delete handles.

A content hash proves that bytes are identical. It does not identify who sent them and does not authorize GTA to load them. Reparse points, unsafe siblings, corrupt objects, ambiguous crash residue, quota exhaustion, and a changed set fail closed.

<span id="the-two-launch-activation"></span>

## Two-launch activation

```text
launch 1: download -> audit -> immutable cache -> pending set authorization
                                      |
                                      v
                           nativeworldauth restart
                                      |
                                      v
launch 2: exact set and child re-audit -> one-shot claim -> server validation
          -> registrar generation 1 -> process lease
```

The player controls the pending transaction from F8:

```text
nativeworldauth status
nativeworldauth restart
nativeworldauth clear
```

The record expires after 15 minutes. It is bound to the exact ordered content set, opaque server identity, numeric IPv4 endpoint, resource generation, and negotiated protocol version. It contains no password, raw server key, hostname, payload path, or server-selected executable path.

On launch 2, Neon opens the exact cache objects named by the record, fully re-audits them, validates the supported GTA executable and patch sites, then spends the one-shot ticket before native mutation. The new connection must reproduce the endpoint, server identity, and protocol version.

## Session teardown and server isolation

While a selected set is active, Neon pins connection routes to the owner endpoint before network reset, reconnect, mod unload, or credential lookup.

- An active-session mismatch is blocked without destroying the valid owner session.
- Saved and supplied credentials remain suppressed while native-world startup or residency is active.
- Passworded native-world startup is not supported.

Format-3 teardown now has explicit `Active → Draining → Detached → Neutral` fences. It stops new city work, flushes outstanding streaming I/O, removes generation-owned entities, IPL and LOD anchors, collisions, model bindings and archive channels, releases immutable-cache handles, restores the native stores and pools, and then releases the endpoint-owned session. The recorded live gate reached content-neutral, session-neutral, admission-baseline-matching, I/O-quiescent state with zero cache handles.

That is a real cleanup boundary, not a supported hot server switch yet. The later readmission checkpoint is still marked WIP: after reconnect, a changed structural baseline makes Neon publish `restart-required=yes`. Use the clean two-launch flow for a different set or server until that invariant is resolved.

The endpoint is only a locator. The opaque network identity provides continuity inside this workflow; it is not PKI or proof of the operator's legal identity.

## Capacity and boundaries

The installed foundation contains 42,341 native FileIDs: 32,000 DFF, 8,000 TXD, 512 COL, 1,024 IPL, and the smaller DAT/IFP/RRR/SCM stores. Related native pools contain 32,000 buildings, 30,000 collision models, and 2,048 quadtree nodes.

The four-city tour observed these peak values:

| Store or pool | Observed / installed |
| --- | ---: |
| TXD | 4,933 / 8,000 |
| COL | 373 / 512 |
| IPL | 314 / 1,024 |
| Buildings | 21,500 / 32,000 |
| Collision models | 21,819 / 30,000 |
| Quadtree nodes | 280 / 2,048 |

These are observed high-water marks, not universal safe budgets. Other current boundaries are:

- only the four reviewed pack pipelines are accepted; arbitrary static worlds are not proved;
- at most one imported city is materialized at a time;
- the selected catalogue cannot be replaced while its generation is active, and supported readmission still uses a clean restart;
- two exact audited GTA SA 1.0 US executable identities are supported;
- high static IPL slots cannot own car generators;
- paths, nodes, population, zones, audio, interiors, radar, and environment remain separate;
- a true Direct3D device-reset pass is still missing; borderless minimize/restore did not trigger one.

## Legacy single-pack formats

Formats 1 and 2 remain for the original Bullworth path. Format 1 uses the compiled `bullworth` policy; format 2 uses the closed `static-world-v1` grammar. Both accept one manifest, one IDE, and one IMG, and use the same two-launch authorization model. They do not gain v3 multi-IMG or selected-set behavior.

## Verification summary

The strongest runtime pass exercised San Andreas plus all four reviewed cities through generations 2–29, including adjacent and direct city switches, physical-bank reuse, death/respawn, reconnect, resource restart, and server restart. A separate non-contiguous Bullworth + Liberty City + Carcer City set kept omitted Vice City inactive. The generic network contract was then checked with a three-pack ordered set and rejection of an exact old client before join.

All 3,038 reviewed Vice City and Liberty City LOD relationships were preserved. The format-3 transport and set parser, aggregate planner, cache recovery, registrar, generic network contract, neutral-state baseline, generation ownership, runtime drain, teardown, and session release also have focused automated coverage. The teardown sequence grew through a recorded 196-test suite, while the later 57-test readmission checkpoint remains explicitly WIP. Relevant client projects, including Game SA, Core, Client Deathmatch, and Multiplayer SA where affected, built for the corresponding checkpoints.

This evidence covers the reviewed assets and named lifecycle. It does not prove arbitrary content, every possible one-to-eight-pack combination, every optional GTA subsystem, or a real D3D device reset.

<details>
<summary>Implementation provenance</summary>

- format-3 multi-IMG transport and aggregate planning: [`42597bd84`](https://github.com/Dryxio/mtasa-neon/commit/42597bd84), [`11dc68396`](https://github.com/Dryxio/mtasa-neon/commit/11dc68396), [`c6723544c`](https://github.com/Dryxio/mtasa-neon/commit/c6723544c), and [`96230e389`](https://github.com/Dryxio/mtasa-neon/commit/96230e389);
- transactional registrar, LOD bootstrap, and generation-fenced residency: [`3b4ee3d8b`](https://github.com/Dryxio/mtasa-neon/commit/3b4ee3d8b), [`f9ff61552`](https://github.com/Dryxio/mtasa-neon/commit/f9ff61552), and [`7cee41f57`](https://github.com/Dryxio/mtasa-neon/commit/7cee41f57);
- reviewed selection and generic network contract: [`22f863ea2`](https://github.com/Dryxio/mtasa-neon/commit/22f863ea2) and [`ac3a54f57`](https://github.com/Dryxio/mtasa-neon/commit/ac3a54f57);
- live registrar baselines, neutral contract, generation journal, drain, detach, and session release: [`52453ba39`](https://github.com/Dryxio/mtasa-neon/commit/52453ba39), [`f386b71e9`](https://github.com/Dryxio/mtasa-neon/commit/f386b71e9), [`5e208efcb`](https://github.com/Dryxio/mtasa-neon/commit/5e208efcb), [`555386e57`](https://github.com/Dryxio/mtasa-neon/commit/555386e57), [`759b35e19`](https://github.com/Dryxio/mtasa-neon/commit/759b35e19), and [`8fdf082cf`](https://github.com/Dryxio/mtasa-neon/commit/8fdf082cf);
- incomplete same-process readmission checkpoint: [`b00858f6b`](https://github.com/Dryxio/mtasa-neon/commit/b00858f6b).

Focused harnesses and evidence labels are indexed on [Tooling and verification](/neon/tooling-and-verification).

</details>
