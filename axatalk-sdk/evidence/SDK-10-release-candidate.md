# SDK-10 Evidence — Release Candidate Staging (Mode A)

**Date:** 2026-07-20  
**Status:** `done` — **Mode A RC staging / stable-blocked** (`/sdk-review` PASS 2026-07-20)  
**Feature:** F-011 remains `in progress` (not `implemented`)  
**Desktop DI-10:** still `blocked` (awaits explicit `/sdk-integration` DI-10 intake; not auto-started; no waiver)  
**npm publish:** **none** (dry-run skipped because `private: true`; pack + SBOM only)

## Intake

| Check | Result |
| --- | --- |
| SDK-00…SDK-09 | `done` (SDK-09 closed post-Low: sdk src **115** / workspace **123**) |
| SDK-10 was `pending` | set `in progress` → now `review` |
| DI-10 | **not** `done` → **Mode A** selected (not Mode B) |
| F-011 | remains `in progress` |
| Scope | `axatalk-sdk/` + factual registry / evidence / work-history only |

### Mode selected: **A — RC staging**

Full stable promote is **blocked on DI-10**. No claim of packaged Electron E2E PASS.

### Explicit non-goals (held)

- No `npm publish` to `latest` or any registry tag
- No F-011 `implemented` / P12 close
- No DI-10 coding / auto-start
- No API surface growth (remains **47** / **169**)
- No privilege-strip weakening
- No packing of `fake-transport` / `auth-test-peer` / docs harness
- No desktop Electron SemVer / product release cut

## Deliverables

### Documentation

| Artifact | Path |
| --- | --- |
| Release / rollback / revoke / support | `docs/guide/release-and-support.md` |
| Compatibility matrix (DI-10 cells explicit) | `docs/guide/compatibility-matrix.md` |
| Guide index + installation RC notes | `docs/guide/README.md`, `installation.md`, `upgrade-deprecation.md` |
| Package changelogs (incubation → RC) | `packages/sdk/CHANGELOG.md`, `packages/protocol/CHANGELOG.md` |
| Changeset (pending; not version-applied) | `.changeset/first-public-rc.md` + `pre.json` (tag `rc`) |
| Publish posture | `docs/DEPENDENCIES.md` |

### Tooling

| Script | Role |
| --- | --- |
| `npm run sbom` | CycloneDX via `npm sbom` → `temp/sbom/*.cyclonedx.json` |
| `npm run release:check` | publishConfig + `package:check` + SBOM + private-aware dry-run report |
| `package:check` | Extra forbidden paths: docs harness names + `/docs/` |

### Versioning strategy (documented, not applied)

- Target first public RC: **`0.1.0-rc.0`** for both packages
- npm dist-tag: **`rc`** (never `latest` while DI-10 open)
- Workspace remains `private: true` / `0.0.0` until human authorizes publish
- Changesets **prerelease mode entered** (`.changeset/pre.json`, tag `rc`) so
  `changeset version` → `0.1.0-rc.0` (not bare `0.1.0`)
- Changeset `first-public-rc.md` ready; `changeset version` **not** run this session
- Post-review Low/High remediation (2026-07-21): pre mode + docs aligned; clean-install re-verified

## Checklist mapping (Mode A)

| Checklist item | Result |
| --- | --- |
| clean-install preflight | **PASS** — wiped workspace `node_modules`, `npm ci` (333 pkgs, 0 vulns), `preflight` PASS; **re-verified 2026-07-21** post High/Low remediation |
| package API and tarball checks | **PASS** — `api:check` 47/169; `package:check` no fake peer / docs harness |
| browser and SDK/desktop compatibility matrix | Chromium baseline **PASS**; desktop hostile/old-new matrix **blocked on DI-10** |
| packaged Electron E2E | **blocked on DI-10** — `axatalk-sdk-integration/evidence/DI-10-blocker-sdk-prereqs.md` |
| architecture review | Self-check **PASS** (see below) — formal `/arch-review` deferred to Mode B / DI-10 close |
| security review | Self-check **PASS** (see below) — formal security gate deferred to Mode B / DI-10 |
| changelog, SBOM, provenance, rollback, revoke | **PASS** — real files + `release:check`; no registry publish |
| RC validated before stable | RC dry-run path documented; registry RC **not** published; stable **blocked** |

## Architecture self-check (publish surface)

| Rule | Result |
| --- | --- |
| `sdk -> protocol` only; no desktop Domain/Electron/JsSIP/React | Held (unchanged packages) |
| Public payloads JSON-safe; runtime schemas at boundary | Held |
| No second softphone / SIP in SDK | Held |
| Example stays workspace-private | `examples/crm-pairing-lite` `private: true` |
| API freeze | **47** / **169** — no silent growth |

## Security self-check (publish surface)

| Rule | Result |
| --- | --- |
| Tarball excludes test peers / docs harness | `package:check` PASS |
| `docs:check` secret + privilege scans | PASS |
| SBOM secret-shaped scan | PASS (`scripts/sbom.mjs`) |
| `publishConfig.provenance=true` | Verified by `release:check` |
| No Web Storage auth guidance weakening | Guide + docs:check unchanged invariants |
| No `account.activate` at pairing teaching | docs:check PASS |
| No secrets in changelog / evidence | Held |

## Verification commands (2026-07-20)

Clean install:

```text
Remove-Item node_modules (workspace + package workspaces)
npm ci                          → PASS (333 packages, 0 vulnerabilities)
npm run preflight               → PASS
```

Focused / release:

```text
npx vitest run packages/sdk/src → 115 passed
npx vitest run --typecheck.only → 7 passed
npm run lint                    → PASS
npm run typecheck               → PASS
npm run api:check               → protocol 169 / sdk 47
npm run package:check           → PASS (included in preflight + release:check)
AXATALK_SDK_BROWSER=1 npm run test:browser → 7 passed
npm run docs:check              → PASS
npm run release:check           → PASS (publishPerformed=false; dry-run skipped-private)
```

Workspace `npm test` (via preflight): **123** passed.

### Counts vs SDK-09 post-Low baseline

| Metric | Baseline | SDK-10 |
| --- | --- | --- |
| sdk src | 115 | **115** |
| workspace tests | 123 | **123** |
| types | 7 | **7** |
| browser | 7 | **7** |
| api sdk / protocol | 47 / 169 | **47** / **169** |
| docs:check | PASS | PASS |
| preflight | PASS | PASS |

No intentional test-count delta (docs/scripts only).

## Remaining gates (must not be forgotten)

1. **DI-10** — packaged Electron E2E + hostile/compat matrix (`/sdk-integration` DI-10 only)
2. Human authorize `private: false` + confirm `pre.json` tag `rc` + `changeset version` → `0.1.0-rc.0` + `npm publish --tag rc` (optional RC)
3. Formal architecture + security reviews for Mode B stable
4. RC validation window, then stable/`latest` only after DI-10 PASS
5. F-011 / P12 close only when DI-10 closer criteria met — **not** by SDK-10 Mode A

## Handoff

Request: **`/sdk-review` SDK-10 only**

Exit narrative: **RC-ready / stable-blocked**.
