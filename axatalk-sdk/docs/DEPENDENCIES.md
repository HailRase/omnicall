# Axatalk SDK Dependency Ledger

Checked against the npm registry and peer constraints on **2026-07-20**.
Runtime dependencies in `@axatalk/protocol` and `@axatalk/sdk`: **none** (sdk only
depends on the workspace protocol package).

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

## Publish posture

- Packages are `private: true` during incubation.
- `publishConfig.access=public` and `publishConfig.provenance=true` are scaffolded only.
- CI uploads tarball artifacts and **never** runs `npm publish`.

## Approved for SDK-02 (not installed in SDK-01)

| Package | Planned | Purpose | ADR |
| --- | --- | --- | --- |
| `zod` | `^4` (lock exact on install; registry `4.4.3` on 2026-07-20) | Runtime protocol schemas in `@axatalk/protocol` | ADR-0014 |

SDK-01 does **not** add runtime dependencies. SDK-02 must install, lock, record gzipped
bundle evidence, and keep `protocol` free of desktop imports.
