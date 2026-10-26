# @bvandrc/react-ui-hooks — Claude Code Reference

Generic React hooks and helpers for browser UI behavior, published to npm as `@bvandrc/react-ui-hooks`.

## Code conventions

Conventions live outside this file, synced from https://github.com/bvandrc/bvandrc-conventions by `.github/workflows/sync-conventions.yml` — follow all of them, and edit a rule upstream rather than in `conventions/`, which every sync overwrites:

@conventions/typescript.md — language-level TypeScript/JavaScript rules
@conventions/react.md — component, JSX, folder layout, and accessibility rules
@conventions/ts-testing-all.md — testing rules shared by every TypeScript suite: test IDs, naming, assertions
@conventions/ts-unit-testing.md — TypeScript unit test layout, naming, fixtures, and assertions
@conventions/all.md — practice for every repo: branches, formatting, comments, testing, markdown, PR reviews

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run build` | Build `dist/` with tsdown: unbundled ESM plus `.d.mts` types |
| `pnpm run format` | Biome format — **run before every commit** |
| `pnpm run lint` | Biome lint and format check |
| `pnpm run ts:check` | TypeScript check |
| `pnpm run test` | Vitest unit tests (single run) |
| `pnpm run test:isolated` | Vitest with each file in its own module graph, for checking whether a failure depends on another file |
| `pnpm run check` | ts + lint (lint includes the format check); `prepublishOnly` runs it, then `test` and `build` |

## Releasing

Bump `version` in `package.json`, merge, then publish a GitHub release tagged `v<version>`. `.github/workflows/release.yml` checks the tag matches and runs `pnpm stage publish` with provenance, which leaves the version staged: approve it on npmjs.com with 2FA to publish it.

## Gotchas

- **Generic by intent**: Nothing here may know about an app that uses it. A dependency added here ships to every consumer, so prefer a local copy of a small helper (as `src/utils/lang.ts` does) over a new package.
- **The public API is `src/index.ts` and `src/test-support/index.ts`**: Removing or renaming an export from either is a breaking change, so it needs a major bump.
- **Test support ships**: `src/test-support/` is published for consumers' own tests, so it imports `vi` from `vitest` explicitly rather than relying on Vitest's globals, which a consumer may not turn on.
- **Unit tests share a worker**: `isolate` is off and files run in a shuffled order, so `vitest.setup.ts` clears the DOM, `localStorage`, and fake timers after every case, but a `vi.spyOn` or a module's own state is the test's to undo. Replay a seed-dependent failure with `--sequence.seed=<n>`.
- **pnpm, pinned**: `packageManager` in `package.json` pins the pnpm version, which `corepack enable` (or CI's `pnpm/action-setup`) picks up. Install with `pnpm install`; npm and its `package-lock.json` aren't used here.
