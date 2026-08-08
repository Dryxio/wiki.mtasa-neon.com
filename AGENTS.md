# Neon documentation instructions

These rules apply to every change under this repository, with special attention
to `web/src/content/docs/neon`, `web/src/data/neon-functions.ts`, and the Neon
page templates.

## Editorial goal

Write for the person trying to understand or use Neon, not for the person
reviewing the engine commit history.

Lead with information in this order:

1. what the user can build, observe, or control;
2. how to use it and where to start;
3. real side, ownership, lifecycle, compatibility, and cleanup constraints;
4. current limitations and the exact scope of runtime evidence;
5. implementation provenance, commits, executable addresses, and build details.

The first screen and first section of a guide must answer a user question.
Commit chronology is not an information architecture.

## Relevance and hierarchy

- Give top-level sections and overview cards to public capabilities, important
  workflows, major limitations, or operational risks.
- Do not promote a small bug fix, shader correction, build repair, address
  change, or internal refactor to the top of a guide merely because it is new.
- A minor implementation detail normally belongs in one short note near the
  affected behavior or in the verification/provenance section near the bottom.
- Do not make a commit hash the subject of a heading. Describe the user-visible
  behavior first and link the commit as supporting provenance.
- Do not append every new engine commit to the beginning of an existing page.
  Reconsider the whole page hierarchy and integrate the change where a reader
  would naturally look for it.
- Keep reusable systems separate from mission-specific regression narratives.
  Guides explain the primitives; mission checkpoint pages explain what a test
  resource combines and what its runs prove.
- Avoid repeating the same test history across the overview, system guide, API
  entry, and tooling page. Keep the strongest explanation in one place and link
  to it elsewhere.
- Do not delete a useful exhaustive inventory merely to shorten a guide. Keep
  the user-facing explanation concise, then preserve task/opcode maps, exact
  layouts, state lists, and similar reference material in a clearly labeled
  `<details>` block or a dedicated reference page.

Before giving a change its own section, ask:

1. Does it add or materially change a public API or user workflow?
2. Does it change compatibility, lifecycle, security, data loss, or deployment?
3. Would a resource author actively search for this information?

If all three answers are no, it is supporting detail, not headline content.

## Evidence language

Never turn implementation existence into a validation claim.

- **Implemented** means the code or resource path exists.
- **Statically checked** means parsing, manifests, scripts, or non-runtime
  validation passed.
- **Built** means the stated projects compiled.
- **In-game checked** means the exact stated path was observed in a running
  client/server session.
- **Multiplayer checked** requires an explicit multi-client run; architecture
  designed for multiple players is not enough.

State the narrowest true claim and keep open work visible. Do not use words such
as stable, complete, validated, supported, or parity without evidence matching
that scope.

## API reference

For every public Neon function, document:

- exact signature and side;
- arguments and return values;
- ownership, lifecycle, cleanup, and failure conditions;
- source file and introducing/extending commit;
- original GTA task, `CTask`, or SCM opcode when applicable;
- the exact focused test resource when one directly exercises the function.

Do not label an inherited category pointer as a direct test. Use
`Related category harness` for discovery-only category coverage and
`Test resource` only for an explicitly assigned harness.

Keep API notes about the function contract. Put long mission histories,
constructor addresses, reverse-engineering diaries, and build transcripts in a
guide or verification section unless they are necessary to use the function
safely.

## Required review before publishing

For a Neon documentation update:

1. inspect engine diffs, final code, Lua registrations, and relevant
   test-resources rather than relying on commit messages;
2. inspect relevant uncommitted engine files while excluding personal,
   internal, and machine-specific files;
3. compare the change with the existing page hierarchy before adding content;
4. verify the API count and all affected cross-links;
5. build the wiki;
6. check local links, anchors, and duplicate IDs;
7. inspect representative pages and scrolling at desktop and mobile widths;
8. preserve unrelated working-tree changes and personal files such as
   `.DS_Store`.

Commit messages for documentation changes must describe the reader problem,
the editorial reasoning, the pages or APIs affected, and the build/link/visual
checks performed.

## Production deployment

Deploy the Neon site only from the `web` directory linked to the Vercel project
named `mtasa-neon-wiki`:

```sh
cd web
npm run build
vercel deploy --prod --yes
```

Do not use `vercel deploy --prebuilt` for this repository. A prebuilt
`.vercel/output` directory can come from another checkout and publish the
official MTA wiki under Neon's aliases even though Vercel reports a successful
deployment.

After every production deployment, request all of these public routes and
confirm that they return Neon pages rather than the upstream MTA 404 redirect:

- `https://mtasa-neon-wiki.vercel.app/`
- `https://mtasa-neon-wiki.vercel.app/neon/`
- one generated API route under `/neon/functions/`

Also inspect a representative page at desktop and mobile widths before calling
the deployment complete.
