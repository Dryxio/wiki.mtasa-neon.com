---
title: Tooling and verification
description: Neon's asset pipelines, validators, focused test resources, profiling, and verification standards.
sidebar:
  order: 9
---

Deep GTA changes need more than a successful build. Neon combines executable guards, static checks, focused harnesses, matching client/server builds, and in-game passes so the documentation can state exactly what was exercised and what remains open.

## Find Lua errors with DebugScript 4

Run `debugscript 4` to open a full-screen Lua diagnostics view instead of reading mixed errors line by line in chat. It collects client and server messages in one place and shows what failed, which resource emitted it, whether it came from the client or server, and the source file and line when available.

Use the search box and the severity, side, or resource filters to isolate the problem. Repeated messages are grouped with a count, history can be frozen while you inspect it, and a capture can include the previous 30 seconds and continue for up to two minutes. Export the visible result as TXT for a quick report or JSON for tooling.

Press `Ctrl+Shift+I` or use `devtools` to toggle the view; `Escape` closes it. The original `debugscript` levels still work. The packaged frontend, store logic, and affected client/server projects were tested and built; a final post-build visual replay is not recorded as complete.

## Give a coding agent the real MTA + Neon API

Point an AI coding agent at the local Neon CLI and it can look up the complete MTA + Neon API, read exact function contracts, and check a gamemode without guessing. The results are structured JSON, so the agent can tell which functions exist, whether they run on the client or server, and what still needs to be tested.

The daily commands run locally. They do not require an account, a remote service, or an MCP server. Python 3.10 or newer is required, but no third-party Python package is needed.

The examples below use `neon` as the command name. From a source checkout, call the launcher's full path, such as `/path/to/mtasa-neon/neon` on macOS or `C:\path\to\mtasa-neon\neon.cmd` on Windows, unless you have already added it to `PATH`.

### Prepare an existing gamemode once

Start with a gamemode folder that contains one or more resources with a `meta.xml` file:

```sh
neon init --workspace /path/to/gamemode --profile neon-pair --json
```

`init` finds the resources and prepares the folder for an agent. It creates:

- `neon.project.json`, which describes the gamemode and its client/server profile;
- `NEON_AGENT.md`, which tells an agent which checks to run;
- `.neon-tooling`, which contains the gamemode's pinned copy of the complete API catalogue;
- `.neon`, which contains compact agent context, an API index, project contracts, and client/server Lua language-server files.

The command refuses to replace an existing `neon.project.json` or `.neon` directory. If `NEON_AGENT.md` already exists, it is preserved and the result tells you to merge the Neon instructions manually. If automatic discovery is not suitable, repeat `--resource path/to/resource` to name each resource explicitly.

### Use this loop while developing

Run these commands from the gamemode folder after meaningful Lua, `meta.xml`, dependency, or project changes:

```sh
neon check --json
neon api search "npc pathfinding" --side client --json
neon api get setPedNavigateTo --profile neon-pair --json
neon generate project --json
neon context verify --json
```

Each command answers a different question:

1. `neon check` validates the project and resource metadata. It also detects known API and event calls used on the wrong side.
2. `neon api search` finds likely functions, events, classes, and enums by name or purpose. Filters such as `--side client` keep the result focused.
3. `neon api get` returns the exact selected contract, including its arguments, returns, side, availability, and evidence.
4. `neon generate project` refreshes deterministic agent context, the API index, project contracts, and separate client/server Lua language-server definitions.
5. `neon context verify` checks that none of those generated files are missing, changed, or stale compared with the current gamemode.

Search is only for discovery. An agent should still call `api get` before relying on a result. The CLI reports what its checks observed; it does not claim that a command passed unless that command was actually run and its JSON result says so.

### Complete recipe for an AI-assisted gamemode change

Give the agent this workflow:

```text
1. Read NEON_AGENT.md and .neon/agent-context.json.
2. Search the API with: neon api search "what the script must do" --json
3. Read each selected contract with: neon api get NAME --json
4. Edit the gamemode.
5. Run: neon check --json
6. Run: neon generate project --json
7. Require: neon context verify --json
8. Run the gamemode's own focused tests and report their exact result.
```

This gives the agent a small, repeatable context instead of making it infer engine behavior from source fragments. Static checks still do not prove that a mission, animation, vehicle, or other visible behavior worked in GTA; that requires a focused runtime test.

### Current distribution

For now, ordinary users run the CLI from a Neon source checkout. No portable CLI ZIP has been published on GitHub Releases.

