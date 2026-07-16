---
title: Native world packs
description: Closed native payloads, immutable cache transport, and the current inert startup-authorization checkpoint.
sidebar:
  order: 3
---

The native-world project aims to let a server distribute additional static cities and let GTA stream their IDE, IMG, COL, and binary IPL data through its original spatial system. Once safely activated at startup, travel between San Andreas and added cities should require neither a custom Lua streamer nor a visible transition.

This page distinguishes **implemented and tested**, **present in the current uncommitted worktree**, and **not implemented** behavior.

## Implemented checkpoints

| Commit | Capability |
| --- | --- |
| [`5edd8e7f9`](https://github.com/Dryxio/mtasa-neon/commit/5edd8e7f9) | Opt-in native Bullworth proof: model-store relocation, IDE/IMG/COL/binary IPL registration, spatial streaming, and reconnect-safe streaming-buffer floor. |
| [`8bbdd4a31`](https://github.com/Dryxio/mtasa-neon/commit/8bbdd4a31) | Generic static-world manager separated from the immutable Bullworth policy. |
| [`1304f98d8`](https://github.com/Dryxio/mtasa-neon/commit/1304f98d8) | Minimal versioned runtime manifest with allocation plans derived from validated IDE/IMG bytes. |
| [`d65e8eee0`](https://github.com/Dryxio/mtasa-neon/commit/d65e8eee0) | Closed RenderWare and COL grammar with semantic, finite-value, recursion, and aggregate-budget validation. |
| [`5d43f18e5`](https://github.com/Dryxio/mtasa-neon/commit/5d43f18e5) | Immutable ProgramData cache keyed by a domain-separated semantic SHA-256 content ID, guarded by leases and atomic same-volume publication. |
| [`7c38a9278`](https://github.com/Dryxio/mtasa-neon/commit/7c38a9278) | Version-gated resource transport, bounded HTTP streaming, asynchronous closed audit, cancellation, quotas, quarantine re-audit, and atomic cache publication. |

The tested native path currently supports one compiled Bullworth policy for exact audited GTA SA 1.0 US executable identities. It is not a general arbitrary-IDE loader.

## Transport contract

A resource declares exactly three automatic-download files and one engine-owned descriptor:

```xml
<file src="native/native-world.json" download="true" native_world="true" />
<file src="native/world.ide" download="true" native_world="true" />
<file src="native/world.img" download="true" native_world="true" />
<native_world format="1" manifest="native/native-world.json" />
```

Capable clients receive the descriptor and file metadata in the versioned `ResourceStart` group. Legacy clients see neither the group nor the engine-only payloads.

After normal size and checksum checks, a cancellable worker performs the complete closed payload audit, copies into a locked same-volume quarantine, re-audits the copy, atomically publishes the directory, and revalidates the final immutable object.

Successful transport remains inert:

```text
downloaded bytes -> checksum -> closed semantic audit -> immutable cache
immutable cache  != trusted server authorization
```

### Cache policy

The Windows cache root is:

```text
C:\ProgramData\MTA San Andreas All\1.7\native-world-cache\v1
```

Current closed Bullworth quotas are a 4 KiB manifest, 1 MiB IDE, 256 MiB IMG, four content objects, 1 GiB counted data, and requested bytes plus a 64 MiB free-space margin. Unsafe siblings, reparse points, unverifiable remnants, immutable conflicts, and quota exhaustion are refused.

## Inert startup authorization — current worktree

> **Worktree checkpoint:** this section documents the uncommitted implementation currently present in `mtasa-neon`. It is not yet a released or committed Neon contract and may change during review and VM validation.

The current worktree implements the first authorization checkpoint while deliberately keeping activation disabled.

The resource may request it explicitly:

```xml
<native_world
  format="1"
  manifest="native/native-world.json"
  startup="true"
  policy="bullworth" />
```

Key properties visible in the code:

- a separate `NativeWorldStartupAuthorization` bitstream capability;
- an authorization-aware packet tag that leaves the older `N` transport layout unchanged;
- a captured snapshot bound to the opaque server ID digest, canonical numeric IPv4 and port, resource name/net ID/start counter, bitstream version, connection generation, authorization epoch, policy, and pack format;
- persistence only after the exact payload has passed audit and cache publication while the original resource and connection remain current;
- a versioned, maximum-4-KiB record protected with Windows DPAPI for the current user;
- a CSPRNG ticket ID, exact offer ID and content ID, and a fixed 15-minute lifetime;
- local fixed-drive, canonical-path, ownership, ACL, reparse, transaction-lock, atomic-temp-file, clock-rollback, revocation, and ambiguous-publication checks;
- resource-stop revocation for a record still attached to that resource;
- the F8 command `nativeworldauth status` or `nativeworldauth clear` for inspection and deliberate cleanup.

Expected diagnostics continue to state:

```text
[NativeWorldAuthorization] state=pending ... activation=no lease=no restart-required=yes
```

This checkpoint **does not select a cache object for GTA, acquire an activation lease, restart the client, or register a native pack**. Its purpose is to prove that one precise server/session/resource/cache authorization can be persisted and terminalized safely before any irreversible engine mutation.

## Trust boundary

Neon binds the pending record to the opaque server ID exposed by the established MTA session and to the canonical numeric endpoint. The external network module owns the underlying identity mapping and handshake; the visible source tree does not prove PKI possession or authenticated DNS ownership. Documentation and diagnostics must not claim a stronger identity guarantee than that interface provides.

## Not implemented yet

- Startup consumption and atomic claim of the pending record.
- Exact-cache lookup with a startup-transaction lease.
- Second-session identity and endpoint reproduction before `StartGame`.
- Record-driven replacement of the environment/local-selector prototype.
- Native activation from a server-issued record.
- Safe hot unload or pack switching inside a running GTA process.
- Transactional aggregate registration of several cities.
- A general policy for arbitrary IDE/IMG content.
- Automatic radar, paths, population, zones, audio, interiors, or city environment systems.

## Verification evidence

The committed transport series records:

- 38 focused extended-world tests with two optional environment-dependent skips;
- successful Release Win32 Game SA and Client Deathmatch builds;
- fresh download and `disposition=published` cache publication;
- exact post-publication hash comparison;
- reconnect and `disposition=hit` behavior;
- no quarantine residue after success;
- user-run Bullworth spatial streaming, collision, travel, reconnect, and restart checks;
- rollback to ordinary San Andreas behavior with the native environment switch disabled.

The uncommitted authorization checkpoint still requires its own review, formatting, tests, VM builds, and user-owned runtime validation before it can be called complete.
