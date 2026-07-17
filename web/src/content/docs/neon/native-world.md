---
title: Native world packs
description: Closed native payloads, immutable cache transport, and the startup-authorization boundary.
sidebar:
  order: 3
---

Native world packs are meant to let a server send extra static cities and have GTA stream their IDE, IMG, COL, and binary IPL data through its own spatial system. Once startup activation is safe, players should be able to travel between San Andreas and those cities without a Lua streamer or a visible transition.

The transport and cache path works, but authorization is not activation. The sections below keep that boundary explicit.

## Implemented checkpoints

| Commit | Capability |
| --- | --- |
| [`5edd8e7f9`](https://github.com/Dryxio/mtasa-neon/commit/5edd8e7f9) | Opt-in native Bullworth proof: model-store relocation, IDE/IMG/COL/binary IPL registration, spatial streaming, and reconnect-safe streaming-buffer floor. |
| [`8bbdd4a31`](https://github.com/Dryxio/mtasa-neon/commit/8bbdd4a31) | Generic static-world manager separated from the immutable Bullworth policy. |
| [`1304f98d8`](https://github.com/Dryxio/mtasa-neon/commit/1304f98d8) | Minimal versioned runtime manifest with allocation plans derived from validated IDE/IMG bytes. |
| [`d65e8eee0`](https://github.com/Dryxio/mtasa-neon/commit/d65e8eee0) | Closed RenderWare and COL grammar with semantic, finite-value, recursion, and aggregate-budget validation. |
| [`5d43f18e5`](https://github.com/Dryxio/mtasa-neon/commit/5d43f18e5) | Immutable ProgramData cache keyed by a domain-separated semantic SHA-256 content ID, guarded by leases and atomic same-volume publication. |
| [`7c38a9278`](https://github.com/Dryxio/mtasa-neon/commit/7c38a9278) | Version-gated resource transport, bounded HTTP streaming, asynchronous closed audit, cancellation, quotas, quarantine re-audit, and atomic cache publication. |

The tested path supports one compiled Bullworth policy on exact, audited GTA SA 1.0 US executables. It cannot load arbitrary IDE content.

## Transport contract

A resource declares exactly three automatic-download files and one engine-owned descriptor:

```xml
<file src="native/native-world.json" download="true" native_world="true" />
<file src="native/world.ide" download="true" native_world="true" />
<file src="native/world.img" download="true" native_world="true" />
<native_world format="1" manifest="native/native-world.json" />
```

Compatible clients receive the descriptor and file metadata in the versioned `ResourceStart` group. Older clients receive neither that group nor the engine-only payloads.

After the usual size and checksum checks, a cancellable worker audits the complete payload. It copies the files into a locked quarantine on the same volume, audits the copy again, publishes the directory atomically, and validates the final immutable object once more.

A successful download still does nothing to GTA:

```text
downloaded bytes -> checksum -> closed semantic audit -> immutable cache
immutable cache  != trusted server authorization
```

### Cache policy

Current closed Bullworth quotas are a 4 KiB manifest, 1 MiB IDE, 256 MiB IMG, four content objects, 1 GiB counted data, and requested bytes plus a 64 MiB free-space margin. Unsafe paths, unverifiable remnants, immutable conflicts, and quota exhaustion are refused.

## Startup authorization is not activation

Neon can save a short-lived startup authorization record after a payload passes audit and cache publication. It still refuses to activate the pack.

The resource may request it explicitly:

```xml
<native_world
  format="1"
  manifest="native/native-world.json"
  startup="true"
  policy="bullworth" />
```

The authorization record follows these rules:

- it is negotiated separately, so older native-world transport packets keep their existing layout;
- it is bound to the server identity and endpoint, connection, resource generation, policy, offer, and exact content ID;
- it is persisted only while the resource and connection that supplied the audited payload are still current;
- it is protected for the current operating-system user, can be consumed only once, and expires after 15 minutes;
- storage, path, clock, publication, and revocation checks fail closed;
- resource-stop revocation for a record still attached to that resource;
- the F8 command `nativeworldauth status` or `nativeworldauth clear` for inspection and deliberate cleanup.

Expected diagnostics continue to state:

```text
[NativeWorldAuthorization] state=pending ... activation=no lease=no restart-required=yes
```

This checkpoint **does not select a cache object for GTA, acquire an activation lease, restart the client, or register a native pack**. It only proves that Neon can safely finish one exact server, session, resource, and cache authorization before touching irreversible engine state.

## Trust boundary

Neon binds the pending record to the opaque server ID exposed by the established MTA session and to the canonical numeric endpoint. The external network module owns the underlying identity mapping and handshake; the visible source tree does not prove PKI possession or authenticated DNS ownership. Documentation and diagnostics must not claim a stronger identity guarantee than that interface provides.

## Not implemented yet

- Startup consumption and atomic claim of the pending record.
- Exact-cache lookup with a startup-transaction lease.
- Second-session identity and endpoint reproduction before `StartGame`.
- Native activation from a server-issued record.
- Safe hot unload or pack switching inside a running GTA process.
- Transactional aggregate registration of several cities.
- A general policy for arbitrary IDE/IMG content.
- Automatic radar, paths, population, zones, audio, interiors, or city environment systems.

## Verification evidence

The transport series has been checked with:

- 38 focused extended-world tests;
- matching client and server builds;
- fresh download and `disposition=published` cache publication;
- exact post-publication hash comparison;
- reconnect and `disposition=hit` behavior;
- no quarantine residue after success;
- Bullworth spatial streaming, collision, travel, reconnect, and restart checks;
- rollback to ordinary San Andreas behavior with the native environment switch disabled.

Startup authorization remains experimental. It is not a promise that native pack activation is available.
