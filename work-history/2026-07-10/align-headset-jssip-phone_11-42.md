# Align headset with jssip-phone

**Дата:** 2026-07-10 11:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/resolveHangupTargetId.ts`
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/adapters/headset/webhid/hidLedOutput.ts`
- Reference: `C:\Users\User\Desktop\jssip-phone\src\modules\sessionHeadsetOrchestrator\`

## Что
- Mute: toggle только на `muted===true` (как jssip-phone), unmuted bounce игнор
- Hold LED: `offHook:false`+ring → green press = hookOff → resume; guard 2s глушит hookOn echo
- Hangup: hookOn → active/outgoing; held-only не сбрасывается
- Guards не перевзводятся от LED reconcile (корень «через раз» / мёртвых hook)

## Зачем
- Убрать регрессии mute/resume/hangup; конечное поведение как в рабочем jssip-phone

## Результат
- vitest headset: 35 passed (parity suite mute+resume+hangup)
