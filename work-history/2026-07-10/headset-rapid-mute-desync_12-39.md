# Headset rapid mute desync fix

**Дата:** 2026-07-10 12:39
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/headset/HeadsetSessionOrchestrator.test.ts`

## Что
- Mute lock 1200ms; UI busy держится на весь echo window (`lastMuteSessionId`)
- Быстрые mute с гарнитуры во время lock: не toggle app, а `setMute` LED = состояние app + refresh guard
- Abort mute sync при ошибке headset→muteCall
- Регрессионный тест rapid headset mute

## Зачем
- Прошивка переключает LED локально при каждом клике; игнор события без reassert давал рассинхрон с session control bar

## Результат
- vitest headset+projections: 57 passed
