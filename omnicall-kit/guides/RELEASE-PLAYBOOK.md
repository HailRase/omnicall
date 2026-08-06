# Release Playbook (OmniCall Kit)

Operational guide for publishing `@softomnitel/omnicall-protocol` and `@softomnitel/omnicall-kit`.
Mirrors OmniCall desktop release discipline, adapted for npm private packages (org scope).

## Who does what

| Role | Version bump | npm publish | Tag / CI |
| --- | --- | --- | --- |
| Feature / SDK agents | **Never** without authorization | **Never** | **Never** |
| Release cut (human or `/release`-style session) | **Yes** via changesets | **Yes** with `RELEASE_CONFIRM=1` | Git tag optional |
| Integrators | No | No | Install only (`@rc` / `@latest`) |

## When to bump

| Change | SemVer (pre-1.0) | Example |
| --- | --- | --- |
| Protocol/API fix, no breaking wire | PATCH / next RC | `0.1.0-rc.0` → `0.1.0-rc.1` |
| New capability / command surface | MINOR | `0.1.0` → `0.2.0` |
| Breaking wire / removed capability | MAJOR | `0.x` → `1.0.0` |

**Do not bump** for: docs-only, tests-only, internal refactors without consumer impact.

### Corrective track (ADR-0027 / production-readiness)

| Surface | Expectation | Notes |
| --- | --- | --- |
| `@softomnitel/omnicall-kit` | **MINOR** if additive public DX ships; else **PATCH** for corrective semantics | e.g. latest-known `getRevision()` observation is consumer-visible → treat as MINOR unless release cut classifies as PATCH-only docs/behavior harden |
| OmniCall Desktop | **PATCH** for coordinator / dedup / pairing / window clock fixes | No host API break claimed by this track |
| Version bump + npm publish | **WU-07 / authorized release cut only** | Agents must not bump or publish during WU-01…WU-06 |

## npm access posture

| Item | Value |
| --- | --- |
| Scope | `@softomnitel` |
| `publishConfig.access` | **`public`** (Free org interim) or **`restricted`** (Teams) |
| Workspace truth | kit **`0.2.1`**, protocol **`0.1.0`** (`packages/*/package.json`) |
| npm `latest` (verified) | kit **`0.2.1`**, protocol **`0.1.0`** |
| npm `rc` | **`0.1.0-rc.0`** (both) |
| Free org plan | Can prepare locally; **cannot** publish restricted |
| Stable dist-tag | **`latest`** (DI-10 closed 2026-07-27) |

See [npm-org-and-access.md](./npm-org-and-access.md).

## Licensing / publish gate (fail-closed)

Both publishable packages declare `"license": "UNLICENSED"` and ship a placeholder
`LICENSE` (all rights reserved until a public license is chosen).

- **UNLICENSED is not an open-source grant.** Do not invent SPDX text or claim MIT/Apache.
- `release:publish-*` refuses unless `RELEASE_CONFIRM=1` **and**
  `RELEASE_LICENSE_REVIEWED=1` (human legal/license review evidence outside this repo).
- Security review gate in `docs/SECURITY.md` remains mandatory for public publish.
- Example apps stay `private: true` and are never published.

## Release cut procedure

### 1. Preflight

```bash
npm run release:preflight
```

Must be green before version bump or publish.

### 2. Version (changesets)

RC (workspace already in pre mode — `.changeset/pre.json`):

```bash
npm run release:version
```

Stable (Mode B only):

```bash
npx changeset pre exit
npm run release:version
```

### 3. Make packages publishable

```bash
npm run release:prepare
```

Flips `private:false` on protocol + kit only. Example apps stay private.

### 4. Release check (pack / SBOM / dry-run)

```bash
npm run release:check
```

### 5. Publish

**RC** (npm auth + license review while UNLICENSED):

```bash
# PowerShell
$env:RELEASE_CONFIRM='1'; $env:RELEASE_LICENSE_REVIEWED='1'; npm run release:publish-rc

# bash
RELEASE_CONFIRM=1 RELEASE_LICENSE_REVIEWED=1 npm run release:publish-rc
```

**Stable** (also requires DI-10 gate env + license review while UNLICENSED):

```bash
# PowerShell
$env:RELEASE_CONFIRM='1'; $env:RELEASE_DI10_DONE='1'; $env:RELEASE_LICENSE_REVIEWED='1'; npm run release:publish-stable

# bash
RELEASE_CONFIRM=1 RELEASE_DI10_DONE=1 RELEASE_LICENSE_REVIEWED=1 npm run release:publish-stable
```

### 6. Lock packages again (optional)

```bash
npm run release:prepare -- --lock
```

### 7. Git tag (recommended)

```bash
git tag v0.1.0-rc.0
git push origin main
git push origin v0.1.0-rc.0
```

## Scripts map (like OmniCall)

| Script | Purpose |
| --- | --- |
| `npm run release:preflight` | Full SDK gate (lint, types, tests, api, pack, docs) |
| `npm run release:check` | publishConfig + fortress + SBOM + dry-run |
| `npm run release:version` | `changeset version` |
| `npm run release:prepare` | `private:false` on publishable packages |
| `npm run release:prepare -- --lock` | `private:true` again |
| `npm run release:publish-rc` | Publish both packages with `--tag rc` |
| `npm run release:publish-stable` | Publish both with `--tag latest` (DI-10 gate) |
| `npm run release:sbom` | CycloneDX under `temp/sbom/` |

## Never

- Publish without `RELEASE_CONFIRM=1`
- Publish without `RELEASE_LICENSE_REVIEWED=1` while packages remain `UNLICENSED`
- Invent an SPDX license to greenwash the publish gate
- Publish `examples/*`
- Commit npm tokens or `.npmrc` with `_authToken`

## Rollback

| Situation | Action |
| --- | --- |
| Bad RC | Publish fixed `0.1.0-rc.N+1` on tag `rc` |
| Accidental `latest` | `npm dist-tag add @softomnitel/omnicall-kit@<good> latest` (+ protocol) |
| Compromised partner access | Remove from npm org team / revoke token |

Full policy: `docs/guide/release-and-support.md`.
