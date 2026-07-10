# Headset fault notifications and regression (WU-F/G)

**Дата:** 2026-07-10 10:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/headset/events/headsetEvents.ts`
- `src/application/projections/headset/headsetConnectionProjection.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/adapters/headset/webhid/WebHidHeadsetAdapter.ts`
- `src/renderer/hooks/useActionNotifications.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`

## Что
- Domain event `HeadsetFaultOccurred` (connect/unsupported/usb/device/led)
- Projection `lastFaultReason` / `lastFaultAt`; clear on reconnect
- USB unplug → fault + disconnect; LED block toast once per session
- Toast с инструкцией оператору (ru/en/fr/de/bg)
- Reconnect: `onDeviceConnected` сбрасывает led-fault flag и resync LED

## Зачем
- Оператор видит сбой гарнитуры и знает, что сделать; после reconnect состояние подтягивается

## Результат
- vitest headset + projections + useActionNotifications — 34+ passed
- `npm run i18n:check` — passed
- `npx tsc --noEmit` — green
