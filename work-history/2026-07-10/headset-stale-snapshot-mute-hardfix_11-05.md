# Headset stale snapshot and mute echo hard fix

**Дата:** 2026-07-10 11:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/stores/useAccountBootstrapStore.ts`
- `src/adapters/headset/webhid/WebHidHeadsetAdapter.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/HeadsetSyncQueue.ts`

## Что
- **Root cause:** `notifyHeadset` вызывался внутри Zustand `set()` → `getState()` отдавал stale incoming/multiLine → после answer `lastSnapshot` оставался на ringing (LED моргал, mute/hangup мертвы)
- Notify headset **после commit** state
- После LED output синхронизируется HID edge detector (анти-эхо mute/hook от прошивки)
- Mute guard 1200ms + refresh при отправке `setMute`

## Зачем
- Production-стабильные answer LED, mute UI↔headset без рассинхрона

## Результат
- `npx vitest run src/application/headset` — 33 passed
- `npx tsc --noEmit` — green
