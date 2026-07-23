---
title: Native world packs
description: Audited static-world packs, immutable caches, one-shot startup authorization, and process-lifetime activation.
sidebar:
  order: 3
---

Native world packs let GTA register extra IDE, IMG, COL, and binary IPL data through its own startup streaming path. This is different from a Lua city streamer: the pack becomes native GTA state and remains there for the lifetime of that MTA process.

The complete path is now implemented for the closed Bullworth format and for the closed `static-world-v1` route. A capable server can publish an audited pack, authorize its exact cached content, ask the player to restart, and have the replacement process activate it after reconnecting to the same server.

## What is implemented

| Commit | Capability |
| --- | --- |
| [`5edd8e7f9`](https://github.com/Dryxio/mtasa-neon/commit/5edd8e7f9) | Native Bullworth proof: relocated model stores, IDE/IMG/COL/IPL registration, spatial streaming, and a reconnect-safe streaming-buffer floor. |
| [`5d43f18e5`](https://github.com/Dryxio/mtasa-neon/commit/5d43f18e5) | Immutable content-addressed cache, atomic publication, complete re-audit, and pending/process leases. |
| [`7c38a9278`](https://github.com/Dryxio/mtasa-neon/commit/7c38a9278) | Version-gated resource transport, bounded downloads, cancellable worker audit, quotas, and quarantine publication. |
| [`b9ce96d3c`](https://github.com/Dryxio/mtasa-neon/commit/b9ce96d3c) | Short-lived, one-shot authorization record bound to one server, resource generation, endpoint, policy, and exact content ID. |
| [`5971c8a67`](https://github.com/Dryxio/mtasa-neon/commit/5971c8a67) | Existing-object-only startup selection, full cache re-audit, typed lease, executable preflight, and atomic ticket claim. |
| [`163605d59`](https://github.com/Dryxio/mtasa-neon/commit/163605d59) | Record-selected native activation, second-session validation, native commit, and process-lifetime lease. |
| [`453ca427b`](https://github.com/Dryxio/mtasa-neon/commit/453ca427b) | Explicit credential-free restart to the authorized numeric endpoint. |
| [`0b8f07565`](https://github.com/Dryxio/mtasa-neon/commit/0b8f07565) | Separate format-2 `static-world-v1` transport and v2 cache identity. |
| [`c87820afc`](https://github.com/Dryxio/mtasa-neon/commit/c87820afc) | Format-2 one-shot authorization and activation without changing the format-1 wire path. |
| [`457a83d11`](https://github.com/Dryxio/mtasa-neon/commit/457a83d11) | Process-lifetime server isolation across console, browser, reconnect, Host Game, Editor, and credential paths. |
| [`ac06da9c6`](https://github.com/Dryxio/mtasa-neon/commit/ac06da9c6) | Relocated aggregate atomic, damageable, and timed model stores sized from the frozen four-city inventory. |
| [`c50f01407`](https://github.com/Dryxio/mtasa-neon/commit/c50f01407) | One captured runtime FileID layout shared by Game SA, Multiplayer SA, Client Core, and Client Deathmatch. |
| [`6abc45820`](https://github.com/Dryxio/mtasa-neon/commit/6abc45820) | Relocation of the stock FileID namespace and its startup consumers. |
| [`9c506c3a4`](https://github.com/Dryxio/mtasa-neon/commit/9c506c3a4) | Correct unsigned handling for GTA's named-model operands after FileID expansion. |
| [`fd50b6e07`](https://github.com/Dryxio/mtasa-neon/commit/fd50b6e07) | Guarded relocation coverage for the active expanded-FileID code, including MTA-appended paths. |
| [`5615ff7cb`](https://github.com/Dryxio/mtasa-neon/commit/5615ff7cb) | Compact FileID spans aligned with the relocated stores while the final global-pool expansion is developed. |
| [`ada5b6fb2`](https://github.com/Dryxio/mtasa-neon/commit/ada5b6fb2) | Completed stock-SA, Bullworth, reconnect, server-restart, and Perry replacement-lifecycle gate for the compact 38,316-entry layout. |
| [`3a23fd26f`](https://github.com/Dryxio/mtasa-neon/commit/3a23fd26f) | Atomic 42,341-entry FileID layout, 8,000 TXDs, 512 COLs, 1,024 IPLs, expanded native pools, full-width COL/IPL ownership, high-water telemetry, and live boundary validation. |

## Pack formats

Both formats use exactly three engine-owned automatic downloads:

```xml
<file src="native/native-world.json" download="true" native_world="true" />
<file src="native/world.ide" download="true" native_world="true" />
<file src="native/world.img" download="true" native_world="true" />
```

### Format 1: Bullworth

Format 1 is tied to Neon's compiled Bullworth policy:

```xml
<native_world format="1" manifest="native/native-world.json"
              startup="true" policy="bullworth" />
```

Remove `startup="true"` and `policy="bullworth"` for a publish-only resource. The payload still goes through the full audit and immutable cache, but it cannot create an authorization record or affect GTA.

### Format 2: static-world-v1

Format 2 separates the audit profile from the pack identity:

```xml
<native_world format="2" policy="static-world-v1"
              manifest="native/native-world.json" startup="true" />
```

Its manifest root contains only `format`, `policy`, a bounded `pack_id`, and the file metadata. `pack_id` must match `[a-z0-9_-]{1,15}`. It participates in the semantic content ID, but it never controls parser budgets, executable patches, native paths, pools, or cache directories.

Format 2 has separate publish and startup capabilities. A client that only understands publish-only format 2 receives an inert descriptor; the server cannot silently upgrade it to activation. Format 1 and format 2 also have separate content-ID domains and cache trees, so one cannot be mistaken for the other.

## Download, audit, and cache

The client accepts one manifest, one IDE, and one IMG. The current ceilings are 4 KiB, 1 MiB, and 256 MiB. After the normal download checks, a cancellable worker:

1. copies the payload into a same-volume quarantine;
2. parses the closed manifest, IDE, IMG directory, DFF/TXD RenderWare data, COL, and binary IPLs;
3. derives model, TXD, collision, IPL, archive, coordinate, and streaming budgets from the bytes;
4. rejects unknown grammar, unsafe names, non-finite values, collisions, overflows, or unsupported content;
5. publishes the immutable object with one atomic directory rename;
6. opens and revalidates the final object under no-write/no-delete handles.

The cache holds at most four objects and 1 GiB of counted data per policy, with a 64 MiB free-space margin. Unsafe siblings, reparse points, corrupt objects, quota exhaustion, and ambiguous crash residue fail closed.

A content hash proves only that the bytes are identical. It does not prove who sent them and does not authorize GTA to load them.

## The two-launch activation

Activation is deliberately a two-launch transaction:

```text
launch 1: download -> audit -> immutable cache -> pending authorization
                                      |
                                      v
                           nativeworldauth restart
                                      |
                                      v
launch 2: exact cache re-audit -> one-shot claim -> same-server validation
          -> native registration -> process lease
```

On launch 1, the authorization record is bound to the exact content ID, pack format and policy, opaque server-ID digest, canonical numeric IPv4 endpoint, resource generation, and negotiated bitstream version. It is protected for the current operating-system user, expires after 15 minutes, and contains no password, raw server key, hostname, file path, or server-chosen executable path.

The player can inspect or continue the transaction from F8:

```text
nativeworldauth status
nativeworldauth restart
nativeworldauth clear
```

`restart` is accepted only for a fresh pending record with at least 60 seconds left. It schedules and reads back one passwordless `mtasa://<numeric-ip>:<port>` action, then cleanly replaces the process. `clear` is for a still-pending record; once native preparation or activation begins, clear and another restart are refused.

On launch 2, Neon never selects the newest object and never repairs a missing startup object. It opens the one content ID named by the record, fully re-audits it, takes a typed pending lease, validates the GTA executable and patch sites, and atomically spends the one-shot ticket before native mutation. The new connection must reproduce the endpoint, opaque server-ID digest, and bitstream version before `StartGame` installs the pack hook. Only successful native postconditions promote the lease to process lifetime.

## Process-lifetime server isolation

A native pack has no safe hot-unload path. Once a record-driven pack owns the process, every connection route is pinned to its numeric endpoint before the current mod is unloaded, the network is reset, reconnect state is changed, or a credential is read.

- Exact reconnects to the owner endpoint remain available and still repeat the opaque server-ID check.
- A different target while the pack is active is blocked without destroying the valid session or lease.
- Connecting to another server requires closing MTA and starting a clean process.
- Supplied and saved credentials are suppressed throughout every record-driven phase, including active reconnects.
- Passworded native-world startup is therefore not supported yet.

The endpoint is a locator, not authentication. Server continuity relies on the opaque ID exposed by MTA's external network module; the visible source does not establish PKI, authenticated DNS ownership, or the operator's legal identity.

## Current limits

- The native runtime supports two exact audited GTA SA 1.0 US executable identities.
- The public path is startup-only: no hot registration, hot unload, or pack switch.
- One process has one active pack and one owner server; aggregate multi-pack allocation is not implemented.
- The larger TXD, COL, IPL, building, ColModel, and QuadTreeNode capacities are installed, but no committed public pack format allocates several IMG archives or proves a second city.
- High static IPL slots cannot own car generators. The admitted static-world grammar rejects those sections so high-slot removal cannot alias a stock IPL.
- `static-world-v1` is a constrained static-world grammar, not arbitrary IDE support.
- The format-2 live fixture intentionally reused the known Bullworth bytes. It proves the generic transport/authorization machinery, not a second city.
- Radar, paths, population, zones, audio, interiors, and environment systems are separate resource or engine work.
- The old environment-selector route remains a developer path and does not receive the record-driven server-isolation guarantee.

## Multi-city capacity foundation

The frozen read-only catalog covers Bullworth, Vice City, Liberty City, and Carcer City. It inventories static DFF, TXD, COL, IPL, and IMG inputs, fingerprints the source files, and separates Neon's current closed-policy rejections from actual GTA engine limits.

The inventory measures 10,918 added custom models and 33,849 placements. Combined with occupied San Andreas entries, it needs 24,339 atomic objects, 152 damageable objects, and 640 timed objects. The model stores are now relocated to capacities of 32,000 / 512 / 1,024, leaving headroom of 7,661 / 360 / 384 against that frozen inventory.

FileIDs now come from one runtime layout captured during startup and consumed across the client modules:

```text
DFF         0 .. 31999   (32,000)
TXD     32000 .. 39999   ( 8,000)
COL     40000 .. 40511   (   512)
IPL     40512 .. 41535   ( 1,024)
DAT     41536 .. 41599   (    64)
IFP     41600
RRR     41780
SCM     42255
loaded  42337
requested 42339
total   42341
```

The generated relocation manifest covers 1,427 guarded FileID writes. The same startup transaction validates 37 additional native sites for store and pool capacities, full-width COL/IPL side storage, MTA consumers, cache bypass, the 32,000-entry live MINFO buffer, and high-IPL cleanup. Save compatibility still preserves the stock 26,316-record namespace.

The coupled native pools now contain 32,000 buildings, 30,000 ColModels, and 2,048 QuadTreeNodes. GTA's byte-sized `CColModel::m_nColSlot` and `CEntity::m_nIplIndex` fields keep compatibility bytes while process-lifetime side storage preserves their real values. Isolated runtime limit setters can no longer rewrite one allocation behind the transaction; they accept only the installed capacities.

This still does **not** mean four cities can already be activated together. The current committed transport accepts one IMG, the Bullworth plan stays below COL/IPL slot 255, and aggregate allocation plus a second-city activation remain open gates. DAT remains at 64 entries; paths, population, zones, audio, interiors, and high-slot car generators have not moved with this checkpoint.

## Verification evidence

The current series has **103 focused extended-world tests**, with two fixture-dependent skips. The established native-world path has live coverage for:

- fresh format-1 and format-2 publication plus exact cache hits;
- passwordless restart with a new process ID;
- existing-object-only re-audit, one-shot claim, native registration, and `state=active lease=process`;
- Bullworth travel, return to San Andreas, reconnect, and resource stop/start;
- extended positions at X=+9,500 and water at X=−9,990;
- COL and `moveObject` regression matrices;
- pending-ticket revocation and missing-cache terminal refusal without recreation;
- a wrong-port request blocked while the active owner session and lease stayed intact, followed by a successful exact reconnect;
- matching affected client/server builds with zero errors.

The compact-FileID gate completed on 20 July 2026 with ticket `7f93d606`. The client moved from the captured stock layout (`total=26316`, `nativeWrites=no`) to `total=38316` with all 1,398 writes installed, `nativeWrites=yes`, `datExpansion=no`, and `pathsExpansion=no`. Bullworth registered archive 6, 952 models, 166 TXDs, collision slot 252, and IPL slots 191 through 197. `/nativebw`, `/nativeback`, exact reconnect, and a post-server-restart `/nativebw` passed with the same process lease, stable model-store occupancy, and the 4,008-block streaming floor.

The same gate loaded Perry's 285-model TXD/COL/DFF slice, then exercised `releaseSlice()` and `engineFreeModel()` before a restart/reconnect confirmed that Perry stayed absent and Bullworth still worked. No FileID, preflight, capacity, exception, fatal, or new-dump diagnostic appeared. This is observable lifecycle evidence, not a per-slot high-water proof, because the resource does not log every released slot.

The format-2 fixture registered archive 6, 952 models, 166 TXDs, collision slot 252, and seven IPL slots. Those numbers describe the validated Bullworth fixture, not universal `static-world-v1` capacities.

The stores/pools gate completed on 23 July 2026 with ticket `d831fafb`. The opt-in startup harness used GTA's real load and remove paths for COL `255/256/511` and IPL `255/256/1023`, then restored the affected streaming records, native pools, MTA pointer-node allocator, and full-width side table. All three pairs emitted `pair-ok`, followed by `boundaryHarness=passed` and native registration.

Repeated San Andreas/Bullworth travel, minimize/restore, and death/respawn remained stable. The highest observed pool use was TXD `3774/8000`, COL `253/512`, IPL `198/1024`, buildings `12128/32000`, ColModels `10932/30000`, and QuadTreeNodes `225/2048`, with no overflow, fatal diagnostic, or crash. This proves the boundary harness and the exercised Bullworth lifecycle, not multi-IMG transport or a second-city activation.
