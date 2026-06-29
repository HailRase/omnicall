# Очистка CallTracker после перевода

**Дата:** 2026-06-29 16:38
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/CallTracker.ts`
- `src/application/services/callTrackerReconciliation.ts`
- `src/application/services/attendedTransferRecovery.ts`
- `src/application/services/attendedTransferOperations.ts`
- `src/application/services/MultiCallPolicyService.ts`
- `src/domain/telephony/CallState.ts`

## Что
- Консультационная линия после attended transfer завершается через `markCallLegEndedAfterTransfer` (`ended`, не только `transfer_completed`)
- `CallTracker`: `untrackCall` / `finalizeCall`, автоудаление terminal-состояний, сброс transfer session и transfer mode source
- `reconcileCallTracker` перед multi-call policy: удаляет terminal/orphan refs, не трогает `consultation_dialing` до появления leg в tracker
- Тест: исходящий звонок после успешного attended transfer без `hold_all_active_lines_failed`

## Зачем
После консультативного перевода в tracker оставалась Active-консультация; следующий исходящий вызов падал на hold несуществующей SIP-сессии.

## Результат
- `npm run test` — 815 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
