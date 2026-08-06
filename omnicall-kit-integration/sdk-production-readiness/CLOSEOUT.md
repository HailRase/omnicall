# SDK Production-Readiness — WU-07 Closeout

- Purpose: closeout of corrective track WU-00…WU-07.
- Inputs: Acceptance §A–§G, PROGRESS, unit/integration preflight evidence, ADR-0027.
- Outputs: gate verdict; remaining human-only publish gates.

## Status

| Field | Value |
| --- | --- |
| Date | 2026-08-03 |
| Corrective scope WU-00…WU-07 | **done** |
| WU-07 closeout | **PASS** |
| Gate criteria | unit + integration + `release:preflight` / kit `preflight` only |
| Release cut / npm publish | Desktop **`1.3.1`** + kit **`0.2.0`** (authorized cut) |
| License invent / gate bypass | **not** performed (`UNLICENSED` retained; `RELEASE_LICENSE_REVIEWED=1` authorized for publish) |

## Acceptance §G

### Proven

- [x] Revision coordinator is sole aggregate mutation authority (WU-01/02).
- [x] Activation reservation without long-held consent/auth lock; late cancel cannot ghost-mutate.
- [x] Dedup Origin+clientId+requestId; pairing Origin+clientId + legacy migrate.
- [x] Inbound identity filtering before cache/sequence/resync/listeners.
- [x] Coherent snapshot under coordinator lock; native IPC sender authorization + negative tests.
- [x] SDK DX: `SDK_VERSION`, discovery helper, typed `waitUntil` / `AbortSignal`, protocol re-exports.
- [x] Fail-closed Origin upgrade (exact allowed HTTP(S) only).
- [x] Desktop `npm run release:preflight` — **3110 passed / 1 skipped** (2026-08-03).
- [x] OmniCall Kit `npm run preflight` — PASS.
- [x] `git diff --check` — PASS.

### Remaining (human publish only — not WU blockers)

- [x] Human license review authorization for publish while `UNLICENSED` (`RELEASE_LICENSE_REVIEWED=1`)
- [x] Human npm publish authorization + SemVer cut (`1.3.1` / kit `0.2.0`)

## Verification policy (agents)

- Required: focused unit/integration tests, desktop `release:preflight`, kit `preflight`.
- Do **not** run, require, or block on packaged Electron / Chromium / Edge / browser smoke for F-011 or this track.
- Historical DI-10 smoke scripts/reports are archival only.

## SemVer / release recommendation (humans only)

| Package | Current | Recommendation | Rationale |
| --- | --- | --- | --- |
| `@softomnitel/omnicall-kit` | `0.2.0` | **shipped MINOR** | additive DX + latest-known `getRevision()` |
| `@softomnitel/omnicall-protocol` | `0.1.0` | **no bump** | wire field names unchanged |
| OmniCall Desktop | `1.3.1` | **shipped PATCH** | coordinator/dedup/pairing/origin hardening |

## Docs alignment (post-closeout, no security downgrade)

Authoritative Origin admission: **fail-closed upgrade** (`allowed` only) — ADR-0018
amended 2026-08-03, `SECURITY.md`, kit README / guides, integration README Current
Status. Do **not** restore TOFU-on-upgrade without a new ADR.

## Independent review request

WU-07 content gate is **PASS**. Further `/sdk-review` optional before human publish cut.
