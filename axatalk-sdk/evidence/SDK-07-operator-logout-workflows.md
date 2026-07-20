# SDK-07 Evidence — Operator and Logout Workflows

**Date:** 2026-07-20  
**Status:** `done` — `/sdk-review` **PASS**  
**Feature:** F-011 remains `in progress` (not `implemented`)  
**Desktop DI-10:** still blocked on SDK-08…SDK-09

## Prerequisites verified

| Check | Result |
| --- | --- |
| SDK-00…SDK-06 | `done` (SDK-06 review PASS) |
| Desktop DI-07 | `done` (`axatalk-sdk-integration/evidence/DI-07-operator-logout-workflow.md`) |
| Scope | `axatalk-sdk/` only — no desktop `src/` product edits |

## Public API surface added

```ts
client.operator.getReasons()
client.operator.changeStatus({ target, reasonId?, expectedRevision })
client.account.prepareLogout({ expectedRevision })
client.account.confirmLogout({ logoutToken, reasonId?, expectedRevision })
```

- Typed failures via `AxatalkClientError` (incl. `details` for `interaction_required`, `currentRevision` on `stale_state`).
- Cancel logout = abandon token / `disconnect()` — **no** invented `account:cancel-logout`.
- No root-level mutations; no `account.activate` / `window.hide`; no campaign events; no OCP wire.

## Command matrix + DI-07 citation

| Wire command | Cap | Public method | Desktop path (DI-07) |
| --- | --- | --- | --- |
| `operator:get-reasons` | `operator.status.write` | `operator.getReasons` | `ExternalSdkOperatorHandler` → projection DTO mapper (peek) |
| `operator:change-status` | `operator.status.write` | `operator.changeStatus` | → Facade `changeOcpStatusFromHost({ callType: "sdk" })` |
| `account:prepare-logout` | `session.logout` | `account.prepareLogout` | pending logoutToken; may return `interaction_required` |
| `account:confirm-logout` | `session.logout` | `account.confirmLogout` | → `logoutAccountSession` / logout orchestration |

Desktop oracle (read-only, cwd repo root): **33** passed  
(`LocalWsServerAdapter.operator` **11** + `ExternalSdkOperatorHandler` **17** + `createSdkOperatorPortFromFacade` **2** + `mapSdkOperatorReasons` **3**).

## Race / SIP-only / interaction_required proof

| Case | Expected | Test |
| --- | --- | --- |
| getReasons typed list | success DTO | `getReasons returns typed reasons list` |
| SIP-only empty reasons + status | empty / `not_found` | `SIP-only getReasons empty and changeStatus not_found` |
| changeStatus + expectedRevision | success | `changeStatus succeeds with expectedRevision` |
| missing `operator.status.write` | `forbidden`, no frame | `returns forbidden without operator.status.write` |
| stale_state | typed + `currentRevision`, no retry | `surfaces stale_state with currentRevision and does not auto-retry` |
| malformed reasons reply | `invalid_payload` | `fails closed when getReasons reply omits reasons` |
| prepare → interaction_required | typed fail + details; **zero** confirm | `prepare → interaction_required with details; never auto-confirm` |
| SIP-only prepare → confirm | token then loggedOut | `SIP-only prepare returns token; confirm succeeds` |
| confirm unknown token | `not_found` | `confirm with stale/unknown token fails typed` |
| missing `session.logout` | `forbidden`, no frame | `returns forbidden without session.logout` |
| malformed prepare success | `invalid_payload` (no invented token) | `fails closed when prepare success omits logoutToken` |
| timeout | `timeout` | `times out when logout reply never arrives` |
| before ready | `not_ready` | `fails closed on mutate before ready` |
| reconnect mid change-status | reject; **no** auto-resend | `rejects in-flight change-status on reconnect and never replays` |
| reconnect mid confirm | reject; **no** auto-resend | `rejects in-flight confirm-logout on reconnect and never replays` |
| disconnect after prepare | **no** confirm-logout / hangup | `disconnect after prepare does not confirm logout or hangup` |
| SDK-06 hangup regression | no hangup on disconnect | `SDK-06 regression: disconnect after originate still sends no hangup` |
| privacy diagnostics | no token / destination needles | `privacy: diagnostics never echo logoutToken / destinations` |
| presentation escalate | caps stripped | `allows operator/logout caps on operator and call_controller…` |
| events | protocol names only | `subscribes to operator:status-changed without Domain names` |
| browser | getReasons + interaction_required; no storage; no confirm on disconnect | `browser AxatalkClient operator getReasons + prepareLogout…` |

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

