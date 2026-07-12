# Hold: mute UI preserve, LED off

**Дата:** 2026-07-10 14:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/resolveDeviceCommandsFromSnapshot.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/adapters/headset/webhid/hidLedOutput.ts`
- `docs/softphone/Feature-Registry.md` (F-012)

## Что
- Hold LED всегда без mute bit (`setHoldIndicator muted:false`) — красный гаснет
- Mute сессии в app/controls bar не трогаем; mute LED на hold не шлём
- После hold/resume LED — `armHardwareMuteEcho` глотает firmware `muteChanged` (без unmute)
- Resume по-прежнему шлёт `answer` + `setMute(session)`

## Зачем
- Hold не должен включать выключенный микрофон в controls bar; на гарнитуре mute LED гаснет до resume

## Результат
- `npx vitest run src/application/headset` — 64 passed
