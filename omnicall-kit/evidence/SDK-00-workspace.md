# SDK-00 — Package Workspace and CI

**Date:** 2026-07-20  
**Status:** done (`/sdk-review` PASS 2026-07-20)  
**Unit:** SDK-00

## Environment

| Item | Value |
| --- | --- |
| Node | v22.20.0 (engines `>=20.19.0`) |
| npm | 10.9.3 |
| Branch | `feature/omnicall-kit` |
| DI-00 prerequisite | `done` (`18fb3f1`) — does not block SDK-00 |
| Nested git in `omnicall-kit/` | none |

## Workspace choice

Self-contained npm workspace under `omnicall-kit/` with its own `package.json` +
`package-lock.json`. Desktop root `package.json` has no `workspaces` field; this
keeps the incubating SDK extractable and avoids coupling to Electron app install.

CI lives at repository-root `.github/workflows/omnicall-kit-ci.yml` because GitHub
Actions only discovers workflows under `.github/workflows/`. The job uses
`defaults.run.working-directory: omnicall-kit`.

## Packages

| Package | Path | Runtime deps |
| --- | --- | --- |
| `@softomnitel/omnicall-protocol` | `packages/protocol` | none |
| `@softomnitel/omnicall-kit` | `packages/sdk` | `@softomnitel/omnicall-protocol@0.0.0` (workspace) |

`packages/sdk-testing` was **not** created (no test consumer yet).

Public surface: placeholder `export {}` only. API reports confirm no production exports.
No publish performed.

## Dependency ledger

See `docs/DEPENDENCIES.md` (checked 2026-07-20). TypeScript locked to **5.9.3**
because `typescript-eslint@8.64.0` peers `typescript <6.1.0` (npm latest TS 7.0.2
blocked).

## Verification

Commands from `omnicall-kit/` after deleting `node_modules` + `dist`:

```text
npm ci
npm run preflight
```

Results:

| Step | Result |
| --- | --- |
| `npm ci` | PASS (332 packages, 0 vulnerabilities) |
| `lint` | PASS |
| `typecheck` | PASS |
| `build` | PASS |
| `test` | PASS (3 tests) |
| `test:types` | PASS (2 type tests) |
| `test:browser` | PASS (scaffold; Playwright run when `CI`/`OMNICALL_SDK_BROWSER=1`) |
| `api:check` | PASS — empty public surface in `etc/api/*.api.md` |
| `package:check` | PASS — publint All good; attw esm-only green |
| preflight | **PASS** |

### Tarballs

| File | Contents summary |
| --- | --- |
| `temp/tarballs/omnicall-protocol-0.0.0.tgz` | LICENSE, README, package.json, dist/{index.js,index.d.ts,+maps} |
| `temp/tarballs/omnicall-kit-0.0.0.tgz` | same shape |
| `temp/tarballs/manifest.json` | `publish: false` |

No `src/`, tests, secrets, or `node_modules` in tarballs.

## Explicit non-goals preserved

- no `npm publish` / no changeset publish
- no `OmniCallClient` / product protocol schemas / golden fixtures
- no O-* protocol decisions closed
- no desktop `src/` changes
- no nested git
- no desktop Domain/Application/Electron/JsSIP/React/Zustand imports

## Docs checked before tooling choices

- Node package exports: https://nodejs.org/docs/latest/api/packages.html (`types` first)
- Vitest browser: https://vitest.dev/guide/browser/
- API Extractor: https://api-extractor.com/pages/setup/invoking/
- publint / attw package validation docs
- typescript-eslint peer range vs TypeScript 7
