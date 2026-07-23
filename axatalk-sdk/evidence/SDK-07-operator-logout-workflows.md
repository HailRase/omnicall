# SDK-07 Evidence — Operator and Logout Workflows

**Date:** 2026-07-20 (contract refresh 2026-07-23 — single-shot logout)  
**Status:** `done` — `/sdk-review` **PASS**  
**Feature:** F-011 remains `in progress` (not `implemented`)  
**Desktop DI-10:** still blocked on remaining smoke / P12 close

## Prerequisites verified

| Check | Result |
| --- | --- |
| SDK-00…SDK-06 | `done` (SDK-06 review PASS) |
| Desktop DI-07 | `done` (`axatalk-sdk-integration/evidence/DI-07-operator-logout-workflow.md`) |
| Scope | `axatalk-sdk/` only — no desktop `src/` product edits in SDK unit |

## Public API surface

```ts
client.operator.getReasons()
client.operator.changeStatus({ target, reasonId?, expectedRevision })
client.operator.finishAppeal({ expectedRevision })
client.account.logout({ reasonId?, expectedRevision })
// → LogoutResult { loggedOut: true, revision }
```

- Typed failures via `AxatalkClientError` (incl. `details` for `interaction_required`, `currentRevision` on `stale_state`).
- Cancel logout = do not call `logout` / `disconnect()` — **no** invented `account:cancel-logout`, **no** `logoutToken`.
- No root-level mutations; no `account.activate` / `window.hide`; no campaign events; no OCP wire.
- Finish appeal only while public status is `post_call_processing`; wrong status → `conflict` + `failure_kind`.

## Command matrix + DI-07 citation

| Wire command | Cap | Public method | Desktop path (DI-07) |
| --- | --- | --- | --- |
| `operator:get-reasons` | `operator.status.write` | `operator.getReasons` | `ExternalSdkOperatorHandler` → projection DTO mapper (peek) |
| `operator:change-status` | `operator.status.write` | `operator.changeStatus` | → Facade `changeOcpStatusFromHost({ callType: "sdk" })` |
| `operator:finish-appeal` | `operator.status.write` | `operator.finishAppeal` | → Facade `finishOcpPostCallAppeal({ callType: "sdk" })` |
| `account:logout` | `session.logout` | `account.logout` | → `logoutAccountSession` / logout orchestration; may return `interaction_required` + `{ requiresReason, reasons }` |

## Race / SIP-only / interaction_required proof

| Case | Expected | Test |
| --- | --- | --- |
| getReasons typed list | success DTO | `getReasons returns typed reasons list` |
| SIP-only empty reasons + status | empty / `not_found` | `SIP-only getReasons empty and changeStatus not_found` |
| changeStatus + expectedRevision | success | `changeStatus succeeds with expectedRevision` |
| missing `operator.status.write` | `forbidden`, no frame | `returns forbidden without operator.status.write` |
| stale_state | typed + `currentRevision`, no retry | `surfaces stale_state with currentRevision and does not auto-retry` |
| malformed reasons reply | `invalid_payload` | `fails closed when getReasons reply omits reasons` |
| logout → interaction_required | typed fail + `requiresReason`; **no** `logoutToken` | `logout → interaction_required with requiresReason; never auto-retries` |
| SIP-only logout | `{ loggedOut: true }` | `SIP-only logout succeeds without reasonId` |
| logout with reasonId | success | `logout with reasonId succeeds` |
| missing `session.logout` | `forbidden`, no frame | `returns forbidden without session.logout` |
| malformed logout success | `invalid_payload` | `fails closed when logout success omits loggedOut` |
| timeout | `timeout` | `times out when logout reply never arrives` |
| before ready | `not_ready` | `fails closed on mutate before ready` |
| reconnect mid change-status | reject; **no** auto-resend | `rejects in-flight change-status on reconnect and never replays` |
| reconnect mid logout | reject; **no** auto-resend | `rejects in-flight logout on reconnect and never replays` |
| disconnect after getReasons | **no** logout / hangup | `disconnect after getReasons does not send logout or hangup` |
| SDK-06 hangup regression | no hangup on disconnect | `SDK-06 regression: disconnect after originate still sends no hangup` |
| privacy diagnostics | no secret needles / destinations | `privacy: diagnostics never echo secret needles / destinations` |
| presentation escalate | caps stripped | `allows operator/logout caps on operator and call_controller…` |
| events | protocol names only | `subscribes to operator:status-changed without Domain names` |
| browser | getReasons + interaction_required; no storage; disconnect does not extra-logout | `browser AxatalkClient operator getReasons + logout…` |

## Key files

| Area | Paths |
| --- | --- |
| Public | `packages/sdk/src/public/axatalk-client.ts`, `axatalk-client-api.ts` |
| Operator path | `internal/operator-wire.ts`, `internal/operator-commands.ts` |
| Logout path | `internal/account-logout-wire.ts`, `internal/account-logout-commands.ts` |
| Orchestration | `internal/product-orchestrator.ts`, `internal/window-commands.ts` |
| Errors | `internal/client-errors.ts` (`details`), `internal/product-commands.ts` |
| Tests | `public/axatalk-client.operator.test.ts`, `tests/browser/axatalk-client-operator.browser.test.ts` |
| API gate | `scripts/api-check.mjs`, `etc/api/sdk.api.md` |

## Checklist truth table

| Cell | Result | Proof |
| --- | --- | --- |
| operator state and reasons | **pass** | unit + events + snapshot already redacted |
| status change | **pass** | unit (caps / stale / not_found / success) |
| single-shot logout | **pass** | unit + browser |
| interaction-required result | **pass** | typed error + `requiresReason` / reasons; no token |
| cancel logout | **pass** | abandon / disconnect (no auto-logout) |
| SIP-only behavior | **pass** | empty reasons; status not_found; logout without reasonId |
| OCP reason and recovery tests | **pass** | client consumes typed replies only; no OCP wire in SDK |
| reconnect does not replay mutations | **pass** | change-status + logout |
| SDK disconnect does not logout / tear SIP | **pass** | no logout / no hangup |
| SDK-05/SDK-06 regressions green | **pass** | suite + explicit hangup regression |
| browser coverage | **pass** | Chromium operator+logout path |
| api-check / package-check | **pass** | LogoutResult; tarball clean |

## Residual risks

- Packaged E2E / hostile matrix deferred to DI-10.
- Campaign events remain out of v1 (ADR-0017 O-CAMP-1).
- Consumer must handle `interaction_required` explicitly (no auto-logout by design).

## Explicit non-goals held

- No prepare/confirm / `logoutToken`
- No `window.hide` / tray policy
- No campaign offered/cleared
- No OCP wire / apiKey in SDK
- No npm publish; F-011 not `implemented`
- No auto-retry on `stale_state` / `interaction_required`
- No logout on `disconnect()`
- No root-level operator/account mutations

## Reviewer

`/sdk-review` **PASS** 2026-07-20 (original). Contract refresh 2026-07-23 aligns tests/docs with single-shot `account:logout`.
