# P05 WU1 Multi-Call Policy Handoff

- Scope: WU1 policy foundation; legacy `LF-021`, `LF-023`, `LF-032`.
- Out of scope WU1: transfer Use Cases, transfer UI, `TelephonyGateway.transfer*`, transfer domain events, JsSIP adapters.

## Delivered (WU1)

- UX: `docs/softphone/P05-Multi-Call-Policy-UX-Design.md`
- Domain policy: `src/domain/telephony/MultiCallPolicy.ts` + `MultiCallPolicy.test.ts`
- Settings port: `SettingsRepository.getMultiCallSettings()`, `InMemorySettingsRepository` default `multiSessionsEnabled: true`
- Domain events: `AllOtherCallsHeld`, `SecondSessionBlocked` in `callEvents.ts`
- Application: `MultiCallPolicyService`, `CallTracker` multi-call queries, orchestration in `OutgoingCallOrchestrator` / `IncomingCallOrchestrator`, exclusive hold on resume via `ActiveCallControlService`
- Projection: `multiCallProjection.ts` (separate from `callProjection` — grows with session policy state)
- UI wiring: `useDialpadShell` + `useIncomingCallActions` projection-driven; store subscribes to `reduceMultiCallProjection`
- Tests: domain, `CallEngine.multiCallPolicy.test.ts`, `multiCallProjection.test.ts`, `MultiCallPolicy.integration.test.ts`; P04 `CallEngine.test.ts` regression green

## Migration Evidence

### LF-021 — Hold all before new outgoing

- Domain: `shouldHoldAllBeforeOutgoing`, `getCallsToHoldBeforeOutgoing`
- Application: `MultiCallPolicyService.holdAllBeforeOutgoing` → `OutgoingCallOrchestrator.makeCall`
- Event: `AllOtherCallsHeld` (`phase: in_progress` | `completed`)
- Tests: `CallEngine.multiCallPolicy.test.ts` (LF-021), `multiCallProjection.test.ts`

### LF-023 — Exclusive hold

- Domain: `getCallsToHoldForExclusiveResume`
- Application: `MultiCallPolicyService.enforceExclusiveHoldBeforeResume` → `executeResumeCall`
- Tests: `CallEngine.multiCallPolicy.test.ts` (LF-023)

### LF-032 — Block second session when disabled

- Domain: `evaluateSecondSessionBlock`, `deriveSecondSessionDialpadDisabled`
- Application: `MultiCallPolicyService.checkSecondSessionBlocked` (outgoing + incoming answer)
- Event: `SecondSessionBlocked`
- Projection/UI: `multiCallProjection`, `useDialpadShell`, `useIncomingCallActions`
- Tests: `CallEngine.multiCallPolicy.test.ts`, `MultiCallPolicy.integration.test.ts`, `multiCallProjection.test.ts`

## WU2 Backlog (Transfer Ports + Blind Transfer)

1. Extend `TelephonyGateway` with `transferBlind` / REFER mapping (mock first).
2. Implement `BlindTransferUseCase` + `StartTransferUseCase` skeleton.
3. Domain events: `CallTransferRequested`, `CallTransferred`, `CallTransferFailed`.
4. Feature Registry: complete F-006 acceptance (blind transfer end-to-end).

## WU3 Backlog (Attended Transfer Core)

1. Call relationship model for consultation leg.
2. `AttendedTransferUseCase`, attended transfer orchestration in Call Engine.
3. Multi-call read model: multiple visible lines (beyond single `activeCallId`).

## WU4 Backlog (Transfer UX)

1. Transfer mode UI panel, target entry, cancel transfer.
2. Events: `TransferModeStarted`, `TransferModeCancelled`, `CallAutoUnheldAfterTransferFailure`.
3. Failure recovery banner per UX blueprint.

## Deferred

- Real JsSIP multi-session / REFER adapters.
- E2E harness for multi-call scenarios.
- `IncomingCallOrchestrator` file split (348 lines).

## Verification

```bash
npm run test
npm run lint
npm run typecheck
```

All green after WU1.
