# Очистка transfer mode при сбросе исходного вызова

**Дата:** 2026-06-29 13:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/transferCleanupOnCallEnded.ts`
- `src/application/services/CallEngine.ts`
- `src/application/services/CallTracker.ts`
- `src/application/services/transferModeOperations.ts`
- `src/application/services/attendedTransferOperations.ts`
- `src/application/projections/transferProjection.ts`
- `src/application/services/CallEngine.transferSourceEnded.test.ts`
- `src/application/projections/transferProjection.test.ts`

## Что
- Добавлен `executeTransferCleanupOnCallEnded`: при завершении source leg публикуется `TransferModeCancelled`, сбрасывается сессия, консультационный вызов сбрасывается
- `CallTracker` хранит `transferModeSourceCallId` для режима перевода без консультации
- `CallEngine.handleCallEnded` вызывает cleanup до публикации `CallEnded`
- `transferProjection` сбрасывается в `idle`, если `CallEnded` совпадает с source во время attended transfer
- Тесты: консультация активна / только transfer mode

## Зачем
- Убрать зависший интерфейс перевода и dialpad поверх пустого экрана, когда исходный абонент сам сбросил вызов во время перевода с консультацией.

## Результат
- `npm run test` — 787 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- UI wiring не требуется: `isTransferPanelVisible` уже читает projection
