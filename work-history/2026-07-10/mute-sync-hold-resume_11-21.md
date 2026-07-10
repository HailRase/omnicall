# Mute UI sync + hold resume

**Дата:** 2026-07-10 11:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/resolveHangupTargetId.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/facades/AccountBootstrapFacade.ts`

## Что
- Mute-guard игнорирует только echo с тем же intent, не противоположное нажатие
- Mute с гарнитуры без повторного `beginUiMuteSync` (окно 600ms)
- `hookOn` на Held → resume, не hangup; hangup target для Held = undefined

## Зачем
- Синхрон mute гарнитура ↔ session controls bar с первого нажатия
- Зелёный LED на hold должен снимать удержание, а не сбрасывать вызов

## Результат
- vitest headset suites: 33 passed
