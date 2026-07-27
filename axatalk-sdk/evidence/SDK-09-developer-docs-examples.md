# SDK-09 Evidence — Developer Documentation and Examples

**Date:** 2026-07-20  
**Status:** `done` (`/sdk-review` PASS 2026-07-20)  
**Feature:** F-011 remains `in progress` (not `implemented`)  
**Desktop DI-10:** still `blocked` (awaits explicit `/sdk-integration` DI-10 intake; not auto-started; no waiver)

> **Superseded note (2026-07-27):** Guides now document `client.window.hide` as
> product-available (privileged Origin matrix). “No window.hide as available” below
> describes SDK-09 gate day only.

## Prerequisites verified

| Check | Result |
| --- | --- |
| SDK-00…SDK-08 | `done` (SDK-08 closed at `4990c02` baseline; post-Low sdk src **106** / workspace **114**) |
| Desktop DI-08…DI-09 | `done` |
| DI-10 | still `blocked` — not edited into `in progress` / not waived |
| Scope | `axatalk-sdk/` + factual registry/evidence/work-history only — **no** desktop `src/` product edits |
| Public API | Documented existing surface only — `etc/api/sdk.api.md` remains **47** symbols |

## Explicit non-goals (held)

- No SDK-10 RC / SBOM / npm publish
- No F-011 `implemented`
- No DI-10 unblock / auto-start
- No new public methods / protocol commands
- No `window.hide` as available product API **on SDK-09 gate day**
  (**superseded 2026-07-27** — documented as available; see `guide/api-reference.md`)
- No invent `account:list-profiles`
- No teaching `requestedCapabilities: ['account.activate']` as a working pattern
- No raw credential login / SIP password / OCP apiKey APIs
- No mutation replay / disconnect hangup / logout / activate helpers
- No privilege-strip weakening

## Deliverables

### A. Documentation index

Canonical tree: `docs/guide/`

| Page | Path |
| --- | --- |
| Index | `docs/guide/README.md` |
| Security anti-patterns | `docs/guide/security-anti-patterns.md` |
| Capabilities | `docs/guide/capabilities.md` |
| Installation | `docs/guide/installation.md` |
| Pairing quick start | `docs/guide/pairing-quick-start.md` |
| API reference | `docs/guide/api-reference.md` |
| Events | `docs/guide/events.md` |
| Errors | `docs/guide/errors.md` |
| Reconnect / multi-tab | `docs/guide/reconnect-multi-tab.md` |
| Logout workflow | `docs/guide/logout-workflow.md` |
| Saved-profile activation | `docs/guide/saved-profile-activation.md` |
| Upgrade / deprecation | `docs/guide/upgrade-deprecation.md` |

Root `README.md` Start Here / Current Status points at the guide without claiming publish readiness.

### B. Example application (fake peer)

| Area | Path |
| --- | --- |
| Public CRM helpers | `examples/crm-pairing-lite/src/crm-app.ts`, `safe-error.ts` |
| Example README | `examples/crm-pairing-lite/README.md` |
| Fake-peer driver | `packages/sdk/src/docs/crm-pairing-lite-harness.ts`, `crm-pairing-lite-demo.ts` |

Demo proves: pairing → ready → snapshot; originate + local `forbidden` without `call.originate`;
`logout` `interaction_required`; activate only when peer **grants** `account.activate`;
`disconnect()` adds zero hangup / logout / activate frames.

### C. Tests that would fail on revert

| Test | Path |
| --- | --- |
| Example smoke + secret/privilege scan | `packages/sdk/src/docs/sdk-09-examples.test.ts` (**7**) |
| Example type alignment | `packages/sdk/src/docs/sdk-09-example-types.test-d.ts` (**1**) |
| Product sanitize link | same smoke file — `sanitizeRequestedCapabilities` still strips privileged caps |

### D. Tooling

| Script | Role |
| --- | --- |
| `npm run docs:check` | Guide presence + secret/privilege scan on examples + example `tsc` |
| `preflight` | Includes `docs:check` after `package:check` |
| `package:check` | Still excludes `fake-transport` / `auth-test-peer`; docs harness not packed (`files: ["dist",…]`) |

