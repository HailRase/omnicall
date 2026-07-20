# SDK-04 — Pairing, Authentication, and Capabilities

**Date:** 2026-07-20  
**Status:** `done`  
**Prerequisites:** SDK-00…SDK-03 `done`; desktop DI-04 `done`

## Scope delivered

Browser-side fail-closed auth client in `@axatalk/sdk`:

1. Handshake negotiation → `pairing_required` | `authenticating` | `incompatible`
2. Pairing ceremony (`pairing:request` → pending → approved|denied) + consumer callback
3. Web Crypto ECDSA P-256 PoP (IEEE-P1363) + IndexedDB / memory key store (never local/session storage)
4. Server-authoritative capability projection (`getGrantedCapabilities` / `sdk:permission-changed`)
5. Revoke / stale-instance / challenge replay fail-closed; reconnect clears grants until re-auth
6. Pre-auth snapshot/product events dropped; no product `AxatalkClient` methods

## Checklist matrix

| Cell | Result | Notes |
| --- | --- | --- |
| version negotiation | **pass** | `selectedProtocolVersion` out of range → `incompatible` (schema `incompatible_version` mapped) |
| challenge-response flow | **pass** | authChallenge → ECDSA sign → `sdk:auth-proof` → confirm via `sdk:ping` → `ready` |
| pairing-required state and callback | **pass** | `onPairingRequired` + state `pairing_required`; deny → `failed` |
| capability projection | **pass** | grants from `pairing:approved` / `permission-changed` only; privileged caps stripped client-side |
| revoke and stale-instance handling | **pass** | `sdk:revoked` clears key store → `revoked`; new `serverInstanceId` clears session grants |
| replay tests | **pass** | reused `challengeId` on same instance → `failed` |
| no pre-auth snapshot/events | **pass** | snapshot before ready increments `preauthDropCount`; no grants |
| interoperability tests pass | **pass** | Web Crypto sign ↔ Node `ieee-p1363` verify (desktop `sdkGatewayPopCrypto` semantics) |

## Public API delta

`packages/sdk/src/index.ts` now exports auth lifecycle (28 API Extractor symbols), including:

- `createAuthClient`, `AuthClient`, `AuthClientOptions`, `AuthSessionSnapshot`, `PairingRequiredInfo`
- `CONNECTION_STATES` / `ConnectionState`
- `createMemoryPopKeyStore` / `createIndexedDbPopKeyStore` / `PopKeyStore`
- injectable scheduler/diagnostics/transport **types** + fake scheduler helpers

**Not exported:** `AxatalkClient`, `getSnapshot`, call/operator/account/window product methods.

`api:check` allowlist enforced in `scripts/api-check.mjs`.

## PoP interop vector

- Canonical string: `buildPopSigningPayload` from `@axatalk/protocol` (ADR-0016)
- Signature encoding: Web Crypto ECDSA-P256-SHA256 → IEEE-P1363 base64url
- Oracle: Node `crypto.verify(..., { dsaEncoding: 'ieee-p1363' })` in `packages/sdk/src/internal/pop-crypto.test.ts`
- Desktop peer (read-only confirmation): `src/adapters/integration/sdkGatewayPopCrypto.test.ts` + `LocalWsServerAdapter.auth.test.ts` → **11 passed**

## Key files

- `packages/sdk/src/public/auth-client.ts`
- `packages/sdk/src/internal/auth-orchestrator.ts`
- `packages/sdk/src/internal/auth-inbound.ts`
- `packages/sdk/src/internal/pop-crypto.ts`
- `packages/sdk/src/internal/pop-key-store.ts`
- `packages/sdk/src/internal/connection-session.ts` (unhandled message hook, reauth, auth-phase ping)
- Tests: `packages/sdk/src/public/auth-client.test.ts`, `packages/sdk/src/internal/pop-crypto.test.ts`
- Browser scaffold: `tests/browser/pop-crypto.browser.test.ts` (runs when `AXATALK_SDK_BROWSER=1`)

## Verification commands (cwd `axatalk-sdk/`)

```bash
npx vitest run packages/sdk/src
npm run test:types
npm run lint
npm run typecheck
npm run api:check
npm run package:check
npm run preflight
```

Results (2026-07-20, post Low remediation):

| Command | Result |
| --- | --- |
| `npx vitest run packages/sdk/src` | PASS (**36** focused sdk src; workspace `npm test` **44**) |
| `npm run test:types` | PASS (**4**) |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run api:check` | PASS (sdk **28** symbols, no `AxatalkClient`) |
| `npm run package:check` | PASS (no publish; `auth-test-peer` / `fake-transport` excluded) |
| `AXATALK_SDK_BROWSER=1 npm run test:browser` | PASS (**3** — PoP sign + IndexedDB round-trip) |
| `npm run preflight` | **PASS** |
| Desktop PoP/auth oracle (repo root) | PASS (**11**) |

## Desktop integration dependency

- DI-04 `done` — server Origin/pairing/PoP/capabilities (interop target, not reimplemented)
- SDK-05 still needs DI-05 for product reads
- DI-10 remains blocked on SDK-05…SDK-09 (SDK-04 alone does not unblock DI-10)
- F-011 remains `in progress` (not marked `implemented`)

## Remaining risks (non-blocking)

- Real browser WebSocket transport adapter still deferred (FakeTransport / injectable factory only)
- Auth success confirmed by post-proof `sdk:ping` (desktop has no auth-success frame) — matches DI-04 wire behavior

## Low remediation (2026-07-20)

| Low from `/sdk-review` | Fix |
| --- | --- |
| `auth-orchestrator.ts` ~315 lines | Split into `auth-orchestrator.ts` (~252), `auth-pop-flow.ts`, `auth-grants.ts` |
| IndexedDB path scaffold-only | `pop-key-store.test.ts` via `fake-indexeddb` (Node) + Chromium IndexedDB round-trip in `tests/browser/pop-crypto.browser.test.ts` |

## Reviewer

`/sdk-review` **PASS** 2026-07-20 — independent re-verification (gate) + Low remediation closed same day:

| Command | Independent result |
| --- | --- |
| `npx vitest run packages/sdk/src` | PASS (**36**) |
| `npm run test:types` | PASS (**4**) |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run api:check` | PASS (sdk **28** symbols, no `AxatalkClient`) |
| `npm run package:check` | PASS (`auth-test-peer` / `fake-transport` excluded) |
| `AXATALK_SDK_BROWSER=1 npm run test:browser` | PASS (**3**) |
| `npm run preflight` | PASS (workspace tests **44**) |
| Desktop PoP/auth oracle | PASS (**11**) |

Checklist cells re-scored **pass**. Open Lows: **none**. DI-10 remains blocked; F-011 remains `in progress`.
