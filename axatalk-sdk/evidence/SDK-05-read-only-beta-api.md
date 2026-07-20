# SDK-05 Evidence — Read-Only Beta API (`AxatalkClient`)

**Date:** 2026-07-20  
**Status:** `done` — `/sdk-review` **PASS** (re-gate after FAIL refactor)  
**Feature:** F-011 remains `in progress` (not `implemented`)  
**Desktop DI-10:** still blocked on SDK-06…SDK-09 (SDK-05 alone does not unblock)

## Prerequisites verified

| Check | Result |
| --- | --- |
| SDK-00…SDK-04 | `done` |
| Desktop DI-05 | `done` (oracle evidence retained) |
| Scope | `axatalk-sdk/` only — no desktop `src/` product edits for this unit |

## FAIL remediations (verified closed)

| Finding | Fix | Proof |
| --- | --- | --- |
| **Blocker** — `invalidate()` dropped waiters without reject | `rejectAllAcquisitions` on invalidate/dispose; typed `not_ready` / `revoked` | `rejects in-flight getSnapshot on disconnect after reply-only` |
| **High** — OK reply returned unbound stale cache | Success only when `cache.revision === reply.revision`; else wait revision-bound or timeout | `does not resolve stale cache when reply revision mismatches`; `resolves when matching snapshot arrives after reply-only` |
| **Low** — `visible` defaulted `true` | `readWindowState` throws `invalid_payload` if not boolean | `fails closed when window getState visible is not boolean` |
| **Low** — pre-ready `window.show` coverage | unit added | `fails closed on window.show before ready` |

Helpers (test-only, not in npm tarball): `replyToGetSnapshotReplyOnly`, `replyToGetSnapshotWithMismatch`, `replyToWindowGetStateMalformed`.

## Deliverables

1. **`createAxatalkClient`** — side-effect-free factory (no connect/pair/auth/snapshot).
2. **Lifecycle** — connect / disconnect / getState / waitUntil / pairing callbacks (composed with SDK-04 auth).
3. **`getSnapshot` / cache** — revision-bound dual-message; auto-fetch on `ready` (Promise always settles).
4. **Typed `subscribe`** — public anti-corruption events; unsubscribe.
5. **Sequence gap resync** — gap diagnostic + automatic `getSnapshot`.
6. **Reconnect** — cache/sequence cleared; pending acquisitions rejected; fresh snapshot after re-auth.
7. **`window.show` / `window.getState`** — capability-gated; no `window.hide`; malformed `visible` fail-closed.
8. **Fail-closed** — pre-ready → `not_ready`; missing caps → `forbidden`.
9. **API** — **37** symbols; mutations forbidden.
10. **Browser** — Chromium constructor + snapshot path.

## Key files

| Area | Paths |
| --- | --- |
| Public | `packages/sdk/src/public/axatalk-client.ts` |
| Product | `internal/product-orchestrator.ts`, `snapshot-acquisition.ts`, `product-commands.ts` |
| Tests | `public/axatalk-client.test.ts`, `axatalk-client.fixtures.test.ts`, `tests/browser/axatalk-client.browser.test.ts` |
| Test peers | `internal/auth-test-peer.ts` (excluded from pack) |

## Checklist (reviewer re-score)

| Cell | Result | Proof |
| --- | --- | --- |
| side-effect-free constructor | **pass** | unit + browser |
| connect/disconnect/getSnapshot | **pass** | DI-05 order + hang/stale adversarial |
| typed subscription and unsubscribe | **pass** | unit |
| redacted event map | **pass** | fixture needles |
| sequence gap resync | **pass** | unit |
| reconnect snapshot replacement | **pass** | unit |
| window show capability | **pass** | grant + forbidden |
| browser tests | **pass** | **4** |
| invalidate/disconnect rejects in-flight getSnapshot | **pass** | reply-only + disconnect → `not_ready` |
| mismatched/missing snapshot revision never stale success | **pass** | mismatch → `timeout`; late match → resolve R |

## Independent verification (reviewer re-gate 2026-07-20)

```bash
# cwd: axatalk-sdk
npx vitest run packages/sdk/src
# → Test Files 8 passed; Tests 51 passed

npm run test:types
# → Test Files 2 passed; Tests 5 passed

npm run lint          # PASS
npm run typecheck     # PASS
npm run api:check     # PASS (sdk 37 symbols, createAxatalkClient present)
npm run package:check # PASS (no fake-transport / auth-test-peer in tarball)
AXATALK_SDK_BROWSER=1 npm run test:browser
# → Test Files 3 passed; Tests 4 passed
npm run preflight     # PASS (workspace Tests 59)

# optional desktop oracle (repo root)
npx vitest run \
  src/adapters/integration/LocalWsServerAdapter.product.test.ts \
  src/application/integration/ExternalSdkSnapshotAssembler.test.ts \
  src/application/integration/ExternalSdkEventMapper.test.ts \
  src/application/integration/sdkPrivacyRedaction.test.ts
# → Test Files 4 passed; Tests 13 passed
```

Auth regression: `auth-client.test.ts` green inside `packages/sdk/src` suite (SDK-04 retained).  
Counts match implementer evidence (honesty OK).

## Interop vs DI-05

| Desktop oracle | Client coverage | Status |
| --- | --- | --- |
| Redacted snapshot sections | Protocol fixtures + needle tests | pass |
| Per-client events + sequence | Subscribe + gap resync | pass |
| `sdk:get-snapshot` dual message | revision-bound + DI-05 order | pass |
| `window:show` + visibility event | unit path | pass |
| `window:hide` denied | not exported on client | pass |

Oracle evidence: `axatalk-sdk-integration/evidence/DI-05-read-only-snapshot-events-window-show.md`

## Explicit non-goals (held)

- call/*, operator write, logout, account.activate
- `window.hide` product success path
- npm publish
- F-011 `implemented`
- DI-10 unblock
- SDK-06 not started in review session

## Reviewer

- `/sdk-review` **PASS** 2026-07-20 (re-gate) — zero Blockers; prior FAIL remediations proven by adversarial tests + independent command re-run
