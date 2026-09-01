---
title: Native world packs
description: Load large custom maps through GTA's own world loader and streaming system, then switch map sets at runtime.
sidebar:
  order: 4
---

Give a server a custom static-world pack and Neon loads its models, textures, collision, and object placements through **GTA's own world loader and streaming system**. The map becomes a native part of the world: GTA loads the nearby area as the player moves instead of a Lua resource creating the whole map as thousands of scripted objects.

Bullworth, Vice City, Liberty City, and Carcer City are the reviewed proof packs, not a hardcoded list of allowed cities. A server can publish its own map after converting it to the supported format and passing the same strict file, model, collision, placement, and size checks.

One server may select up to eight compatible packs. Neon keeps only the imported city around the player's current position active, automatically unloads the previous one, and streams the next one through GTA. San Andreas remains available between those regions.

For format-3 sets, the first connection can download, audit, and load the map in the **same GTA process**. The player does not have to restart once just to enter the first custom world. Later, the player can also leave one Native World server and join another with a different map set without restarting GTA. Neon unloads the old native content, returns the game to a clean state, and loads the new server's audited set. If either admission or cleanup cannot be proved safe, Neon falls back to a verified restart instead of risking a mixed or corrupted world.

<!-- MEDIA PLACEHOLDER: Native-world residency. Suggested file: /neon-media/native-world-city-switch.webp or a video showing travel between two reviewed city regions. State which generated test packs are shown and avoid implying that their assets ship with Neon. -->

## What a player or server operator should expect

- The client downloads, audits, and caches the exact set before GTA may load it.
- A format-3 set can be admitted on the first connection without restarting GTA when every safety check passes.
- Formats 1 and 2 keep their controlled two-launch authorization flow.
- The server chooses an ordered set of one to eight unique, compatible child packs. Order is part of the set identity.
- One imported city is spatially resident at a time. Travel can switch cities inside the selected set without restarting MTA.
- After that setup, the client can unload one committed format-3 set and admit a different server or set in the same GTA process.
- If runtime cleanup is not safe, the client automatically uses a verified restart fallback.
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

An accepted format-3 cache object is fully hashed and inspected once, then kept as a verified read-only object. Reusing that exact object in the same GTA process avoids hashing the full map payload again. In the recorded checkpoint, a cached set reached the active state in 9 seconds from a fresh process; later admissions in the same process usually took 1–4 seconds with zero payload rehashes. These are measurements from the reviewed set and machine, not guaranteed loading times for every map or disk.

The cache remains fail-closed. In the recovery test, Neon rejected a deliberately corrupted Bullworth IDE and rebuilt it byte-for-byte to its original SHA-256 before the world was admitted.

<span id="the-two-launch-activation"></span>

## First format-3 activation

```text
same GTA process: download -> audit -> immutable cache -> exact set recheck
                  -> one-shot admission -> registrar generation 1
```

Neon installs only the empty Native World foundation at game startup. When the server publishes a format-3 set, the client audits the downloaded children, checks that the current GTA process is still clean, grows the streaming buffer if needed, revalidates the session and cache objects, and only then loads generation 1.

If that same-process admission cannot cross every safety gate, Neon records the exact pending transaction and uses the verified restart fallback. The player can inspect or control that fallback from F8:

```text
nativeworldauth status
nativeworldauth restart
nativeworldauth clear
```

The fallback record expires after 15 minutes. It is bound to the exact ordered content set, opaque server identity, numeric IPv4 endpoint, resource generation, and negotiated protocol version. It contains no password, raw server key, hostname, payload path, or server-selected executable path.

After the fallback restart, Neon opens the exact cache objects named by the record, fully re-audits them, validates the supported GTA executable and patch sites, then spends the one-shot ticket before native mutation. The new connection must reproduce the endpoint, server identity, and protocol version.

## Session teardown and server isolation

While a selected set is active, Neon pins connection routes to the owner endpoint before network reset, reconnect, mod unload, or credential lookup.

- An active-session mismatch is blocked without destroying the valid owner session.
- Saved and supplied credentials remain suppressed while native-world startup or residency is active.
- Passworded native-world startup is not supported.

Format-3 teardown now has explicit `Active → Draining → Detached → Neutral` fences. It stops new city work, flushes outstanding streaming I/O, removes generation-owned entities, IPL and LOD anchors, collisions, model bindings and archive channels, releases immutable-cache handles, restores the native stores and pools, and then releases the endpoint-owned session. The recorded live gate reached content-neutral, session-neutral, admission-baseline-matching, I/O-quiescent state with zero cache handles.

Once that clean boundary is reached, Neon can queue a new connection and admit a different server or ordered map set without restarting GTA. This is the supported runtime hot-switch path, not merely a teardown test.

If the live process cannot reach the required clean state, Neon publishes `restart-required=yes` and uses the exact-readback restart path. The fallback deliberately replaces the GTA process rather than loading new native content on top of uncertain state.

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

