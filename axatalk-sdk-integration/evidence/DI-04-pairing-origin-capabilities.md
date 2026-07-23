# DI-04 Evidence — Pairing, Origin, Capabilities, and Revocation

**Date:** 2026-07-20  
**Status:** `done` (`/sdk-review` PASS 2026-07-20)  
**Desktop version:** `0.11.2` (unchanged)  
**Feature:** F-011 remains `in progress` (not `implemented`)

## Prerequisites

| Check | Result |
| --- | --- |
| DI-00…DI-03 | `done` (`/sdk-review` PASS) |
| SDK-01 + SDK-02 | `done` — protocol pairing/auth/capability shapes |
| SDK-03 | `done` |
| SDK-04 | may remain `pending` — desktop server-side only this unit |
| Package version | `0.11.2` |

## Delivered

1. **Exact Origin allowlist** — upgrade fails closed on missing / `null` / non-exact / empty allowlist (`sdkGatewayOriginPolicy.ts`). Source: options or `AXATALK_SDK_ALLOWED_ORIGINS` CSV.
2. **Pairing ceremony** — `pairing:request` → `pending` → local approve/deny → `approved`/`denied`; grants from ADR-0016 profiles (no privileged auto-escalation).
3. **Secure storage** — `SdkGatewayPairingStore` via `SecretStoragePort` (main: `ElectronSafeStorageSecretService` + `MainProcessSecretStorageAdapter`; tests: in-memory).
4. **PoP auth** — `authChallenge` in server-hello for paired clients; ECDSA P-256 IEEE-P1363 verify (`node:crypto.verify`); single-use challenge cache.
5. **Capabilities** — checked per command; unauth → `unauthenticated`; missing grant → `forbidden`; capable product paths → `not_ready` until DI-05 (`sdk:ping` OK after auth).
6. **Revoke/expiry** — `revokePairedClient` / `revokeSdkPairedClient` emits `sdk:revoked`, closes sessions; does not touch SIP/OCP; auth session TTL fail-closed.
7. **Audit logs** — allowlisted fields only (no nonces/signatures/keys/payloads).
8. **DI-03 invariants preserved** — loopback bind, limits, SIP-boot independence, Domain free of protocol/`ws`.

## Minimal approve/revoke surface (DI-09 Settings deferred)

- `LocalWsServerAdapter.approvePairingRequest` / `denyPairingRequest` / `revokePairedClient`
- Main: `approveSdkPairingRequest` / `denySdkPairingRequest` / `revokeSdkPairedClient`
- Default production approver is deferred (fail closed until resolved); tests may `autoApprovePairing`

## Key files

- `src/adapters/integration/sdkGatewayOriginPolicy.ts`
- `src/adapters/integration/sdkGatewayPairingStore.ts`
- `src/adapters/integration/sdkGatewayPopCrypto.ts`
- `src/adapters/integration/sdkGatewayAuthChallenge.ts`
- `src/adapters/integration/sdkGatewaySessionAuth.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts` / `LocalWsServerAdapter.ts`
- `src/main/sdk/registerSdkGateway.ts`
- `src/main/secrets/MainProcessSecretStorageAdapter.ts`
- `src/ports/secrets/SecretStoragePort.ts` (SDK pairing secret IDs)

## Verification

```bash
npx vitest run \
  src/adapters/integration/LocalWsServerAdapter.test.ts \
  src/adapters/integration/LocalWsServerAdapter.auth.test.ts \
  src/adapters/integration/LocalWsSessionRegistry.test.ts \
  src/adapters/integration/sdkGatewayPeer.test.ts \
  src/adapters/integration/sdkGatewayRouteInbound.test.ts \
  src/adapters/integration/sdkGatewayOriginPolicy.test.ts \
  src/adapters/integration/sdkGatewayPopCrypto.test.ts \
  src/main/sdk/registerSdkGateway.test.ts \
  src/ports/integration/sdk-dependency-boundary.test.ts
# → 44 passed

npm test          # → 2385 passed / 1 skipped
npm run lint      # PASS
npm run typecheck # PASS
npm run registry:check # 68 found / 0 missing
```

## Honesty / non-goals

- No product snapshot/event success (DI-05)
- No call/operator/account routers (DI-06+)
- No full Settings UX (DI-09)
- No SDK client pairing package (SDK-04)
- F-011 not marked `implemented`
- Version not bumped

## Reviewer

`/sdk-review` **PASS** (2026-07-20) — focused 44; full suite 2385 passed / 1 skipped; lint/typecheck/registry green.  

**Follow-up remediation (same day, closed High/Low):**
- Pin PoP SPKI to `prime256v1` (`sdkGatewayPopCrypto.ts` + curve rejection tests)
- Fail-closed enabled gateway without `SecretStoragePort` (`missing_secret_storage`)
- Dedicated expired-challenge + auth session TTL tests
- Types extracted to `localWsServerAdapterTypes.ts` (file-size gate)

Next unit: DI-05 via `/sdk-integration`.

## Follow-up (2026-07-23) — per-connection inbound serialization

**Issue:** SDK sends `sdk:auth-proof` then immediately `sdk:ping` (no delay). Desktop
dispatched inbound with `void` async handlers, so ping could observe `authState !==
authenticated` and reply `unauthenticated` while proof was still verifying.

**Fix (desktop only; SDK unchanged):**
- `SdkGatewayConnection.inboundTail` + `enqueueSdkGatewayInbound`
- `parseAndDispatchLocalWsSession` awaits dispatch on that chain (receive order)
- Regression: `LocalWsServerAdapter.auth.test.ts` (back-to-back proof+ping, no sleep);
  unit: `sdkGatewayConnection.test.ts`
- Docs aligned: `PROTOCOL.md`, `SECURITY.md`, ADR-0016, `TEST-MATRIX.md`, F-011 evidence

**Non-goals:** no protocol v1 shape change; no SDK rewrite; version not bumped.
