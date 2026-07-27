# OmniCall Kit Dependency Ledger

Checked against the npm registry and peer constraints on **2026-07-20**.

## Runtime dependencies

| Package | Version | Package | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `zod` | **4.4.3** (exact) | `@softomnitel/omnicall-protocol` only | Runtime protocol schemas (ADR-0014 / O-SCHEMA-1) | Locked in SDK-02. Not imported by `@softomnitel/omnicall-kit` yet. |

### Zod size evidence (SDK-02, 2026-07-20)

Measured with parent-repo `esbuild` bundling `zod` ESM entry (`format=esm`,
`platform=neutral`):

| Metric | Value |
| --- | --- |
| Bundled bytes | 545 429 (~532.6 KiB) |
| gzip -9 | **79 834 (~78.0 KiB)** |

Accepted for protocol v1. Valibot remains the documented alternative if a future gate
treats this footprint as a Blocker (ADR-0014).

`@softomnitel/omnicall-kit` runtime dependencies: workspace `@softomnitel/omnicall-protocol` only (no direct Zod
until a later unit needs it at the SDK boundary).

## Tooling (devDependencies)

| Package | Version | Purpose | Runtime? | Notes |
| --- | --- | --- | --- | --- |
| `typescript` | 5.9.3 | Strict compile + declarations | no | Latest 5.9.x. npm `latest` is 7.0.2, but `typescript-eslint@8.64.0` peers `typescript <6.1.0`, so 7.x is blocked until eslint tooling catches up. |
| `typescript-eslint` | 8.64.0 | Type-aware ESLint rules | no | Docs: https://typescript-eslint.io/ |
| `eslint` | 10.7.0 | Lint runner (flat config) | no | Docs: https://eslint.org/docs/latest/ |
| `@eslint/js` | 10.0.1 | ESLint recommended JS config | no | Required by flat config setup |
| `vitest` | 4.1.10 | Unit + type tests | no | Docs: https://vitest.dev/ |
| `@vitest/browser-playwright` | 4.1.10 | Browser harness provider | no | Docs: https://vitest.dev/guide/browser/ |
| `playwright` | 1.61.1 | Chromium for browser scaffold | no | Browsers skipped on default install (`.npmrc`) |
| `publint` | 0.3.21 | Package export/files validation | no | Docs: https://publint.dev/ |
| `@arethetypeswrong/cli` | 0.18.5 | Declaration/export resolution check | no | Docs: https://github.com/arethetypeswrong/arethetypeswrong.github.io |
| `@microsoft/api-extractor` | 7.58.11 | Deterministic API report gate | no | Docs: https://api-extractor.com/ |
| `@changesets/cli` | 2.31.1 | Version/changelog scaffolding | no | Publish deferred to SDK-10 |
| `@types/node` | 22.20.1 | Node typings aligned with engines | no | Workspace engines: `node >=20.19.0` |
| `globals` | 17.7.0 | ESLint Node globals for scripts (ignored in lint scope) | no | https://github.com/sindresorhus/globals |

## Package exports

ESM-first `exports` with `types` listed first, then `import` / `default`, per
Node.js package docs: https://nodejs.org/docs/latest/api/packages.html

`@softomnitel/omnicall-protocol` also exports `./fixtures/*` for DI-01 / CI consumers of golden
JSON bytes.

## Publish posture

- Packages remain `private: true` / `0.0.0` during incubation and **SDK-10 Mode A** (RC staging).
- `publishConfig.access=public` and `publishConfig.provenance=true` are scaffolded and
  verified by `npm run release:check`.
- First public RC target: `0.1.0-rc.0` on npm dist-tag **`rc`** (never `latest` while DI-10 open).
- Workspace is in changesets **prerelease mode** (`.changeset/pre.json`, tag `rc`) so
  `changeset version` yields `0.1.0-rc.0`, not bare `0.1.0`.
- CI / local scripts pack tarballs and generate SBOM (`npm run sbom`); they **never** run
  `npm publish` to a registry from automation in this track.
- Stable / `latest` publish is fail-closed until desktop DI-10 packaged E2E evidence exists
  (or an explicit human waiver). See `docs/guide/release-and-support.md`.
