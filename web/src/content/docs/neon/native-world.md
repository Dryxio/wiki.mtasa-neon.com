---
title: Native world packs
description: Audited static-world packs, immutable caches, one-shot startup authorization, and process-lifetime activation.
sidebar:
  order: 4
---

Native world packs let GTA register additional IDE, IMG, COL, and binary IPL data through its startup streaming path. Unlike a Lua city streamer, an activated pack becomes native GTA state and remains loaded for the lifetime of that MTA process.

Neon currently implements a reference single-pack startup path for the closed Bullworth format and the constrained `static-world-v1` format. The Bullworth fixture has been exercised through publication, restart, activation, travel, and reconnect. This does not mean arbitrary worlds, several packs, or a second city are already supported.

## User contract

Before enabling startup activation, a server operator and player should understand these rules:

- the client downloads, audits, and caches one exact pack before GTA can load it;
- activation requires a clean second launch connected to the same passwordless numeric endpoint;
- authorization is short-lived, one-shot, and bound to the exact content and server identity;
- one MTA process can own one active pack and one server;
- connecting to another server requires closing MTA and starting a clean process;
- supplied or saved passwords are not used during record-driven startup or active reconnect;
- there is no hot registration, hot unload, or pack switch;
- radar, paths, population, zones, audio, interiors, and environment data are separate work.

Native-world transport and activation require matching Neon client and server capabilities. An older or incapable client does not receive engine-only native-world descriptors.

## Pack formats

Both formats use three engine-owned automatic downloads:

```xml
<file src="native/native-world.json" download="true" native_world="true" />
<file src="native/world.ide" download="true" native_world="true" />
<file src="native/world.img" download="true" native_world="true" />
```

### Format 1: Bullworth

Format 1 is bound to Neon's compiled Bullworth policy:

```xml
<native_world format="1" manifest="native/native-world.json"
              startup="true" policy="bullworth" />
```

Removing `startup="true"` and `policy="bullworth"` makes the resource publish-only. The payload is still audited and stored in the immutable cache, but it cannot authorize GTA startup.

### Format 2: static-world-v1

Format 2 separates pack identity from the audit policy:

```xml
<native_world format="2" policy="static-world-v1"
              manifest="native/native-world.json" startup="true" />
```

Its manifest root contains only `format`, `policy`, a bounded `pack_id`, and file metadata. `pack_id` must match `[a-z0-9_-]{1,15}`. It participates in content identity but cannot choose parser budgets, executable patches, native paths, pools, or cache directories.

Format 2 has separate publish and startup capabilities. A client that only supports publishing receives an inert descriptor; the server cannot silently upgrade it to activation. The two formats also use separate content-ID domains and cache trees.

`static-world-v1` is a closed static-world grammar, not arbitrary IDE support. Its current format-2 fixture intentionally reuses the known Bullworth content, so that run proves the generic transport and authorization path rather than a second city.

## Download, audit, and cache

The client accepts one manifest, one IDE, and one IMG. Current size ceilings are 4 KiB, 1 MiB, and 256 MiB.

After normal resource download checks, a cancellable worker:

1. copies the payload into same-volume quarantine;
2. parses the manifest, IDE, IMG directory, DFF/TXD data, COL, and binary IPLs;
3. derives model, texture, collision, placement, archive, coordinate, and streaming budgets;
4. rejects unknown grammar, unsafe names, non-finite values, collisions, overflows, and unsupported content;
5. publishes one immutable cache object with an atomic directory rename;
6. reopens and validates the final object under no-write/no-delete handles.

The cache holds at most four objects and 1 GiB of counted data per policy, with a 64 MiB free-space margin. Reparse points, unsafe siblings, corrupt objects, ambiguous crash residue, and quota exhaustion fail closed.

A content hash proves that bytes are identical. It does not identify who sent them and does not authorize GTA to load them.

<span id="the-two-launch-activation"></span>

## Two-launch activation

Activation is deliberately split across two launches:

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

On launch 1, the pending record is bound to the content ID, format, policy, opaque server-ID digest, canonical numeric IPv4 endpoint, resource generation, and negotiated bitstream version. It expires after 15 minutes and contains no password, raw server key, hostname, payload path, or server-chosen executable path.

