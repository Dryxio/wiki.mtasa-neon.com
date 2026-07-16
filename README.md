## MTA:SA Neon Documentation

This repository is the documentation site for **MTA:SA Neon**, built on top of the data-driven Multi Theft Auto wiki. It keeps the complete upstream Git history while remaining an independent GitHub repository rather than a GitHub fork.

Neon content has its own clearly marked section under `/neon`. The original MTA articles and API reference remain available as upstream documentation; Neon-specific behavior is not silently merged into that reference.

The Neon section is derived from the implementation, commit history, test resources, and explicitly identified current worktree changes in [`Dryxio/mtasa-neon`](https://github.com/Dryxio/mtasa-neon).

## Repository layout

- `web/src/pages/neon`: Neon landing and generated Lua API pages.
- `web/src/content/docs/neon`: Neon system guides and compatibility notes.
- `web/src/data/neon-functions.ts`: structured Neon-only API reference.
- `web/src/content/docs`, `functions`, `events`, and `elements`: retained upstream MTA documentation.

## Local development

Requires Node.js 22 or newer.

```sh
cd web
npm ci
npm run dev
```

Open `http://localhost:4321/neon`. Run `npm run build` before submitting a change.

To compare or synchronize upstream history, use the canonical MTA wiki as an `upstream` remote:

```sh
git remote add upstream https://github.com/multitheftauto/wiki.multitheftauto.com.git
git fetch upstream
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing either the Neon section or retained upstream documentation.

## License

Copyright (c) 2025 Multi Theft Auto team and contributors. Neon-specific documentation is maintained by the MTA:SA Neon contributors.

Permission is granted to copy, distribute and/or modify this document under the terms of the [GNU Free Documentation License, Version 1.3](https://www.gnu.org/licenses/fdl-1.3.html) or any later version published by the Free Software Foundation; with no Invariant Sections, no Front-Cover Texts, and no Back-Cover Texts. A copy of the [license](LICENSE.md) is included in the root directory of the repository.
