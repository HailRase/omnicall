# DI-06 — Call Command Router (evidence)

**Date:** 2026-07-20  
**Status:** `done` (revision-contract remediation verified; gate closed by implementation re-verify + commit)  
**Desktop version:** `0.11.2` (unchanged)  
**Feature:** F-011 remains `in progress` (not `implemented`)

## Scope landed

Authenticated, capability-bound sessions gain telephony **call mutation** surface terminating in the existing renderer Application composition and Call Engine:

| Public command | Capability | Path |
| --- | --- | --- |
| `call:originate` | `call.originate` | `ExternalSdkCallHandler` → `MakeCallUseCase` / Facade `makeCall`; owner = originator |
| `call:answer` | `call.control` | `AnswerCallUseCase`; answerer becomes owner |
| `call:reject` | `call.control` | `RejectCallUseCase`; inbound unowned allowed; owned → owner only |
| `call:hangup` | `call.control` | `HangupCallUseCase`; owner required |
| `call:hold` / `call:resume` | `call.control` | Hold/Resume UC; owner required |
| `call:mute` / `call:unmute` | `call.control` | Mute/Unmute UC; owner required |
| `call:send-dtmf` | `call.control` | `SendDtmfUseCase` per digit; owner required |

Still `not_ready` / product-denied: operator/*, account/*, `window:hide`.

## Revision contract (ADR-0017 O-OWN-1)

```text
peek() = current aggregate R
mutation with expectedRevision === R succeeds
  -> advance() -> reply.revision = R+1  (next expectedRevision)
reads (sdk:get-snapshot / sdk:ping) return peek() without advancing
```

Remediation after `/sdk-review` FAIL 2026-07-20: post-advance reply revision; reads no longer consume the clock; reply-chain + snapshot→mutate regression tests added.

## Architecture

```text
WS (DI-04 auth + caps)
  -> routeSdkInbound → command_broker for call:*
  -> SdkRequestDedupCache (cached reply, TTL 120s)
  -> MainToRendererBroker (+ clientId)
  -> ExternalSdkProductHandler
       -> ExternalSdkCallHandler (ownership / expectedRevision / mutex / idempotency)
       -> Facade Use Cases → Call Engine
  -> redacted events via DI-05 fan-out
```

- No second Call Engine / Facade in main.
- Ownership in Application (`SdkCallOwnershipRegistry`); session aggregate revision on `SdkSessionRevisionClock`.
- Per-call (and account for originate) serialization via `SdkAggregateMutex`.
- Disconnect/revoke never ends SIP/calls (DI-04 invariant preserved).

## Key files

- `src/application/integration/ExternalSdkCallHandler.ts`
- `src/application/integration/ExternalSdkProductHandler.ts`
- `src/application/integration/ExternalSdkReadHandler.ts` (reads do not advance revision)
- `src/application/integration/SdkCallOwnershipRegistry.ts`
- `src/application/integration/SdkSessionRevisionClock.ts`
- `src/application/integration/SdkAggregateMutex.ts`
- `src/application/integration/ExternalSdkCallPort.ts`
- `src/adapters/integration/sdkGatewayRouteInbound.ts`
- `src/adapters/integration/sdkGatewayProductDispatch.ts`
- `src/adapters/integration/sdkGatewayRequestDedup.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `src/shared/ipc/SdkBrokerContract.ts` (`clientId` on broker request)

## Verification (recorded)

### Focused DI-02…DI-06 set

```bash
npx vitest run \
  src/adapters/integration/LocalWsServerAdapter.test.ts \
  src/adapters/integration/LocalWsServerAdapter.auth.test.ts \
  src/adapters/integration/LocalWsServerAdapter.product.test.ts \
  src/adapters/integration/LocalWsServerAdapter.call.test.ts \
  src/adapters/integration/sdkGatewayRouteInbound.test.ts \
  src/adapters/integration/MainToRendererBroker.test.ts \
  src/ports/integration/sdk-dependency-boundary.test.ts \
  src/application/integration/sdkPrivacyRedaction.test.ts \
  src/application/integration/ExternalSdkSnapshotAssembler.test.ts \
  src/application/integration/ExternalSdkEventMapper.test.ts \
  src/application/integration/ExternalSdkCallHandler.test.ts \
  src/application/integration/SdkCallOwnershipRegistry.test.ts
```

**Result:** 12 files, **81 passed**.

### Full suite / gates

| Command | Result |
| --- | --- |
| `npm test` | **2428 passed / 1 skipped** |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run registry:check` | **73/0** |

## Residual risks

1. **SDK-06 client package** may still be `pending` — desktop server routing consumes `@axatalk/protocol` schemas/fixtures; full client interoperability is a paired SDK gate (mirror DI-05 / SDK-05 note).
2. Packaged Electron E2E deferred to **DI-10**.
3. Operator/account mutation routers remain intentionally closed (**DI-07/DI-08**).
4. Transfer / conference / `call:claim-control` out of v1 (ADR-0017).

## Non-goals confirmed

- F-011 not marked `implemented`
- Desktop version stays `0.11.2`
- No transfer backlog work
- No second Application composition in main
