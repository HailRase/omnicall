# SDK-08 Evidence — Saved-Profile Activation

**Date:** 2026-07-20  
**Status:** `done` (`/sdk-review` **PASS** 2026-07-20)  
**Feature:** F-011 remains `in progress` (not `implemented`)  
**Desktop DI-10:** still blocked on SDK-09 (SDK-08 closed)

## Prerequisites verified

| Check | Result |
| --- | --- |
| SDK-00…SDK-07 | `done` (SDK-07 review PASS) |
| Desktop DI-08 | `done` (`axatalk-sdk-integration/evidence/DI-08-saved-profile-activation.md`) |
| DI-10 | still `blocked` (SDK-09 open; no waiver) |
| Privileged security | ADR-0013 §B + ADR-0016 + ADR-AF-003/005/006 Accepted |
| Scope | `axatalk-sdk/` only — no desktop `src/` product edits for this unit |

## Explicit non-goals (held)

- No SDK-09 docs ship
- No npm publish
- No F-011 `implemented`
- No `window.hide`
- No raw credential login / password / apiKey activate APIs
- No desktop `src/` edits
- No campaign events
- No invent `account:list-profiles` (v1 has none; consumer supplies the saved-account `login`)

## Public API surface added

```ts
client.account.activateProfile({
  login: string;           // saved-account login
  expectedRevision: number;
  mode?: 'sip_only' | 'ocp';
}): Promise<{
  activated: true;
  mode: string;            // narrowly validated (e.g. sip_only / ocp)
  profileLabel?: string;   // optional redacted label
  alreadyAuthenticated?: boolean;
  revision: number;
}>
```

- Namespaced only — no root `activateProfile`.
- Typed failures via `AxatalkClientError` (`forbidden`, `not_ready`, `timeout`, `stale_state`+`currentRevision`, `conflict`, `not_found`, `invalid_payload`).
- `sanitizeRequestedCapabilities` still strips `account.activate` / `window.hide` always.
- Activation works only when the **server has granted** `account.activate` (desktop grant/TTL is desktop-owned).

## Command matrix + DI-08 citation

| Wire command | Cap | Public method | Desktop path (DI-08) |
| --- | --- | --- | --- |
| `account:activate-profile` | privileged `account.activate` (never pairing-default) | `account.activateProfile` | grant TTL → cap elevate → `ExternalSdkAccountHandler` → Facade `signInAccount` saved profile |

Desktop oracle (read-only, cwd repo root): **9** passed  
(`sdkAccountActivateGrantStore` **3** + `ExternalSdkAccountHandler` **6**). Full DI-08 set cited as **140** in DI-08 evidence.

## Race / privilege / secret proofs

| Case | Expected | Test |
| --- | --- | --- |
| Happy path | typed `{ activated, mode, revision, profileLabel?, alreadyAuthenticated? }` | `activateProfile succeeds with login, mode, and expectedRevision` |
| Missing cap | `forbidden`, no frame | `returns forbidden without account.activate (no frame)` |
| Pre-ready | `not_ready` | `fails closed on activate before ready` |
| Active session / logout-first | typed `conflict`, no auto-retry | `surfaces conflict when desktop rejects active session` |
| Stale revision | `stale_state` + `currentRevision`, no auto-retry | `surfaces stale_state with currentRevision and does not auto-retry` |
| Unknown login | typed `not_found` | `unknown login fails typed` |
| Malformed success | `invalid_payload` | `fails closed when activate success omits activated` |
| Secret-looking result keys | `invalid_payload` (`token`) | `fails closed when activate success includes secret-looking keys` |
| Forbidden wire secret keys | reply dropped → `timeout` | `ignores wire activate success that embeds forbidden secret keys` |
| Timeout | `timeout` | `times out when activate reply never arrives` |
| Cap revoke mid-session | subsequent `forbidden`, no frame | `subsequent activate forbidden after grant stripped via permission-changed` |
| Reconnect mid-flight | reject typed; **zero** auto-resend | `rejects in-flight activate-profile on reconnect and never replays` |
| Disconnect mid-flight | reject typed; no hangup / confirm-logout; no extra activate | `rejects in-flight activate-profile on disconnect and never tears SIP` |
| Disconnect after ready | **no** activate / hangup / confirm-logout | `disconnect never sends activate-profile or tears SIP` |
| Privilege strip regression | sanitize still strips activate/hide | `sanitize still strips account.activate and window.hide always` |
| Secret hygiene | diagnostics never echo needles / login | `privacy: diagnostics never echo secrets / login` |
| Events | protocol name only | `subscribes to account:session-activated by protocol name only` |
| SDK-07 regression | `interaction_required` honesty | `SDK-07 regression: prepareLogout interaction_required still green` |
| Browser | activate success; strip at pairing; no storage leak; disconnect non-activate | `browser AxatalkClient activateProfile success…` |

