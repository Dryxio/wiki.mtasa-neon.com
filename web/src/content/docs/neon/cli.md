---
title: Neon CLI for AI agents
description: Give an AI coding agent the complete MTA and Neon API, project-aware context, automatic checks, and real in-game test evidence.
sidebar:
  order: 5
---

Point an AI coding agent at a gamemode, and the Neon CLI gives it the real MTA + Neon API instead of making it guess function names or learn the engine from scattered source files. The agent can find the right API, read its exact arguments and client/server side, edit the project, check common mistakes, refresh its context, and prove whether the server, client, and GTA actually joined a test.

Everything runs locally and returns structured JSON that an agent can use directly. It does not need an account, a remote service, or an MCP server.

## What the agent can do

| Task | Command | Concrete result |
| --- | --- | --- |
| Prepare a gamemode | `neon init` | Finds its resources and creates the instructions, API catalogue, and compact project context the agent needs. |
| Find an API | `neon api search` | Searches MTA and Neon functions, events, classes, and enums by name or purpose. |
| Read the exact contract | `neon api get` | Returns arguments, return values, client/server side, availability, and evidence for one API. |
| Catch project mistakes | `neon check` | Checks resource metadata and detects known API or event calls used on the wrong side. |
| Refresh agent context | `neon generate project` | Rebuilds the API index, project contracts, and separate client/server Lua language-server files. |
| Detect stale generated files | `neon context verify` | Confirms that the agent is working from the current project and API context. |
| Test the CLI package | `neon self-test` | Checks the package and runs an isolated check/generate/verify workflow. |
| Prove the game really ran | `neon runtime prove` | Waits for fresh reports from the server and from the resource loaded inside GTA instead of trusting that a process merely started. |

Python 3.10 or newer is required, but no third-party Python package is needed.

The examples use `neon` as the command name. From a source checkout, call the launcher's full path, such as `/path/to/mtasa-neon/neon` on macOS or `C:\path\to\mtasa-neon\neon.cmd` on Windows, unless it is already in `PATH`.

## Prepare an existing gamemode once

Start with a gamemode folder that contains one or more resources with a `meta.xml` file:

```sh
neon init --workspace /path/to/gamemode --profile neon-pair --json
```

`init` finds the resources and prepares the folder for an agent. It creates:

- `neon.project.json`, which describes the gamemode and its client/server profile;
- `NEON_AGENT.md`, which tells the agent which checks to run;
- `.neon-tooling`, which contains the gamemode's pinned copy of the complete API catalogue;
- `.neon`, which contains compact agent context, an API index, project contracts, and client/server Lua language-server files.

The command refuses to replace an existing `neon.project.json` or `.neon` directory. If `NEON_AGENT.md` already exists, it is preserved and the result tells you to merge the Neon instructions manually. If automatic discovery is not suitable, repeat `--resource path/to/resource` to name each resource explicitly.

## Use this loop while developing

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

Search is only for discovery. The agent should still call `api get` before relying on a result. The CLI reports what its checks observed; it does not claim that a command passed unless that command was actually run and its JSON result says so.

## Complete agent workflow

Give the agent this recipe:

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

## Current distribution

For now, run the CLI from a Neon source checkout. No portable CLI ZIP has been published on GitHub Releases.

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

## Prove that the server and GTA really joined the test

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

Installing the probe, starting or restarting a resource, and launching a client changes the local development session. These commands require explicit paths and opt-in capabilities; the supervisor is otherwise read-only, loopback-only, and expires. A submitted start or restart command is not proof that MTA processed it. Only a successful fresh observation or `runtime prove` result establishes the scope it reports.

This is evidence for an isolated development session. It is not anti-cheat and does not prove anything against a hostile administrator, native module, or resource that can replace the probe's private files.

Implementation provenance: the [portable workspace and safe initialization](https://github.com/Dryxio/mtasa-neon/commit/eed0bd21c) and the [authenticated Windows runtime proof](https://github.com/Dryxio/mtasa-neon/commit/7685d87f0) are tracked separately from the evidence produced by an actual CLI run.
