# Сброс удержанного вызова при remote BYE

**Дата:** 2026-06-29 13:23
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/CallStateMachine.ts`
- `src/domain/telephony/CallStateMachine.test.ts`
- `src/application/services/IncomingCallOrchestrator.ts`
- `src/application/services/CallEngine.remoteEndedWhileHeld.test.ts`

## Что
- В state machine переход `ended` разрешён из `Held` и `Conference`
- Добавлен warn-лог при отклонении `handleCallEnded` (защита от тихого проглатывания)
- Unit-тесты state machine + интеграционный тест CallEngine → `CallEnded` → пустой `multiLineCallProjection`

## Зачем
- При сбросе удалённой стороной во время hold `CallEnded` не публиковался, UI оставался в «На удержании».

## Результат
- Корневая причина: `end_not_allowed` для состояния `Held`
- `npm run test` — 792 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- UI wiring не требуется: projection уже убирает линию по `CallEnded`