## Checklist (proven)

- [x] installation and support matrix
- [x] pairing quick start (secure defaults; no privileged request)
- [x] API, events, errors, and capabilities reference
- [x] reconnect and multi-tab guidance (no mutation replay)
- [x] logout workflow guide (cancel = abandon token)
- [x] security anti-patterns
- [x] upgrade/deprecation guide
- [x] example and documentation tests
- [x] privileged activate documented as server-grant-only
- [x] no localStorage/sessionStorage secret persistence in examples
- [x] tarball still excludes test peers

## Verification (exact counts — implementation session 2026-07-20)

From `axatalk-sdk/`:

| Command | Result |
| --- | --- |
| `npx vitest run packages/sdk/src` | **113** passed (12 files) — was **106**; **+7** SDK-09 docs/example tests |
| `npm run test:types` | **7** passed (3 files) — was **6**; **+1** example type test |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run api:check` | PASS — sdk **47** / protocol **169** (unchanged) |
| `npm run package:check` | PASS (no publish; fake-transport / auth-test-peer absent) |
| `AXATALK_SDK_BROWSER=1 npm run test:browser` | **7** passed (6 files) — unchanged |
| `npm run docs:check` | PASS |
| `npm run preflight` | PASS — workspace **121** passed (13 files) — was **114**; **+7** |

Desktop citation (read-only): DI-09 Settings grant UX for how operators elevate `account.activate`.

## Independent `/sdk-review` re-run (2026-07-20 23:44)

| Metric | Claimed | Reviewer | Δ |
| --- | --- | --- | --- |
| `npx vitest run packages/sdk/src` | **113** | **113** | 0 |
| workspace (`npm test` / preflight) | **121** | **121** | 0 |
| `npm run test:types` | **7** | **7** | 0 |
| `AXATALK_SDK_BROWSER=1 npm run test:browser` | **7** | **7** | 0 |
| `api:check` sdk / protocol | **47** / **169** | **47** / **169** | 0 |
| `npm run docs:check` | PASS | PASS | 0 |
| `npm run package:check` | PASS | PASS (no `fake-transport` / `auth-test-peer` / docs harness in tarball) | 0 |
| `npm run lint` / `typecheck` | PASS | PASS | 0 |
| `npm run preflight` | PASS | PASS | 0 |

**Security intuition test (quick start only):** PASS — cannot conclude activate/hide-at-pairing works, SIP password belongs in SDK calls, Web Storage for tokens, disconnect hangup/logout/activate, or undocumented APIs beyond `sdk.api.md`.

**Lows (remediated same day after review):**

1. `DemoReport.storageUsesWebStorage` now computed by `detectDemoWebStorageUsage` (memory `peek` + Web Storage key probe) — not hardcoded.
2. `docs/guide/api-reference.md` lists full **47**-symbol inventory parity-checked against `etc/api/sdk.api.md` (vitest + `docs:check`).

Post-Low verification (2026-07-20): sdk src **115** (+2), workspace **123** (+2), types **7**, browser **7**, api **47**/protocol **169**, docs:check PASS.

## Manual secret / privilege scan

- Guide quick start: no pairing-request of `account.activate` / `window.hide` / Web Storage /
  `sipPassword` (hide remains matrix-grant after ready — ADR-0013)
- Example `src/**/*.ts`: no `localStorage` / `sessionStorage` / credential property keys / privileged `requestedCapabilities`
- Activate docs: saved-account `login` + optional mode; grant via Origin matrix, never pairing request
- Anti-patterns page may mention forbidden words in prose tables (marked WRONG; not as working APIs)

## Remaining risks / handoff

- SDK-10 release candidate not started
- F-011 not `implemented`; DI-10 remains blocked until explicit intake
- Browser matrix still Chromium-only (unchanged incubation policy)
- Real desktop E2E deferred to DI-10

## Reviewer

`/sdk-review` **PASS** 2026-07-20 — SDK-09 → `done`. Do not mark F-011 `implemented`; do not auto-start DI-10; next `/sdk-project` **SDK-10 only**.
