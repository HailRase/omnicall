# SDK-03 — Transport and connection state machine evidence

**Date:** 2026-07-20  
**Status:** `done` (`/sdk-review` PASS 2026-07-20)  
**Prerequisites:** SDK-02 `done` (`/sdk-review` PASS). DI-01 is a peer track (does not block SDK-03).

## Scope delivered

Internal-only implementation inside `@axata/axatalk-sdk` (`packages/sdk/src/internal/`):

1. Injectable `TransportPort` abstraction (`transport-port.ts`).
2. Deterministic `FakeTransport` + controller for tests (no real WebSocket).
3. Explicit connection state machine per ARCHITECTURE.md with legal-transition table.
4. Request correlation, timeouts, abort/disconnect cleanup (`request-correlator.ts`).
5. Heartbeat (`sdk:ping`) + bounded jittered reconnect; pending requests rejected on drop.
6. Mutation send counter (no payload retention) proves non-idempotent commands are never silently replayed.
7. Redaction-safe diagnostics sink (allowlisted fields only; no payloads/secrets/PII).
8. Fake scheduler with async advance for Promise-based timer completion; leak assertions.

Explicit non-goals respected:

- No `AxatalkClient` product methods (calls/account/operator/window).
- No real discovery/WebSocket to Electron.
- No PoP crypto / IndexedDB pairing (SDK-04).
- No desktop DI / IPC / gateway / `src/` product changes.
- No npm publish.
- Wire schemas unchanged (consume `@axata/axatalk-protocol` only).

## Public API

`packages/sdk/src/index.ts` still `export {}`.

`api:check` — `@axata/axatalk-sdk` has **no** public production symbols; `@axata/axatalk-protocol` unchanged (no `AxatalkClient`).

## Connection states

```text
idle → connecting → handshaking → pairing_required | authenticating → ready
  → reconnecting → connecting… | ready | incompatible | revoked | failed → closed
```

Terminal: `incompatible`, `revoked`, `failed`, `closed`.

## Security / reliability

- Diagnostics allowlist: level, code, connectionState, requestId, commandType, durationMs, result, errorCode, attempt.
- Forbidden diagnostic keys rejected; tests assert phone/token needles never appear.
- Reconnect: max attempts, exponential backoff, jitter ratio, cancellable via `disconnect()`.
- On transport drop / disconnect / abort: pending requests fail with stable codes; bodies are not resent.
- Heartbeat miss closes transport → reconnect path (not silent continue).

## Tests

| Suite | File | Coverage |
| --- | --- | --- |
| State machine | `connection-state.test.ts` | legal/illegal transitions, terminals |
| Session | `connection-session.test.ts` | lifecycle, correlation, timeout, abort, disconnect cleanup, reconnect budget, mutation non-replay, heartbeat miss, diagnostics redaction, listener/timer leak proofs |
| Smoke | `index.test.ts` / `index.test-d.ts` | empty public surface |

## Verification commands (cwd `axatalk-sdk/`)

```bash
npx vitest run packages/sdk/src
npm run lint
npm run preflight
```

Results (2026-07-20):

| Command | Result |
| --- | --- |
| `npx vitest run packages/sdk/src` | PASS (18) |
| full `npm run test` (workspace) | PASS (26) |
| `npm run test:types` | PASS (4) |
| `npm run lint` | PASS |
| `npm run preflight` | **PASS** (api:check empty sdk surface; package:check; no publish) |

## Desktop integration dependency

None for SDK-03. Real gateway / discovery remains DI-* / SDK-04+.

## Remaining risks

- Heartbeat outbound `sdk:ping` uses placeholder `serverInstanceId`/`sessionEpoch` until SDK-04 binds session metadata after auth.
- Auth/pairing signals are test-driven (`signal*`); protocol crypto arrives in SDK-04.
- Real browser WebSocket adapter not implemented (intentional).

## Reviewer

`/sdk-review` **PASS** 2026-07-20 — independent verification from `axatalk-sdk/`:

| Command | Result |
| --- | --- |
| `npx vitest run packages/sdk/src` | PASS (18) |
| `npm run test` | PASS (26) |
| `npm run test:types` | PASS (4) |
| `npm run lint` | PASS |
| `npm run api:check` | PASS (empty sdk surface) |
| `npm run preflight` | PASS |

Post-review Low fixes (2026-07-20):

- `FakeTransport` / `test-helpers` excluded from sdk `tsconfig` build and forbidden in `package:check` tarball.
- Mutation ledger is a payload-free send counter (`mutationSendCount`); correlator no longer retains command bodies.
- DI-01 peer-track wording corrected (does not block SDK-03).
