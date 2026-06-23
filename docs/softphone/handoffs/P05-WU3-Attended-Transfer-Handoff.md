# P05 WU3 Attended Transfer Handoff

- Scope: WU3 attended transfer core (mock-only); legacy `LF-029`, `LF-032`.
- Out of scope WU3: transfer UI panel (`LF-030` → WU4), `TransferModeStarted` / `TransferModeCancelled` / `CallAutoUnheldAfterTransferFailure`, JsSIP/REFER adapters, E2E harness.

## Delivered (WU3)

- UX: `docs/softphone/P05-Attended-Transfer-UX-Design.md`
- Domain: `CallRelationship.ts`, `AttendedTransferEligibility.ts` + unit tests
- Events: `ConsultationCallRequested`, `ConsultationCallStarted`, `ConsultationCallFailed`, `AttendedTransferRequested`, `AttendedTransferCompleted`, `AttendedTransferFailed`; payloads include `restoredSourceState` on failure events; `TransferType` extended to `"blind" | "attended"`
- Port: `TelephonyGateway.attendedTransfer(AttendedTransferCommand)`
- Mock: `MockTelephonyGateway.attendedTransferScenario` + adapter tests
- Application: `attendedTransferOperations.ts`, `attendedTransferRollback.ts`, `TransferCallControlService.startConsultation` / `attendedTransfer`, `StartConsultationUseCase`, `AttendedTransferUseCase`, `AccountBootstrapFacade` attended/consultation methods, `CallEngine` wiring; `CallTracker` transfer session
- Projections: `multiLineCallProjection.ts`, extended `transferProjection`, `activeCallControlsProjection` attended events; store subscribe in `useAccountBootstrapStore`
- Feature Registry: F-007 WU3 acceptance; F-006 integration note
- Tests: 220+ total green; WU1/WU2/P04 regression green; polish: rollback on session transition failure, attended retry after gateway failure

## Migration Evidence — LF-029 (Attended Transfer)

| Area | Path |
| --- | --- |
| Domain relationship | `src/domain/telephony/CallRelationship.ts` |
| Domain eligibility | `src/domain/telephony/AttendedTransferEligibility.ts` |
| Domain events | `src/domain/telephony/events/callEvents.ts` |
| Rollback helper | `src/application/services/attendedTransferRollback.ts` |
| Port | `src/ports/telephony/TelephonyGateway.ts` |
| Mock adapter | `src/adapters/mock/MockTelephonyGateway.ts` |
| Use Cases | `StartConsultationUseCase.ts`, `AttendedTransferUseCase.ts` |
| Orchestration | `attendedTransferOperations.ts`, `TransferCallControlService.ts` |
| Call Engine | `CallEngine.ts` → `startConsultation` / `attendedTransfer` |
| Projections | `multiLineCallProjection.ts`, `transferProjection.ts` |
| Store | `useAccountBootstrapStore.ts` |
| Tests | `CallRelationship.test.ts`, `AttendedTransferEligibility.test.ts`, `MockTelephonyGateway.attendedTransfer.test.ts`, `CallEngine.attendedTransfer.test.ts`, `attendedTransferOperations.test.ts`, `multiLineCallProjection.test.ts`, `activeCallControlsProjection.test.ts` |

### Events

- `ConsultationCallRequested` — relationship established; source held via WU1 hold-all
- `ConsultationCallStarted` — consultation leg Active; session phase `consultation_active`
- `ConsultationCallFailed` — consultation start rollback; `restoredSourceState` on source; hangup consultation leg; projections idle/source-only
- `AttendedTransferRequested` — source FSM `Transferring`; gateway attended REFER (mock); allowed from `consultation_active` or retry from `attended_transfer_failed`
- `AttendedTransferCompleted` — both legs ended; session cleared
- `AttendedTransferFailed` — source restored Held/Active via `restoredSourceState`; consultation remains Active; session phase `attended_transfer_failed` (domain-aligned) for retry complete

### LF-032

- `evaluateStartConsultationEligibility` blocks when `multiSessionsEnabled` false
- `CallEngine.attendedTransfer.test.ts` — `blocks consultation when multi-sessions disabled`

## WU4 Backlog (Transfer UX Panel)

1. Transfer mode UI panel, target entry, cancel transfer (`LF-030`).
2. Events: `TransferModeStarted`, `TransferModeCancelled`, `CallAutoUnheldAfterTransferFailure` (`LF-031`).
3. Wire `multi-line-call-list`, `control-attended-transfer`, `control-start-consultation` test IDs.
4. Failure recovery banner; cancel transfer button.

## Deferred

- Real JsSIP REFER / consultation adapter.
- E2E harness for attended transfer flows.

## Verification

```bash
npm run test
npm run lint
npm run typecheck
```

All green after WU3.
