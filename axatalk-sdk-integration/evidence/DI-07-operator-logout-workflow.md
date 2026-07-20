# DI-07 — Operator Status and Logout Workflow (evidence)

**Date:** 2026-07-20  
**Status:** `done` (`/sdk-review` PASS 2026-07-20; Low remediation same day)  
**Desktop version:** `0.11.2` (unchanged)  
**Feature:** F-011 remains `in progress` (not `implemented`)

## Scope landed

Authenticated, capability-bound sessions gain **operator status + account logout** mapped to existing F-028 Application behavior with `callType: "sdk"`:

| Public command | Capability | Path |
| --- | --- | --- |
| `operator:get-reasons` | `operator.status.write` | `ExternalSdkOperatorHandler` → projection DTO mapper (peek-only revision) |
| `operator:change-status` | `operator.status.write` | → Facade `changeOcpStatusFromHost({ callType: "sdk" })` via `createSdkOperatorPortFromFacade` |
| `account:prepare-logout` | `session.logout` | pending logoutToken; may return `interaction_required` + reasons |
| `account:confirm-logout` | `session.logout` | → `logoutAccountSession` / `AccountLogoutOrchestrationService` |

Cancel = abandon / `cancelPendingLogout(token)` / `clearPendingLogoutsForClient` on disconnect — no SIP tear.  
Prepare supersedes prior pending tokens for the same `clientId`.  
Still `not_ready`: `account:activate-profile` (DI-08). Still product-denied: `window:hide`.

## Revision contract (preserved from DI-06 / ADR-0017 O-OWN-1)

```text
peek() = current aggregate R
operator:change-status / account:confirm-logout success
  -> advance() -> reply.revision = R+1
operator:get-reasons / account:prepare-logout (incl. interaction_required)
  -> peek only (no advance)
```

Shared `SdkSessionRevisionClock` from `bindSdkBrokerSession` — no second clock.  
Verified: snapshot revision is valid `expectedRevision` for operator mutate.

## Architecture

```text
WS (DI-04 auth + caps)
  -> routeSdkInbound → command_broker for operator:* / account:prepare|confirm-logout
  -> SdkRequestDedupCache (TTL 120s)
  -> MainToRendererBroker (+ clientId; failure details for interaction_required)
  -> ExternalSdkProductHandler
       -> ExternalSdkOperatorHandler
       -> createSdkOperatorPortFromFacade(callType:"sdk") / logoutAccountSession
  -> recovery disarm/reset via AccountLogoutOrchestrationService (unchanged)
WS disconnect/revoke
  -> productSurface.onClientSessionEnded(clientId)
  -> IPC sdk-broker:client-session-ended
  -> abortClientSession → clear pending logout only (no SIP tear)
```

- No second Facade / Call Engine in main.
- Public DTOs only — no OCP wire frames, channels, apiKeys on WS/IPC/logs.
- SIP-only: empty reasons; status → `not_found`; prepare → token without interaction.

## Key files

- `src/application/integration/ExternalSdkOperatorHandler.ts`
- `src/application/integration/createSdkOperatorPortFromFacade.ts`
- `src/application/integration/ExternalSdkOperatorPort.ts`
- `src/application/integration/mapSdkOperatorReasons.ts`
- `src/application/integration/externalSdkLogoutCommands.ts`
- `src/application/integration/externalSdkOperatorHelpers.ts`
- `src/application/integration/ExternalSdkProductHandler.ts`
- `src/application/facades/AccountBootstrapFacade.ts` (`callType` on `changeOcpStatusFromHost`)
- `src/adapters/integration/sdkGatewayRouteInbound.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts` (`onClientSessionEnded`)
- `src/main/sdk/createSdkGatewayProductSurface.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `src/ports/integration/ExternalCommandHandler.ts` / `MainToRendererBrokerPort.ts` (`details`)
- `src/shared/ipc/SdkBrokerContract.ts` (`details` + client-session-ended)

## Verification (independent `/sdk-review` + Low remediation 2026-07-20)

### Focused DI-04…DI-07 set (+ Low remediation)

```bash
npx vitest run \
  src/adapters/integration/LocalWsServerAdapter.test.ts \
  src/adapters/integration/LocalWsServerAdapter.auth.test.ts \
  src/adapters/integration/LocalWsServerAdapter.product.test.ts \
  src/adapters/integration/LocalWsServerAdapter.call.test.ts \
  src/adapters/integration/LocalWsServerAdapter.operator.test.ts \
  src/adapters/integration/sdkGatewayRouteInbound.test.ts \
  src/adapters/integration/MainToRendererBroker.test.ts \
  src/ports/integration/sdk-dependency-boundary.test.ts \
  src/application/integration/ExternalSdkCallHandler.test.ts \
  src/application/integration/ExternalSdkOperatorHandler.test.ts \
  src/application/integration/createSdkOperatorPortFromFacade.test.ts \
  src/application/integration/mapSdkOperatorReasons.test.ts \
  src/application/integration/ExternalSdkSnapshotAssembler.test.ts \
  src/application/integration/ExternalSdkEventMapper.test.ts \
  src/application/integration/sdkPrivacyRedaction.test.ts \
  src/application/integration/SdkCallOwnershipRegistry.test.ts \
  src/shared/ipc/SdkBrokerContract.test.ts
```

**Result (pre-remediation gate):** **104 passed**  
**Result (post-Low remediation focused + contract):** see full suite below (operator + binding + shared-clock + disconnect notify covered).

### Full suite / gates

| Check | Result |
| --- | --- |
| `npm test` | **2458 passed / 1 skipped** |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS (`tsc` node + web exit 0) |
| `npm run registry:check` | **74 found / 0 missing** |
| `package.json` version | **0.11.2** |

## Residual risks

- SDK-07 browser client package still pending (non-blocking; protocol DTOs from SDK-02).
- Packaged E2E deferred to DI-10.
- `account:activate-profile` deferred to DI-08.
- No dedicated public protocol cancel-logout command (abandon / disconnect / supersede).

## Reviewer

`/sdk-review` DI-07 **PASS** 2026-07-20. Lows remediated same day (callType binding test, shared-clock snapshot→operator, disconnect clears pending logout). Next: `/sdk-integration` DI-08 only. Do not mark F-011 `implemented`.
