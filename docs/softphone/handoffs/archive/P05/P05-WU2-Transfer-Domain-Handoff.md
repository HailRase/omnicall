# P05 WU2 Transfer Domain Handoff

- Scope: WU2 blind transfer domain, ports, mock adapter, application skeleton; legacy `LF-028`.
- Out of scope WU2: transfer UI panel (WU4), attended transfer (WU3), JsSIP/REFER adapters, E2E harness, `TransferModeStarted` / `TransferModeCancelled` / `CallAutoUnheldAfterTransferFailure`.

## Delivered (WU2)

- UX: `docs/softphone/P05-Transfer-Domain-UX-Design.md` (design-only; test IDs reserved for WU4)
- Domain events: `CallTransferRequested`, `CallTransferred`, `CallTransferFailed` in `callEvents.ts`
- Domain eligibility: `src/domain/telephony/TransferEligibility.ts` + tests
- FSM: transfer transitions covered in `CallStateMachine.test.ts` (baseline FSM unchanged)
- Port: `TelephonyGateway.blindTransfer(BlindTransferCommand)`
- Mock adapter: `MockTelephonyGateway` `blindTransferScenario` + `MockTelephonyGateway.blindTransfer.test.ts`
- Application: `TransferCallControlService`, `executeBlindTransfer`, `BlindTransferUseCase`, `CallEngine.blindTransfer`
- Projection: `transferProjection.ts` + store subscribe in `useAccountBootstrapStore`; `callProjection` sync for call state
- Feature Registry: F-006 WU2 acceptance; F-007 note attended deferred WU3
- Tests: domain, adapter, use case, `CallEngine.blindTransfer.test.ts`, projection; WU1/P04 regression green

## Migration Evidence — LF-028 (Blind Transfer)

| Area | Path |
| --- | --- |
| Domain eligibility | `src/domain/telephony/TransferEligibility.ts` |
| Domain events | `src/domain/telephony/events/callEvents.ts` |
| FSM | `src/domain/telephony/CallStateMachine.ts` |
| Port | `src/ports/telephony/TelephonyGateway.ts` |
| Mock adapter | `src/adapters/mock/MockTelephonyGateway.ts` |
| Use Case | `src/application/use-cases/BlindTransferUseCase.ts` |
| Orchestration | `src/application/services/transferCallControlOperations.ts` |
| Call Engine | `src/application/services/CallEngine.ts` → `TransferCallControlService` |
| Projection | `src/application/projections/transferProjection.ts` |
| Tests | `TransferEligibility.test.ts`, `CallStateMachine.test.ts`, `MockTelephonyGateway.blindTransfer.test.ts`, `BlindTransferUseCase.test.ts`, `CallEngine.blindTransfer.test.ts`, `transferProjection.test.ts` |

### Events

- `CallTransferRequested` — FSM `transfer_requested` → `Transferring`; published before gateway call
- `CallTransferred` — FSM `transfer_completed` → `Ended`; followed by `CallEnded`
- `CallTransferFailed` — FSM `transfer_failed` → `Active`; gateway/validation failure recovery

## WU3 Backlog (Attended Transfer Core)

1. Call relationship model for consultation leg.
2. `AttendedTransferUseCase` + attended orchestration in Call Engine.
3. Multi-call read model: multiple visible lines beyond single `activeCallId`.

## WU4 Backlog (Transfer UX)

1. Transfer mode UI panel, target entry, cancel transfer (`LF-030`).
2. Events: `TransferModeStarted`, `TransferModeCancelled`, `CallAutoUnheldAfterTransferFailure` (`LF-031`).
3. Failure recovery banner per UX blueprint; wire reserved test IDs.

## Deferred

- Real JsSIP REFER adapter.
- `StartTransferUseCase` full transfer-mode entry (skeleton deferred; `BlindTransferUseCase` is direct path for WU2).
- E2E harness for transfer flows.

## Verification

```bash
npm run test
npm run lint
npm run typecheck
```

All green after WU2.
