---
title: Tooling and verification
description: Neon's VM build workflow, asset pipelines, test resources, profiling, and experimental developer tools.
sidebar:
  order: 8
---

Neon's tooling is part of the feature contract: deep GTA changes are documented with executable identities, patch manifests, validation scripts, focused builds, reproducible resources, and user-run gameplay evidence.

## Canonical source and VM builds

Source changes, reviews, commits, and pushes happen in the canonical macOS checkout. The Windows VM-local copy is a disposable build/runtime mirror.

`utils/vm-build.ps1` replaces timestamp-driven mirroring with an explicit checkpoint:

1. name only the files owned by the checkpoint;
2. produce a read-only synchronization/build plan;
3. review exact-path SHA-256 decisions and the smallest affected projects;
4. rerun with `-Execute`;
5. verify outputs and runtime behavior;
6. run the broader build appropriate to ABI/protocol scope.

The helper preserves VM-generated CEF, Discord/RapidJSON, archives, and Unifont state; detects regeneration requirements; serializes transactions; checks output locks; and refuses dependency/bootstrap paths that require an intentional full setup.

## Extended-world pipeline

`utils/extended-world` contains:

- deterministic Perry and imported-city resource generators;
- IMG packing and compact metadata generation;
- radar extraction and catalog generation;
- native model-store and executable patch validators;
- runtime native-world manifest parsing;
- closed native payload validation matching the C++ grammar;
- immutable cache identity and publication tests;
- native-world transport and authorization policy tests.

Generated city game assets remain outside Git.

## Focused resource harnesses

Representative resources include:

| Area | Harnesses |
| --- | --- |
| World boundaries | `extended-world-test`, `extended-water-test`, `pickup-position-test`, `seabed-boundary-test` |
| Native pools | `corona-limit-test`, `marker-limit-test`, `renderer-limit-test` |
| Rendering | `project2dfx-test`, `cull-zone-test`, `cull-mirror-floor-test`, `extended-radar-test` |
| Models/streaming | `server-model-registry-test`, `city-residency-coordinator`, UG/Carcer/Bullworth resources |
| Story primitives | native ped go-to/enter/exit/drive-wander, camera, braking, audio, recording, and `tagging-up-turf` |
| Native world | `native-world-transport-test` plus focused Python audit/cache/authorization tests |
| Performance | `entity-performance-test` with recorded baseline, varied-model, native-cost, and collision-attribution results |

## Local asset previews

Neon includes developer-only drop workflows:

- one DFF and optional TXD can preview a replacement of the local player's current base skin;
- one IFP loads an animation list; a single animation starts immediately, while multiple animations open searchable playback controls for looping, freeze-last-frame, root motion, speed, and blend.

Inputs are size-bounded and use the existing validation/replacement paths, but there is no server authorization. These are local prototypes, not production features.

## Server browser prototype — current worktree

The uncommitted `Tools/server-browser-prototype` directory contains a React/Vite UI with server table virtualization, filters, details, password/connect overlays, state management, and a mock backend contract. It is exploratory tooling and is **not integrated into the MTA client**. Documentation tracks it so the uncommitted Neon work is visible without presenting it as shipped behavior.

## Verification language

Each feature page distinguishes:

- compiled successfully;
- passed static/unit/format validation;
- reached a ready local server;
- was exercised by a user in game;
- remains a prescribed regression test;
- remains uncommitted or unvalidated.

Build success alone is not described as gameplay validation. Native-world executable writes, downloaded native data, authorization, cache leases, worker cancellation, native object lifetimes, and aggregate pool allocation require focused review before runtime claims are upgraded.
