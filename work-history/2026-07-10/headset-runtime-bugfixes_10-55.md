# Headset runtime bugfixes (LED/mute/incoming)

**Дата:** 2026-07-10 10:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/buildHeadsetCallSnapshot.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/adapters/headset/webhid/WebHidHeadsetAdapter.ts`
- `src/adapters/headset/webhid/hidLedOutput.ts`

## Что
- Incoming waiting включает `callerIdentityLoading/Resolved` и др. — ring LED больше не гаснет через ~0.3с
- Device→app guard не блокирует clear/hangup/incoming LED; app→device блокирует только mute echo
- Нет LED reconcile / `led_blocked` без подключённого устройства
- Mute/hold time-guard не сбрасывается при match snapshot (анти-эхо)
- `headset_led_output_blocked` только при реальном NotAllowedError

## Зачем
- Починить: ложный toast, LED после hangup, hook после answer, mute sync, incoming control

## Результат
- `npx vitest run src/application/headset` — 32 passed
- `npx tsc --noEmit` — green
