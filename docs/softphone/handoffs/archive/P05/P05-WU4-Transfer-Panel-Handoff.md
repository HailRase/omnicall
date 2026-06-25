# P05 WU4 Transfer Panel Handoff

- Scope: WU4 transfer mode UI panel + phase gate closure; legacy `LF-030`, `LF-031`.
- Out of scope WU4: JsSIP/REFER adapters, E2E harness, Phase P06.

## Delivered (WU4)

- UX: `docs/softphone/P05-Transfer-Panel-UX-Design.md`
- Events: `TransferModeStarted`, `TransferModeCancelled`, `CallAutoUnheldAfterTransferFailure`
- Settings: `MultiCallSettings.autoUnholdOnTransferFailure` (default true)
- Use Cases: `StartTransferUseCase`, `CancelTransferUseCase`
- Application: `transferModeOperations.ts`, `transferFailureRecovery.ts`, `CallEngine.startTransferMode` / `cancelTransfer`, facade methods
- Projections: extended `transferProjection` (`transferModeActive`), `deriveStartConsultationDisabledReason`, `deriveAttendedTransferDisabledReason`, `transferPanelProjection.ts`
- UI: `TransferPanel`, `MultiLineCallList`, `useTransferActions`, `useTransferPanelShell`, `App.tsx` wiring, `control-transfer` on active controls
- Feature Registry: F-006, F-007 → `implemented` (mock; E2E deferred)
- Tests: 250 total green; full P05 + P04 regression green

## Post-WU4 polish (fix-review gaps)

- `cleanupConsultationLegOnCancel` — cancel without `ConsultationCallFailed` failure semantics
- Enriched `TransferModeCancelled` payload (`restoredSourceState`, `consultationCallId`)
- `resolveTransferFailureMessage` — benign reason filter (`transfer_cancelled`) + banner prefixes (`Transfer failed:` / `Consultation failed:`)
- Shared `transferFailureReasons.ts` — single source for `isBenignTransferFailureReason`
- Shared `mapTransferDisabledReason.ts` — transfer disabled labels incl. `transfer_mode_active`
- Tests: `transferPanelProjection.test.ts`, extended `CallEngine.cancelTransfer.test.ts`, `transferFailureReasons.test.ts`, `mapTransferDisabledReason.test.ts`

## Migration Evidence — LF-030 (Cancel Transfer Mode)

| Area | Path |
| --- | --- |
| Event | `TransferModeCancelled` in `callEvents.ts` |
| Use Case | `CancelTransferUseCase.ts` |
| Orchestration | `transferModeOperations.ts` → `executeCancelTransfer` |
| Facade | `AccountBootstrapFacade.cancelTransfer` / `cancelTransferById` |
| UI | `TransferPanel` → `control-cancel-transfer` |
| Test | `CallEngine.cancelTransfer.test.ts`, `TransferPanel.test.tsx` |

## Migration Evidence — LF-031 (Auto-Unhold After Failed Transfer)

| Area | Path |
| --- | --- |
| Event | `CallAutoUnheldAfterTransferFailure` in `callEvents.ts` |
| Settings | `MultiCallSettings.autoUnholdOnTransferFailure` |
| Recovery | `transferFailureRecovery.ts` (skips auto-unhold when consultation leg active) |
| Projection | `activeCallControlsProjection` handles auto-unhold event |
| Test | `CallEngine.blindTransfer.test.ts` (auto-unhold path) |

## Test IDs (WU4)

- `transfer-panel`, `transfer-target-input`
- `control-blind-transfer`, `control-attended-transfer`, `control-start-consultation`, `control-cancel-transfer`
- `transfer-failure-banner`, `transfer-in-progress-indicator`
- `multi-line-call-list`, `call-line-{callId}`

## Phase P05 Gate

- [x] Multi-call policy test-covered (WU1)
- [x] Blind transfer domain + mock (WU2)
- [x] Attended transfer core + mock (WU3)
- [x] Transfer mode UI + cancel + auto-unhold (WU4)
- [x] Failed transfer restores valid call state
- [x] No mutable transfer flags on adapter sessions

## Deferred

- Real JsSIP REFER / consultation adapter
- E2E transfer UI harness

## Verification

```bash
npm run test
npm run lint
npm run typecheck
```

All green after WU4 (250 tests).
