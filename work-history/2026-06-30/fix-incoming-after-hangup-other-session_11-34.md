# Fix incoming answer after hangup other session

**Дата:** 2026-06-30 11:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/CallTracker.ts`
- `src/application/services/IncomingCallOrchestrator.ts`
- `src/renderer/hooks/useIncomingCallActions.ts`
- `src/application/services/CallEngine.multiIncomingAfterHangup.test.ts`

## Что
- `findRingingIncomingCall` + `reconcileActiveIncomingPointer`
- answer/reject по callId из tracked registry
- UI сброс answering/rejecting при ошибке

## Зачем
После hangup активной линии answer/reject на висящем входящем зависал из-за сброса `activeIncomingCall`.

## Результат
- `CallEngine.multiIncomingAfterHangup.test.ts` — green
