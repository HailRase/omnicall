# OCP queue info uiState fix

**Дата:** 2026-07-06 00:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/incomingCallProjection.ts`
- `src/application/projections/incomingCallProjection.test.ts`

## Что
- `resolveQueueInfoUiState`: после `QueueInfoReceived` переход в `callerIdentityResolved` (кроме `autoAnswerCountdown`)
- Unit-тест: queue info во время `incomingRinging` → `callerIdentityResolved`
- Исправлен падающий `OcpQueueInfoSync.integration.test.ts`

## Зачем
Интеграционный тест и OCP-поток ожидали resolved-состояние после получения queue_info, а projection сохранял `incomingRinging`.

## Результат
- `npm run test -- src/application/integration/OcpQueueInfoSync.integration.test.ts` — 2 passed
