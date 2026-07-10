# Headset LED focus sync (WU-B)

**Дата:** 2026-07-10 10:35
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/resolveDeviceCommandsFromSnapshot.ts`
- `src/application/headset/resolveDeviceCommandsFromSnapshot.test.ts`
- `docs/softphone/handoffs/P10-Headset-Integration-Handoff.md`
- `docs/softphone/Feature-Registry.md`

## Что
- LED reconcile переведён на focus: Held selected → `setHoldIndicator`, Active → `answer` + `setMute`
- Incoming по-прежнему блокирует прочие LED-команды
- Outgoing больше не глушит hold LED, если focus на Held
- `resolveInitialConnectCommands` выравнивает LED по focus при connect/resync

## Зачем
- Синхронизировать индикаторы гарнитуры с выбранной сессией (мультисессии)

## Результат
- `npx vitest run src/application/headset` — 20 passed