Maintainers can build the same deterministic package for Windows and macOS locally, without compiling MTA:

```sh
python3 Tools/neon-api/packaging/build_portable.py --json
```

The ZIP includes both launchers: use `neon.cmd` on Windows and `./neon` on macOS. It also includes the complete API catalogue, schemas, licences, and the runtime probe. Python 3.10 or newer remains required.

`NEON_CLI_MANIFEST.json` records the hash and size of every packaged file. The adjacent `.sha256` file records the hash of the whole ZIP. Run this after extracting it:

```sh
neon self-test --json
```

On Windows, run the equivalent command as `neon.cmd self-test --json`. The self-test verifies the package manifest, checks API discovery, and exercises an isolated check/generate/verify workflow. These hashes detect changed or damaged files; they are not a publisher signature. Building the ZIP does not upload or publish it.

### Prove that the server and GTA really joined the test

The Windows runtime workflow can start an approved local server, launch the approved MTA client, and wait for reports from both the server resource and the client running inside GTA. This is stronger than treating a successfully started process as proof that gameplay loaded.

First install the bundled probe into an isolated development server:

```powershell
neon.cmd runtime probe install --server-root C:\path\to\mta-server --json
```

Then open a short-lived session with the required actions explicitly enabled:

```powershell
neon.cmd supervisor start --workspace . `
  --enable resource.lifecycle --enable client.launch `
  --server-root C:\path\to\mta-server `
  --client-root C:\path\to\mta-client `
  --connect-port 22003 --json
```

Use the `session.json` path returned by that command in the following steps:

```powershell
neon.cmd resource start .neon-sessions/session-ID/session.json neon-agent-probe `
  --workspace . --json
neon.cmd client launch .neon-sessions/session-ID/session.json client-1 `
  --workspace . --json
neon.cmd runtime prove .neon-sessions/session-ID/session.json `
  --workspace . --timeout-ms 120000 --json
