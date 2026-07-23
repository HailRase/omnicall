# DI-07 — Operator Status and Logout Workflow (evidence)

**Date:** 2026-07-20 (contract refresh 2026-07-23 — single-shot logout)  
**Status:** `done` (`/sdk-review` PASS 2026-07-20; Low remediation same day)  
**Desktop version:** `0.11.2` (unchanged at original close)  
**Feature:** F-011 remains `in progress` (not `implemented`)

## Scope landed

Authenticated, capability-bound sessions gain **operator status + account logout** mapped to existing F-028 Application behavior with Facade `callType: "sdk"` (ADR-0017 O-OCP-1):

| Public command | Capability | Path |
| --- | --- | --- |
| `operator:get-reasons` | `operator.status.write` | `ExternalSdkOperatorHandler` → projection DTO mapper (peek-only revision) |
| `operator:change-status` | `operator.status.write` | → Facade `changeOcpStatusFromHost({ callType: "sdk" })` via `createSdkOperatorPortFromFacade`; OCP adapter maps wire `function_call_type` to `"external"` (`mapOcpCallTypeToWire`) |
| `operator:finish-appeal` | `operator.status.write` | → Facade `finishOcpPostCallAppeal({ callType: "sdk" })` → `FinishPostCallAppealUseCase` (only post-call processing; OCP login required) |
| `account:logout` | `session.logout` | → `logoutAccountSession` / `AccountLogoutOrchestrationService`; may return `interaction_required` + `{ requiresReason: true, reasons }` (**no** `logoutToken`) |

Cancel = do not call logout / disconnect — no SIP tear.  
Still `not_ready` historically for activate until DI-08. Still product-denied: `window:hide`.

## Revision contract (preserved from DI-06 / ADR-0017 O-OWN-1)

```text
peek() = current aggregate R
operator:change-status / operator:finish-appeal / account:logout success
  -> advance() -> reply.revision = R+1
operator:get-reasons / account:logout interaction_required
  -> peek only (no advance)
```

Shared `SdkSessionRevisionClock` from `bindSdkBrokerSession` — no second clock.  
Verified: snapshot revision is valid `expectedRevision` for operator mutate.

## Architecture

```text
WS (DI-04 auth + caps)
  -> routeSdkInbound → command_broker for operator:* / account:logout
  -> SdkRequestDedupCache (TTL 120s)
  -> MainToRendererBroker (+ clientId; failure details for interaction_required)
  -> ExternalSdkProductHandler
       -> ExternalSdkOperatorHandler
       -> createSdkOperatorPortFromFacade(callType:"sdk") / logoutAccountSession
  -> recovery disarm/reset via AccountLogoutOrchestrationService (unchanged)
WS disconnect/revoke
  -> productSurface.onClientSessionEnded(clientId)
  -> IPC sdk-broker:client-session-ended
  -> abortClientSession → no auto-logout / no SIP tear
```

- No second Facade / Call Engine in main.
- Public DTOs only — no OCP wire frames, channels, apiKeys on WS/IPC/logs.
- SIP-only: empty reasons; status → `not_found`; logout may succeed without reasonId.

## Key files

- `src/application/integration/ExternalSdkOperatorHandler.ts`
- `src/application/integration/createSdkOperatorPortFromFacade.ts`
- `src/application/integration/ExternalSdkOperatorPort.ts`
- `src/application/integration/mapSdkOperatorReasons.ts`
- `src/application/integration/externalSdkLogoutCommands.ts`
- `src/application/integration/externalSdkOperatorHelpers.ts`
- `src/application/integration/ExternalSdkProductHandler.ts`
- `src/application/facades/AccountBootstrapFacade.ts` (`callType` on `changeOcpStatusFromHost`)
- `src/adapters/integration/ocp/mapOcpCallTypeToWire.ts` (`sdk` → OCP wire `external`)
- `src/adapters/integration/ocp/buildOcpCommandPayload.ts`
- `src/adapters/integration/sdkGatewayRouteInbound.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts` (`onClientSessionEnded`)
- `src/main/sdk/createSdkGatewayProductSurface.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `src/ports/integration/ExternalCommandHandler.ts` / `MainToRendererBrokerPort.ts` (`details`)
- `src/shared/ipc/SdkBrokerContract.ts` (`details` + client-session-ended)

## Residual risks

- Packaged E2E / remaining DI-10 smoke still open for F-011 close.
- No dedicated public protocol cancel-logout command (abandon / disconnect).
- Operator push events + coarse-advance: see DI-05 follow-up `evidence/DI-05-operator-events-coarse-revision.md` (2026-07-23).
- `kind: "applied"` on `operator:change-status` means OCP command was **sent** (WS write ok); softphone projection updates when OCP pushes `users` / `OperatorStatusChanged` (not optimistic).

## Follow-up fix (2026-07-23)

**Bug:** Application `callType: "sdk"` was forwarded verbatim as OCP `function_call_type: "sdk"`. Legacy OCP accepts only `internal`|`external`, so SDK status changes replied `applied` while softphone/OCP stayed Ready.

**Fix:** adapter-only map `sdk` → wire `external` (`mapOcpCallTypeToWire`). Facade binding remains `callType: "sdk"` (no silent downgrade of Application audit).

**Contract refresh:** prepare/confirm + `logoutToken` removed; public wire is single-shot `account:logout`.

## Reviewer

`/sdk-review` DI-07 **PASS** 2026-07-20. Lows remediated same day. Wire map fix 2026-07-23 is additive (adapter + docs); single-shot logout docs/tests aligned 2026-07-23. Do not mark F-011 `implemented` without live OCP smoke.
