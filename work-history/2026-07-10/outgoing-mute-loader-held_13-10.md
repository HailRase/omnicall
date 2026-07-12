# Outgoing mute, sync loader, held mute

**Дата:** 2026-07-10 13:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/resolveDeviceCommandsFromSnapshot.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/buildHeadsetCallSnapshot.ts`
- `src/adapters/headset/webhid/*`
- `src/renderer/components/call/CallControlsBar.tsx`
- `src/application/projections/telephony/multiLineCallProjection.ts`

## Что
- Исходящий mute как входящий: reject → `signalOutgoing`/`signalIncoming` (не голый `setMute`)
- Outbound `Ringing` (CallProgressReceived) в `outgoingInProgressIds`
- Hold LED несёт mute bit — toggle mute на selected held
- Spinner на mute/hold в CallControlsBar при `headset_sync_in_progress`

## Зачем
- Закрыть mute на dial, показать loader при sync, разрешить mute на held

## Результат
- vitest headset + CallControlsBar + multiLine — 84 passed