## Verification (exact counts — independent re-run 2026-07-20)

```bash
# cwd: axatalk-sdk
npx vitest run packages/sdk/src
# → Test Files 10 passed; Tests 87 passed (was 67; +20 operator/logout)

npm run test:types
# → Test Files 2 passed; Tests 6 passed (was 5; +1 namespace type smoke)

npm run lint          # PASS
npm run typecheck     # PASS
npm run api:check     # PASS (sdk 46 symbols; was 39)
npm run package:check # PASS (no fake-transport / auth-test-peer in tarball)
AXATALK_SDK_BROWSER=1 npm run test:browser
# → Test Files 5 passed; Tests 6 passed (was 5)
npm run preflight
# → PASS (workspace Tests 95; was 75)
```

Desktop oracle (optional, read-only):

```bash
# cwd: repo root
npx vitest run \
  src/adapters/integration/LocalWsServerAdapter.operator.test.ts \
  src/application/integration/ExternalSdkOperatorHandler.test.ts \
  src/application/integration/createSdkOperatorPortFromFacade.test.ts \
  src/application/integration/mapSdkOperatorReasons.test.ts
# → Test Files 4 passed; Tests 33 passed
```

## Checklist truth table

| Cell | Result | Proof |
| --- | --- | --- |
| operator state and reasons | **pass** | unit + events + snapshot already redacted |
| status change | **pass** | unit (caps / stale / not_found / success) |
| prepare logout | **pass** | unit + browser |
| interaction-required result | **pass** | typed error + details; zero auto-confirm |
| confirm/cancel logout | **pass** | confirm command + abandon/disconnect cancel |
| SIP-only behavior | **pass** | empty reasons; status not_found; prepare token |
| OCP reason and recovery tests | **pass** | client consumes typed replies only; no OCP wire in SDK |
| reconnect does not replay mutations | **pass** | change-status + confirm-logout |
| SDK disconnect does not logout / tear SIP | **pass** | no confirm / no hangup |
| SDK-05/SDK-06 regressions green | **pass** | suite + explicit hangup regression |
| browser coverage | **pass** | Chromium operator+logout path |
| api-check / package-check | **pass** | 46 symbols; tarball clean |

## Residual risks

- Packaged E2E / hostile matrix deferred to DI-10 (still blocked until SDK-08…09).
- SDK-08 activate-profile not started.
- Campaign events remain out of v1 (ADR-0017 O-CAMP-1).
- Consumer must handle `interaction_required` explicitly (no auto-confirm by design).

## Explicit non-goals held

- No SDK-08 `account:activate-profile`
- No `window.hide` / tray policy
- No campaign offered/cleared
- No OCP wire / apiKey in SDK
- No desktop `src/` edits
- No npm publish; F-011 not `implemented`; DI-10 not unblocked
- No auto-retry on `stale_state` / `interaction_required`
- No confirm-logout on `disconnect()`
- No root-level operator/account mutations

## Reviewer

`/sdk-review` **PASS** 2026-07-20 — zero Blockers. Low remediated same-day: dedicated `surfaces conflict on changeStatus and does not auto-retry` added (operator suite **21**).

Independent verification (reviewer re-run + Low fix):

```text
npx vitest run packages/sdk/src → Tests 88 (was 87; +1 conflict)
npm run preflight → workspace Tests 96
test:types → 6
browser (AXATALK_SDK_BROWSER=1) → 6
api:check → 46 symbols
desktop oracle → 33
```

F-011: still `in progress`  
DI-10: still blocked on SDK-08…09  
Next: `/sdk-project` SDK-08 only — not started
