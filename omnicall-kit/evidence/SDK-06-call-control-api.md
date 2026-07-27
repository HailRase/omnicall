# SDK-06 Evidence — Call Control API

**Date:** 2026-07-20  
**Status:** `done` (`/sdk-review` PASS 2026-07-20)  
**Feature:** F-011 remains `in progress` (not `implemented`)  
**Desktop DI-10:** still blocked on SDK-07…SDK-09 (SDK-06 alone does not unblock)

## Prerequisites verified

| Check | Result |
| --- | --- |
| SDK-00…SDK-05 | `done` |
| Desktop DI-06 | `done` (`omnicall-kit-integration/evidence/DI-06-call-command-router.md`) |
| Scope | `omnicall-kit/` only — no desktop `src/` product edits |

## Public API surface added

```ts
client.calls.originate / answer / reject / hangup / hold / resume / mute / unmute / sendDtmf
```

Each method: explicit `expectedRevision`, unique `requestId`, capability fail-closed,
typed `CallMutationResult | OmniCallClientError` (incl. `currentRevision` on `stale_state`).

No root-level `originate` / `hide`; no operator/account/activate; no hangup-on-disconnect.

## Command matrix

| Order | Wire command | Capability | Public method | Unit proof |
| --- | --- | --- | --- | --- |
| 1 | `call:originate` | `call.originate` | `calls.originate` | `originates with call.originate and expectedRevision` |
| 2 | `call:answer` | `call.control` | `calls.answer` | `answers and rejects with call.control` |
| 3 | `call:reject` | `call.control` | `calls.reject` | same |
| 4 | `call:hangup` | `call.control` | `calls.hangup` | `hangs up with call.control` |
| 5 | `call:hold` / `call:resume` | `call.control` | `calls.hold` / `resume` | `holds and resumes with call.control` |
| 6 | `call:mute` / `call:unmute` | `call.control` | `calls.mute` / `unmute` | `mutes and unmutes with call.control` |
| 7 | `call:send-dtmf` | `call.control` | `calls.sendDtmf` | `sends DTMF with call.control` |

## Desktop DI-06 mapping (citation only)

| Client command | Desktop path (DI-06) |
| --- | --- |
| `call:originate` | `ExternalSdkCallHandler` → `MakeCallUseCase` / Facade `makeCall`; owner = originator |
| `call:answer` | `AnswerCallUseCase`; answerer becomes owner |
| `call:reject` | `RejectCallUseCase` |
| `call:hangup` | `HangupCallUseCase`; owner required |
| `call:hold` / `call:resume` | Hold/Resume UC; owner required |
| `call:mute` / `call:unmute` | Mute/Unmute UC; owner required |
| `call:send-dtmf` | `SendDtmfUseCase`; owner required |

Oracle tests (read-only, cwd repo root): **17** passed  
(`LocalWsServerAdapter.call` **4** + `ExternalSdkCallHandler` **12** + `SdkCallOwnershipRegistry` **1**).

## Race / reconnect / disconnect proof

| Case | Expected | Test |
| --- | --- | --- |
| mutate before `ready` | `not_ready` | `fails closed on mutate before ready` |
| originate without `call.originate` | `forbidden`, no frame | `returns forbidden without call.originate` |
| hold without `call.control` | `forbidden`, no frame | `returns forbidden without call.control for hold` |
| server `stale_state` + `currentRevision` | typed fail, no auto-retry | `surfaces stale_state with currentRevision and does not auto-retry` |
| `conflict` / `not_owner` | typed fail | `surfaces conflict and not_owner typed failures` |
| timeout | `timeout` | `times out when call reply never arrives` |
| reconnect mid-flight | Promise rejects; **no** auto-resend on new socket | `rejects in-flight mutate on reconnect and never replays` |
| disconnect after originate | **no** hangup frame | `disconnect after successful originate does not send hangup` |
| privileged caps | still stripped; call caps allowed on `call_controller` | `allows call caps on call_controller and still strips privileged` |

SDK-05 regressions remain in `omnicall-client.test.ts` (snapshot revision-bind, window, sequence gap) — green in suite.

## Key files

| Area | Paths |
| --- | --- |
| Public | `packages/sdk/src/public/omnicall-client.ts` |
| Call path | `internal/call-wire.ts`, `internal/call-commands.ts`, `internal/product-orchestrator.ts` |
| Tests | `public/omnicall-client.calls.test.ts`, `tests/browser/omnicall-client-calls.browser.test.ts` |
| API gate | `scripts/api-check.mjs`, `etc/api/sdk.api.md` |

## Verification (exact counts)

Implementation session + independent `/sdk-review` 2026-07-20 (matched ±0):

```bash
# cwd: omnicall-kit
npx vitest run packages/sdk/src
# → Test Files 9 passed; Tests 67 passed (was 66; +1 malformed callId Low)

npm run test:types
# → Test Files 2 passed; Tests 5 passed

npm run lint          # PASS
npm run typecheck     # PASS
npm run api:check     # PASS (sdk 39 symbols; was 37; OmniCallCallsApi + CallMutationResult)
npm run package:check # PASS (no fake-transport / auth-test-peer in tarball)
OMNICALL_SDK_BROWSER=1 npm run test:browser
# → Test Files 4 passed; Tests 5 passed (was 4)
npm run preflight
# → PASS (workspace Tests 75; was 74)
```

Desktop oracle (optional, read-only):

```bash
# cwd: repo root
npx vitest run \
  src/adapters/integration/LocalWsServerAdapter.call.test.ts \
  src/application/integration/ExternalSdkCallHandler.test.ts \
  src/application/integration/SdkCallOwnershipRegistry.test.ts
# → Test Files 3 passed; Tests 17 passed
```

Reviewer: `/sdk-review` **PASS** — counts re-run independently; Low remediated same day (malformed callId → `invalid_payload`); post-fix sdk src **67**, workspace **75**.

## Checklist

| Cell | Result | Proof |
| --- | --- | --- |
| originate | **pass** | unit |
| answer/reject | **pass** | unit |
| hang up | **pass** | unit |
| hold/resume | **pass** | unit |
| mute/unmute | **pass** | unit |
| DTMF | **pass** | unit |
| conflict and stale-state errors | **pass** | unit |
| SDK disconnect leaves calls untouched | **pass** | unit + browser |
| reconnect does not replay call mutations | **pass** | unit |
| SDK-05 snapshot/window/auth regressions green | **pass** | suite + preflight |
| browser coverage for call path | **pass** | **5** browser tests |
| api-check / package-check updated | **pass** | 39 symbols; pack clean |

## Explicit non-goals held

- No SDK-07 operator/logout
- No `account.activate` / `window.hide`
- F-011 not marked `implemented`
- DI-10 still blocked on SDK-07…09
- No npm publish
- No desktop `src/` edits

## Residual risks

1. Packaged Electron E2E remains DI-10.
2. Multi-tab live races beyond fixture `stale_state` are desktop-owned.
3. Server-side ownership/idempotency remains DI-06; client only consumes replies.

## Reviewer Lows (remediated)

1. ~~No dedicated unit for malformed success reply missing `callId`~~ → added `fails closed when success reply omits callId` + `replyCallSuccessMalformed` (2026-07-20).
