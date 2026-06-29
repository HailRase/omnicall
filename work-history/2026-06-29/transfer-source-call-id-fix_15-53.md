# Исправление выбора исходного звонка при переводе

**Дата:** 2026-06-29 15:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useTransferActions.ts`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/application/projections/multiLineCallProjection.ts`
- `src/application/projections/multiLineCallProjection.test.ts`

## Что
- `handleStartTransfer` принимает `callId` с кнопки перевода вместо глобального `activeCallControlsProjection.callId`
- `handleTransferLine` передаёт выбранный `callId` в `startTransferById`
- Проекция `multiLineCallProjection` обрабатывает `TransferModeStarted`: помечает линию ролью `source`
- При отмене перевода без консультации сбрасывается `sourceCallId` и роль `source`
- Добавлены unit-тесты на два активных звонка и отмену transfer mode

## Зачем
При двух сессиях в перевод уходил не тот звонок: UI передавал id нажатой линии, но Use Case вызывался с id из глобальной проекции последнего события.

## Результат
- `npm run test` — 795 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