The player controls the pending transaction from F8:

```text
nativeworldauth status
nativeworldauth restart
nativeworldauth clear
```

`restart` requires a fresh record with at least 60 seconds remaining and schedules one passwordless `mtasa://<numeric-ip>:<port>` reconnect. `clear` applies only while the record is still pending.

On launch 2, Neon opens the exact cache object named by the record. It does not choose the newest object or recreate a missing one. The client fully re-audits the object, validates the supported GTA executable and patch sites, then spends the one-shot ticket before native mutation. The new connection must reproduce the endpoint, opaque server identity, and bitstream version before the pack becomes process-lifetime state.

## Process-lifetime server isolation

An active pack has no safe hot-unload path. Neon therefore pins every connection route to the owner endpoint before unloading the current mod, resetting the network, changing reconnect state, or reading credentials.

- Exact reconnect to the owner endpoint remains available and repeats the opaque server-ID check.
- A request for another target is blocked without destroying the valid owner session.
- Changing servers requires a clean MTA process.
- Supplied and saved credentials stay suppressed through pending, preparing, and active phases.
- Passworded native-world startup is not supported.

The endpoint is only a locator. Continuity also uses the opaque identity exposed by MTA's external network module; this visible source does not establish PKI, authenticated DNS ownership, or a server operator's legal identity.

## Capacity and current boundaries

The installed foundation contains 42,341 FileIDs, including 32,000 DFF, 8,000 TXD, 512 COL, and 1,024 IPL slots. Related native pools contain 32,000 buildings, 30,000 collision models, and 2,048 quadtree nodes.

These numbers are capacity, not a promise that four cities can run together. The current public path accepts one IMG, the reference Bullworth plan remains within its audited grammar, and aggregate multi-pack allocation has not been implemented.

Additional boundaries:

- two exact audited GTA SA 1.0 US executable identities are supported;
- high static IPL slots cannot own car generators;
- DAT remains at 64 entries;
- save compatibility retains the stock FileID namespace;
- the old environment-selector route lacks record-driven server isolation;
- multi-IMG transport and second-city activation remain unproved.

## Verification summary

The strongest in-game evidence covers format-1 and format-2 publication, exact cache hits, passwordless restart into a new process, cache re-audit, one-shot claim, native activation, exact reconnect, owner-server rejection, and repeated San Andreas/Bullworth travel.

Boundary harnesses have exercised native load and removal around expanded COL and IPL byte boundaries, followed by restoration of streaming and pool state. Observed Bullworth use remained below installed capacities through repeated travel, minimize/restore, and death/respawn.

This proves the exercised fixture and lifecycle. It does not prove multi-IMG transport, arbitrary static-world content, a second-city activation, or aggregate multi-pack budgets.

<details>
<summary>Implementation provenance</summary>

The work was developed in four connected series:

- native registration and immutable audit/cache foundations: [`5edd8e7f9`](https://github.com/Dryxio/mtasa-neon/commit/5edd8e7f9), [`5d43f18e5`](https://github.com/Dryxio/mtasa-neon/commit/5d43f18e5), and [`7c38a9278`](https://github.com/Dryxio/mtasa-neon/commit/7c38a9278);
- one-shot authorization, startup claim, activation, and restart: [`b9ce96d3c`](https://github.com/Dryxio/mtasa-neon/commit/b9ce96d3c) through [`453ca427b`](https://github.com/Dryxio/mtasa-neon/commit/453ca427b);
- format-2 transport/activation and server isolation: [`0b8f07565`](https://github.com/Dryxio/mtasa-neon/commit/0b8f07565), [`c87820afc`](https://github.com/Dryxio/mtasa-neon/commit/c87820afc), and [`457a83d11`](https://github.com/Dryxio/mtasa-neon/commit/457a83d11);
- FileID, model-store, and native-pool expansion: [`ac06da9c6`](https://github.com/Dryxio/mtasa-neon/commit/ac06da9c6) through [`3a23fd26f`](https://github.com/Dryxio/mtasa-neon/commit/3a23fd26f).

Focused transport, cache, authorization, isolation, startup, and capacity harnesses are indexed on [Tooling and verification](/neon/tooling-and-verification).

</details>
