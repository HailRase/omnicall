# P05 WU3 polish — reviewer gaps после attended transfer core

**Дата:** 2026-06-23 22:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/attendedTransferOperations.ts`, `attendedTransferRollback.ts`
- `src/domain/telephony/CallRelationship.ts`, `AttendedTransferEligibility.ts`, `callEvents.ts`
- `src/application/projections/activeCallControlsProjection.ts`, `multiLineCallProjection.ts`
- Тесты: `CallEngine.attendedTransfer.test.ts`, `attendedTransferOperations.test.ts`, `CallRelationship.test.ts`, projection tests
- Docs: `P05-WU3-Attended-Transfer-Handoff.md`, `Feature-Registry.md`, `P05-Agent-Continuation-Handoff.md`, `P05-Attended-Transfer-UX-Design.md`

## Что
- Rollback при failure `transitionTransferSession` после успешного consultation `makeCall` (`rollbackConsultationStart`, log `consultation_session_transition_failed`)
- Session phase при gateway failure через domain `transitionTransferSession(..., "attended_transfer_failed")`; retry complete в eligibility
- `ConsultationCallFailed.restoredSourceState` вместо hardcode `Held` в active controls projection
- Согласованный `multiLineCallProjection` после consultation failure (sourceCallId + primaryCallId)
- Domain tests для `attended_transfer_failed` transitions; integration test retry attended transfer
- Обновлены handoff, Feature Registry (F-007), continuation handoff (WU3 ✅, убран obsolete prompt)

## Зачем
Закрыть остаточные gaps reviewer после WU3 attended transfer core: phantom projections, drift session phase vs domain, inconsistent read models и недостающее test/doc coverage перед WU4.

## Результат
- `npm run test` — 226 passed
- `npm run lint` — green
- `npm run typecheck` — green
- WU3 gate закрыт; WU4 (Transfer Panel UI) не начинался
