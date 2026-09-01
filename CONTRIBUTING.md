# Contributing to MTA:SA Neon Documentation

This repository publishes one intentionally narrow documentation surface:

- `/neon` documents only behavior added or changed by MTA:SA Neon.
- Standard MTA documentation remains canonical on the official MTA Wiki and is linked externally.

Do not present a Neon-only function or behavior as part of upstream MTA. When Neon extends an existing API, document the extension in the Neon compatibility guide and mark the function entry as an extension.

## Evidence requirements

Neon documentation should be checked against the engine implementation, not inferred from a function name. Use the relevant registration and implementation code, commit description, focused test resource, and runtime evidence when available.

For work that exists only in the engine worktree:

- label it as current, uncommitted, or experimental;
- distinguish implemented behavior from planned behavior;
- avoid presenting it as released or fully verified; and
- update the page when the implementation is committed, changed, or removed.

Each Lua API entry should describe its execution side, signature, argument constraints and defaults, return behavior, ownership or cleanup rules, source file, introduction commit, and focused test resource where one exists.

## Development

Requires Node.js 22 or newer.

```sh
cd web
npm ci
npm run dev
```

Open `http://localhost:4321/neon`, then validate a production build with:

```sh
npm run build
```

## Upstream synchronization

This is an independent repository with the complete upstream Git history. Keep the official wiki configured as `upstream` and the Neon repository as `origin`:

```sh
git remote add upstream https://github.com/multitheftauto/wiki.multitheftauto.com.git
git fetch upstream
```

Review upstream merges carefully. Do not re-enable upstream reference collections, routes, articles, or bulk assets in the public Neon build.

## Commit messages

Commit messages should record the prompt or problem, goal, motivation, relevant implementation reasoning, evidence used, and exactly how the documentation was tested. A terse title alone is not enough for changes that affect technical claims.

## Licenses

Documentation is available under the repository's GNU Free Documentation License. Source code in `web` is licensed under GPLv3; see `web/LICENSE`.
