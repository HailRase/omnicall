# Rollback headset to post-13:10

**Дата:** 2026-07-10 14:11
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/resolveDeviceCommandsFromSnapshot.ts`
- `src/adapters/headset/webhid/hidLedOutput.ts`
- тесты headset + CallControlsBar

## Что
- Откат post-13:10: убраны settleHoldIntent / HOLD_LED_MUTE_ECHO / armHardwareMuteEcho
- Mute снова jssip toggle-on-true (`event.muted === true` → `!focusedIsMuted`)
- Убраны suppressMuteOnlyLed и double-write в `syncLedOnHold`
- `beginMuteSessionSync` снова ставит muteEcho 300ms; `clearHoldIntent` обнуляет holdGuard
- `resolveInitialConnectCommands` снова шлёт `answer` + `setMute` (в т.ч. false)
- Удалены work-history: preserve-mute-on-hold, absolute-mute-hold-echo, mute-beep-hold-led

## Зачем
- Вернуть стабильное состояние после `outgoing-mute-loader-held_13-10` без последующих экспериментов

## Результат
- `npx vitest run src/application/headset src/adapters/headset src/renderer/components/call/CallControlsBar.test.tsx` — 71 passed
