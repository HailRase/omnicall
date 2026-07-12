# Fix stuck mute/hold UI busy lock

**Дата:** 2026-07-10 12:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/projections/headset/applyHeadsetSyncBusyToActiveCallControls.ts`

## Что
- UI busy снова только по pending intent (не echo timer)
- Убран `refreshMuteEchoGuard` (продлевал lock на каждом firmware mute)
- Mute sync блокирует только mute/unmute; hold sync — только hold/resume
- При игноре mute с гарнитуры — reassert LED без продления UI lock

## Зачем
- Кнопки mute/hold на session control bar залипали disabled

## Результат
- vitest headset+projections: 57 passed