- custom static worlds are supported when they can be converted to the closed format-3 grammar and pass every audit; the four named cities remain the reviewed real-world proof sets;
- at most one imported city is materialized at a time;
- an active catalogue must fully drain before another one is admitted; safe completion allows same-process readmission, otherwise the verified restart fallback is used;
- two exact audited GTA SA 1.0 US executable identities are supported;
- high static IPL slots cannot own car generators;
- paths, nodes, population, zones, audio, interiors, radar, and environment remain separate;
- a true Direct3D device-reset pass is still missing; borderless minimize/restore did not trigger one.

## Legacy single-pack formats

Formats 1 and 2 remain for the original Bullworth path. Format 1 uses the compiled `bullworth` policy; format 2 uses the closed `static-world-v1` grammar. Both accept one manifest, one IDE, and one IMG, and use the same two-launch authorization model. They do not gain v3 multi-IMG or selected-set behavior.

## Verification summary

The strongest residency pass exercised San Andreas plus all four reviewed cities through generations 2–29, including adjacent and direct city switches, physical-bank reuse, death/respawn, reconnect, resource restart, and server restart. A separate non-contiguous Bullworth + Liberty City + Carcer City set kept omitted Vice City inactive. The generic network contract was then checked with a three-pack ordered set and rejection of an exact old client before join.

The completed hot-switch pass kept one GTA process alive through ten same-set server-to-server cycles, then changed from a four-pack set to a different three-pack set in that same process. A forced unsafe-drain case also reached the verified restart fallback. Game SA, Core, and Client Deathmatch built for the checkpoint, and 62 focused contract tests passed.

The first-set checkpoint admitted both an existing cached set and a newly published missing child in the same GTA process, with `restart-required=no` and the original process ID retained. The cache-reuse checkpoint built Game SA, passed 98 focused Python tests, measured the 9-second fresh-process and 1–4-second same-process paths described above, and recovered the deliberately corrupted IDE before a successful hot switch.

All 3,038 reviewed Vice City and Liberty City LOD relationships were preserved. The format-3 transport and set parser, aggregate planner, cache recovery, registrar, generic network contract, neutral-state baseline, generation ownership, runtime drain, teardown, session release, same-process readmission, and restart fallback have focused automated coverage. Relevant client projects, including Game SA, Core, Client Deathmatch, and Multiplayer SA where affected, built for the corresponding checkpoints.

This evidence covers the reviewed assets and named lifecycle. It does not prove arbitrary content, every possible one-to-eight-pack combination, every optional GTA subsystem, or a real D3D device reset.

<details>
<summary>Implementation provenance</summary>

- format-3 multi-IMG transport and aggregate planning: [`42597bd84`](https://github.com/Dryxio/mtasa-neon/commit/42597bd84), [`11dc68396`](https://github.com/Dryxio/mtasa-neon/commit/11dc68396), [`c6723544c`](https://github.com/Dryxio/mtasa-neon/commit/c6723544c), and [`96230e389`](https://github.com/Dryxio/mtasa-neon/commit/96230e389);
- transactional registrar, LOD bootstrap, and generation-fenced residency: [`3b4ee3d8b`](https://github.com/Dryxio/mtasa-neon/commit/3b4ee3d8b), [`f9ff61552`](https://github.com/Dryxio/mtasa-neon/commit/f9ff61552), and [`7cee41f57`](https://github.com/Dryxio/mtasa-neon/commit/7cee41f57);
- reviewed selection and generic network contract: [`22f863ea2`](https://github.com/Dryxio/mtasa-neon/commit/22f863ea2) and [`ac3a54f57`](https://github.com/Dryxio/mtasa-neon/commit/ac3a54f57);
- live registrar baselines, neutral contract, generation journal, drain, detach, and session release: [`52453ba39`](https://github.com/Dryxio/mtasa-neon/commit/52453ba39), [`f386b71e9`](https://github.com/Dryxio/mtasa-neon/commit/f386b71e9), [`5e208efcb`](https://github.com/Dryxio/mtasa-neon/commit/5e208efcb), [`555386e57`](https://github.com/Dryxio/mtasa-neon/commit/555386e57), [`759b35e19`](https://github.com/Dryxio/mtasa-neon/commit/759b35e19), and [`8fdf082cf`](https://github.com/Dryxio/mtasa-neon/commit/8fdf082cf);
- reusable same-process hot-switch lifecycle and verified restart fallback: [`84ea917fe`](https://github.com/Dryxio/mtasa-neon/commit/84ea917fe).
- first format-3 admission in the current GTA process: [`101ac1c86`](https://github.com/Dryxio/mtasa-neon/commit/101ac1c86);
- verified cache-object reuse and corrupt-cache recovery: [`0f75bc018`](https://github.com/Dryxio/mtasa-neon/commit/0f75bc018).

Focused harnesses and evidence labels are indexed on [Tooling and verification](/neon/tooling-and-verification).

</details>