```

`runtime prove` waits for a current, authenticated server report and a report sent by the probe after the real client loaded it inside GTA. It checks the expected topology, engine and build identities, live processes, session window, and project contracts before granting its evidence labels. A two-client `neon-multiclient` project additionally requires two distinct clients before it can report multiplayer evidence.

Installing the probe, starting or restarting a resource, and launching a client are mutations. They require explicit paths and opt-in capabilities; the supervisor is otherwise read-only, loopback-only, and expires. A submitted start or restart command is not proof that MTA processed it. Only a successful fresh observation or `runtime prove` result establishes the scope it reports.

This is evidence for an isolated development session. It is not anti-cheat and does not prove anything against a hostile administrator, native module, or resource that can replace the probe's private files.

Implementation provenance: the [portable workspace and safe initialization](https://github.com/Dryxio/mtasa-neon/commit/eed0bd21c) and the [authenticated Windows runtime proof](https://github.com/Dryxio/mtasa-neon/commit/7685d87f0) are tracked separately from the evidence produced by an actual CLI run.

## Evidence levels

The wiki uses these terms deliberately:

| Label | What it establishes |
| --- | --- |
| Implemented | The code path and registration exist in the documented revision. |
| Compiled | The affected project or producer/consumer set built successfully. |
| Statically checked | Parsers, formats, manifests, scripts, or resource files passed non-runtime validation. |
| Harness-tested | A focused automated or resource-level test exercised the named behavior. |
| In-game checked | The stated path was observed in a running client/server session. The scope must say single-client or multiplayer when that matters. |
| Experimental / unverified | The path exists, but the required runtime evidence is incomplete. |

A lower level never implies a higher one. A build does not prove gameplay, and the existence of a test resource does not prove that every API in the same category was exercised by it.

## How Neon is verified

The normal verification stack is:

1. patch guards confirm the exact supported GTA executable before native memory changes;
2. static checks cover formats, limits, ownership, cleanup, and failure paths;
3. affected client and server projects compile together when they share an ABI or protocol;
4. focused resources exercise one system at a time;
5. integrated resources combine systems under realistic lifecycle pressure;
6. in-game checks cover connection, restart, reconnection, stream cycles, cleanup, and ordinary San Andreas behavior after the feature is disabled.

The required depth depends on the change. Lua/resource-data work may need parsing and a resource restart but no C++ build. Native memory, serialization, protocol, or ABI changes need every affected producer and consumer plus an appropriate runtime pass.

## Extended-world pipeline

`utils/extended-world` contains:

- deterministic Perry and imported-city resource generators;
- IMG packing and compact metadata generation;
- radar extraction and catalog generation;
- model-store and executable patch validators;
- native-world manifest and closed-payload parsing;
- format-3 multi-IMG packaging, aggregate no-mutation planning, selected-set envelopes, and registrar-generation checks;
- reviewed Bullworth, Vice City, Liberty City, and Carcer City radar-resource generation;
- immutable cache identity and publication tests;
- transport, startup authorization, and server-isolation policy tests.

Generated city game assets remain outside Git.

The native-world generator pins its RenderWare conversion step to `Southland-FR/librw` commit `e91821e09ca9957e22c99ecf32438d8098c0ea75`. That keeps regenerated payloads reproducible instead of silently following a moving converter branch.

## Focused test resources

Representative resources include:

| Area | Harnesses |
| --- | --- |
| World boundaries | `extended-world-test`, `extended-water-test`, `pickup-position-test`, `seabed-boundary-test` |
| Native pools | `corona-limit-test`, `marker-limit-test`, `renderer-limit-test` |
| Rendering | `project2dfx-test`, `fog-distance-test`, `cull-zone-test`, `cull-mirror-floor-test`, `extended-radar-test`, and generated native-world radar resources |
| Models and streaming | `server-model-registry-test`, `city-residency-coordinator`, `native-simulation-lease-test`, and generated city resources |
| Synchronized traffic | `native-ped-traffic` for civilian proposal, owner epochs, native Wander, avoidance, threat, damage response, moving-vehicle/airborne reactions, jump/climb handoff, cop locomotion and patrol, couple formation and presentation, observer presentation, and deterministic cleanup |
| Dynamic world objects | `world-object-scripting-harness` for proxy discovery, live transform tracking under player and vehicle pushes, damage/break feedback, matrix read/write, refused `destroyElement`, a push objective, and stream-out/stream-in element identity |
| Runtime collision | `CRuntimeColModel_Tests` unit tests for serialization, multi-mesh index offsetting, and rejection cases; `runtime-collision-wall-demo` for interactive wall/ramp drawing, live rebuilds while standing on the shape, a collision outline, and a vehicle impact test |
| Dynamic object physics | `dynamic-object-physics-harness` for gravity, collision rebound and settling, live linear and angular velocity, frozen state, stream-out and stream-in persistence, and a two-client syncer-change check |
| Managed ropes | `rope-test` for synchronized creation, every state getter and setter, holder and offset tracking, object and vehicle cargo, client-local ropes, server expiry, twelve logical ropes against eight native leases, the missing-holder crash regression, and coexistence with `createSWATRope`; `rope-showcase` for the cinematic |
| Custom foliage | `foliage-test` for the seven-function regression, runtime surface probing, density bounds, dimension and lifetime behavior, and a 64-slot cap test; `foliage-draw-demo` for interactive triangle drawing with live surface and density changes |
| Managed fire | `fire-test` for element creation, lifetime and remaining time, live strength, damage masks, source and target setters, client synchronization, server expiry, spread generations, more than 60 simultaneous fires and cancellable damage; `fire-showcase` for the cinematic |
| Scriptable birds | `bird-test` for creation and type identity, property round-trips, freeze behavior, invalid inputs, 128 simultaneous birds, and shot events with a cancel case; `bird-showcase` for the cinematic |
| Model 2DFX effects | `2dfx-test` for resource-stop cleanup, malformed-input rejection, custom add/get/set/reset, native effect editing and restore, and explicit global-restream stress up to 50 cycles; `2dfx-showcase` for the cinematic |
| Object fracture | `break-test` for fracture creation from streamed geometry, element identity, fragment and triangle introspection, pause state, deterministic cache reuse, durability profiles, invalid arguments and simultaneous effects; `break-showcase` for the runway sequence and interactive playground; `break-explosion-test` for explosion-driven damage using real `createExplosion` calls, radial falloff, weak-rocket scaling and the zero-health transition |
| Story primitives | focused go-to, enter, exit, drive-wander, route, drive-by, mission-ped, gang-tag, camera, cutscene, braking, audio, and recording resources |
| Mission checkpoints | `sweet-and-kendl`, `og-loc`, `tagging-up-turf`, `drive-thru`, `nines-and-aks`, `story-entry-exit-runtime`, and `story-entry-exit-test` |
| Compatibility | `fastweaponstrafe-toggle`, `world-sync-regression-test`, packet capability tests, and mixed-recipient serialization cases |
| Native world | legacy transport/startup resources plus format-3 child-pack, selected-set, aggregate planner, cache, registrar, and generation-fence harnesses |
| Multi-client development | isolated `-cl2` client state and the `MTA Neon Duo` launcher described in [`MULTI_CLIENT.md`](https://github.com/Dryxio/mtasa-neon/blob/master/MULTI_CLIENT.md) |
| Performance | `entity-performance-test` with repeatable model, collision, native-cost, and traversal profiles; `fps-counter` for a simple local `/fps` display |

An API page labels an explicitly assigned resource as **Test resource**. When it only inherits a category-wide pointer, the page says **Related category harness**; that is discovery help, not a direct per-function validation claim.

## Current verification matrix

| System | Strongest evidence | Not yet proved |
| --- | --- | --- |
| Extended coordinates and world RPCs | Boundary resources, mixed-recipient serialization tests, and in-game extended positions | Every upstream API at the full boundary and every third-party resource assumption |
| Radar, water, pickups, and seabed | Focused lifecycle resources and in-game extended-world checks | A complete world package with all optional GTA subsystems |
| Renderer and native pools | Focused stress resources exceeded historical ceilings; the 20,363-light startup catalogue and private 25,000-entry Project2DFX queue were checked in game | Every capacity under one production workload, broad distant-light performance, and the post-fix headlight/shader visual pass |
| SkyGFX | Affected projects built; selected color/radiosity and later YCbCr paths were checked in game | Full SkyGFX or PS2 parity, every weather/resolution/mod combination, and a broad performance matrix |
| Neon client and server browser | Startup, navigation, joining, localization, artwork, and cache paths received targeted implementation/runtime work | One exhaustive clean-install, DPI, aspect-ratio, offline, password, cache, and language matrix |
| Neon Identity | Service tests and development OAuth/ticket/required-auth flows; two real server restarts verified automatic key creation and stable identity; `neon-identity-connect-test` checks the connection-event values, getter agreement, and pre-join cancellation | One checked-in MTA pass covering every getter and identity-aware ban path, key-rotation overlap, and a general owner portal |
| Custom vehicle audio | Client build plus manual AE86/Soundize-bank and BUST gameplay runs | A public reproducible config/bank resource and a focused automated or multiplayer playback matrix |
| Custom model registry | Server/client registry harnesses plus spawn, replacement, free, and parent-fallback runtime checks | Universal behavior for arbitrary resource combinations and legacy fallback expectations |
| Native world packs | Format-3 multi-IMG transport, exact selected-set audit, first admission in the same GTA process without a required restart, four-city generations 2–29, direct switching, bank reuse, reconnect, resource/server restart, non-contiguous selection, ten same-process server switches, a different four-pack to three-pack switch, and the forced restart fallback. The checked cache runs measured about 9 seconds in a fresh process and 1–4 seconds when reusing the same process. | Every possible custom pack or one-to-eight-pack combination, optional GTA subsystems, a true D3D device reset, and universal loading times across different hardware and packs |
| Synchronized NPCs and road traffic | Two-client runs covered pedestrian spawning and behavior, group/couple and owner handoffs, combat and cleanup; road-traffic passes covered atomic vehicle/occupant creation, `DriveWander`, passenger entry, owner changes, stuck recovery, destruction, and cleanup. The current production allocation is 16 vehicles per player area with a global cap of 160, and 12–20 pedestrians per populated area with a global cap of 240. Nearby players share population instead of multiplying the same crowd. | Boats, aircraft, trailers, parked-car generation, mission routes, emergency services, headless simulation, universal task snapshots, perfect collision-frame agreement, and sustained production performance at the configured population ceilings |
| Ambient cops | A two-client cop-locomotion oracle requiring three metres of native patrol, one owner at a time, an unchanged wanted level, no forbidden police task, one handoff epoch, and two cleanup ACKs | Rare path and RNG branches are recorded as evidence rather than required outcomes; there is deliberately no pursuit or arrest behavior to prove |
| Ambient couples | Atomic pair formation, leader selection from native walk speeds, and the separate observer presentation lease, with per-member reciprocity and role diagnostics | Long-run couple churn under heavy density and every native walk-side branch |
| Dynamic world objects | Client-only harness covering discovery, live transforms under player and vehicle pushes, damage and break events, matrix writes, destroy refusal, and preserved element identity across stream-out and stream-in | Server-side or synchronized behavior, object health and break-state properties, and behavior under arbitrary Lua-driven transform fighting |
| Runtime collision generation | Unit tests for mixed sphere/box/mesh serialization, multi-mesh index offsetting, and each rejection path; an interactive resource covering live rebuilds while a player stands on the shape, shape switching, and vehicle impact | Large mesh models at the documented ceilings, sustained per-frame regeneration cost, and every GTA surface material's physical response |
| Dynamic object physics | A harness covering fall, rebound and settle, live velocities surviving object sync, and manual two-client syncer-change and stream-cycle checks | Sustained load with many physical objects at once, and behavior on models whose collision is unsuited to rigid-body simulation |
| Managed ropes | A two-sided pass/fail harness covering state round-trips, native activation and interpolation, cargo attachment, slot leasing beyond the native cap, and a dedicated regression for the holder-dereference crash | Long-run behavior with sustained lease churn, and every native rope type under multiplayer load |
| Custom foliage | A scripted regression over all seven functions, density bounds, degenerate-triangle and out-of-range rejection, dimension change and restore, OOP registration, and element-group teardown; plus create/destroy stress cycles | The rendered plant count, which GTA owns and Lua cannot read back; behavior under a natively saturated plant pool, where a sub-64 cap result is inconclusive rather than a failure |
| Managed fire | A pass/fail harness covering creation, lifetime and remaining time, live setters, damage masks, source and target, client synchronization, server expiry, one-generation spread, more than 60 simultaneous fires, and a cancelled damage event; plus a manual late-join check that a mid-burn joiner receives the reduced remaining lifetime | Long-run spread across many generations, damage balance against native fire, and sustained load well beyond the 68 fires the showcase places |
| Scriptable birds | A pass/fail harness covering creation, every property round-trip, freeze behavior, invalid input rejection, 128 simultaneous birds, and both the destroy and cancel paths of the shot event | Long-run flock performance, and how managed birds behave alongside a fully saturated native ambient bird population |
| Model 2DFX effects | A pass/fail harness covering cleanup across resource restarts, rejection of malformed properties and oversized names, custom and native effect editing, count semantics, and repeated global restreams | Every effect type under a production workload, and the streaming cost of large numbers of custom effects |
| Object fracture | A pass/fail harness covering fracture from live geometry, introspection, cache reuse, durability profiles including the zero-health transition, invalid arguments and multiple simultaneous effects | Fracture cost on high-triangle models, and how many simultaneous effects a production scene can sustain |
| Story primitives | Focused task, lease, camera, cutscene, audio, text, recording, gang-tag, and route checks; reusable two-client channels cover locomotion, ordered animation, fight/chat, weapon audiovisuals, and selected physical responses | General task completion events, arbitrary syncer reconstruction, universal task presentation, and frozen-owner heartbeat recovery |
| Mission checkpoints | Sweet & Kendl and OG Loc each completed two consecutive two-client headless passes; Tagging Up Turf has a complete two-client success path; Drive-Thru has two-client pursuit coverage plus a complete single-client return; Nines has partial runtime coverage | Complete natural visual/audio replay for the two newest missions, remaining branches, and the incomplete Drive-Thru and Nines multiplayer matrix; see [Mission checkpoints](/neon/mission-checkpoints) |
| Compatibility and packaging | Capability-gated ordinary layouts, exact Neon native-world protocol rejection, installer/package checks, localhost connection, packaged Windows and Linux x64 server startup smoke tests, and Linux ARM64 package inspection | Linux ARM64 startup, runtime validation of `fastweaponstrafe`, and every experimental feature in the public package |

This matrix is intentionally scoped. Exact timings, temporary ticket IDs, build-log excerpts, and one-off debugging observations belong in commits or test records rather than the evergreen guide.

## Local asset previews

Neon includes developer-only drop workflows:

- one DFF and optional TXD can preview a replacement of the local player's current base skin;
- one IFP loads an animation list; a single animation starts immediately, while several animations open searchable controls for looping, freeze-last-frame, root motion, speed, and blend.

Inputs are size-bounded and use existing validation and replacement paths, but there is no server authorization. These are local development tools, not secure multiplayer features.

## Reading API provenance

Each Neon API page keeps its implementation source and introducing or extending commit. Where known, it also links a direct test resource. These links provide traceability; they do not replace the evidence scope stated in the guide or matrix.

For playable story coverage, use [Mission checkpoints](/neon/mission-checkpoints). For native-world security, lifecycle, and current boundaries, use [Native world packs](/neon/native-world).
