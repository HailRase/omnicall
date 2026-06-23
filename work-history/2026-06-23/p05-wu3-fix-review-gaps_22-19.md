# P05 WU3 Fix Review Gaps

**Дата:** 2026-06-23 22:19
**Статус:** выполнено
**Коммит:** —

## Где
- `attendedTransferOperations.ts`, `callEvents.ts`, projections
- `AccountBootstrapFacade.ts`
- `MultiCallPolicy.ts` (hold-all только Active)
- `activeCallControlsProjection.test.ts`, `CallEngine.attendedTransfer.test.ts`

## Что
- `ConsultationCallFailed` event + rollback projections при failure `makeCall`
- `AttendedTransferFailed.restoredSourceState` в payload; projection без hardcode Held
- Facade: `startConsultationUseCase`, `attendedTransferUseCase` + ByIds методы
- Тесты attended controls + consultation retry; LF-029 handoff link

## Зачем
Закрыть reviewer gaps после P05 WU3 без перехода к WU4 UI.

## Результат
- `npm run test`: 218 passed
- `npm run lint`, `npm run typecheck`: green