## Checklist (proven)

- [x] saved-account login DTO (`login` + optional mode + typed result)
- [x] privileged capability gate (`account.activate` granted-only; sanitize still strips request)
- [x] active-session `conflict` (logout-first) typed, no auto-retry
- [x] revoke/expiry → subsequent activate `forbidden` (client observes grant loss via `permission-changed`)
- [x] no secret fields in API report, fixtures, logs, or examples
- [x] reconnect non-replay + disconnect non-activate / non-SIP-tear
- [x] SDK-05…07 regressions green (full sdk src suite)
- [x] browser coverage (minimal)
- [x] api-check / package-check updated
- [x] evidence path + WORK-UNITS → `done` (`/sdk-review` PASS)

## Key files

| Area | Paths |
| --- | --- |
| Public | `packages/sdk/src/public/axatalk-client.ts`, `axatalk-client-api.ts` |
| Activate path | `internal/account-activate-wire.ts`, `internal/account-activate-commands.ts` |
| Orchestration | `internal/product-orchestrator.ts` |
| Tests | `public/axatalk-client.activate.test.ts`, `tests/browser/axatalk-client-activate.browser.test.ts` |
| API gate | `scripts/api-check.mjs`, `etc/api/sdk.api.md` |

## Secret scan

- `etc/api/sdk.api.md`: no `password` / `apiKey` / `sipPassword` fields (`api:check` enforces)
- Public activate params: `login` + `expectedRevision` + optional `mode` (type tests)
- Package tarball: `package:check` PASS; fake-transport / auth-test-peer remain excluded from pack
- Diagnostics tests assert no secret needles / login echo

## Verification (exact counts — implementation session 2026-07-20)

From `axatalk-sdk/`:

| Command | Result |
| --- | --- |
| `npx vitest run packages/sdk/src` | **105** passed (11 files) |
| `npm run test:types` | **6** passed (2 files) |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run api:check` | PASS — sdk surface **47** symbols (+`ActivateProfileResult`); protocol **169** |
| `npm run package:check` | PASS (no publish) |
| `AXATALK_SDK_BROWSER=1 npm run test:browser` | **7** passed (6 files) |
| `npm run preflight` | PASS — workspace **113** passed (12 files) |

Desktop oracle (optional, read-only): **9** passed.

## Independent `/sdk-review` re-run (2026-07-20)

| Command | Claimed | Reviewer | Δ |
| --- | --- | --- | --- |
| `npx vitest run packages/sdk/src` | 105 | **105** | ±0 |
| `npm run test:types` | 6 | **6** | ±0 |
| `AXATALK_SDK_BROWSER=1 npm run test:browser` | 7 | **7** | ±0 |
| `npm run preflight` (workspace) | 113 | **113** | ±0 |
| `npm run api:check` sdk / protocol | 47 / 169 | **47 / 169** | ±0 |
| Desktop oracle (grant store + account handler) | 9 | **9** | ±0 |
| `npm run lint` / `typecheck` / `package:check` | PASS | PASS | — |

## Post-review Low remediation (same day)

Low: missing explicit `disconnect()` while `activateProfile` in-flight.

Fix: `rejects in-flight activate-profile on disconnect and never tears SIP` — typed reject; activate count stays **1**; zero hangup / confirm-logout; state `closed`.

Post-fix counts: sdk src **106**, workspace test suite **114**.

## Remaining risks / handoff

- Settings grant UX is desktop DI-09 (`done`); SDK only consumes granted caps.
- SDK-09 docs/examples not started.
- F-011 not `implemented`; DI-10 remains blocked until SDK-09 is `done` (or waiver).
- Security review: **PASS** — zero Blockers.

## Reviewer

`/sdk-review` **PASS** 2026-07-20 — privilege fortress, secret non-exfil, non-replay, disconnect non-tear verified; next `/sdk-project` **SDK-09 only**. Do not mark F-011 `implemented`; do not unblock DI-10.
