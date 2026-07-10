# Block headset mute on outgoing

**Дата:** 2026-07-10 13:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/resolveDeviceCommandsFromSnapshot.ts`
- тесты orchestrator / forward / resolveDeviceCommands

## Что
- Усилил запрет mute с гарнитуры: `focusReason === "outgoing"` и любой pending outgoing dial
- При mute-событии в pre-connect — не зовём app mute, шлём `setMute(false)` (сброс firmware LED/mic)
- На LED outgoing dial всегда добавляется `setMute(false)`

## Зачем
- На исходящем звонке mute с гарнитуры не должен переключать микрофон

## Результат
- `npx vitest run src/application/headset` — 58 passed
