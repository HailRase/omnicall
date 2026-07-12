# Hold hangup + mute parity

**Дата:** 2026-07-10 11:13
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/headset/webhid/hidLedOutput.ts`
- `src/adapters/headset/webhid/WebHidHeadsetAdapter.ts`
- `src/adapters/headset/webhid/hidEdgeDetector.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/domain/headset/HeadsetHardwareEvent.ts`

## Что
- Hold LED больше не гасит `offHook` (иначе прошивка шлёт `hookOn` → сброс)
- Hold-sync guard глушит все hardware-события, включая hook
- Mute с гарнитуры — абсолютный `muteChanged`, оба края (mute/unmute)
- Mute с гарнитуры запрещён при focus на исходящий Connecting

## Зачем
- Убрать блокер: hold из session controls bar сбрасывал вызов
- Убрать double-press mute и mute во время набора

## Результат
- `npx vitest run` по headset forward/orchestrator/edge/resolve — 29 passed
