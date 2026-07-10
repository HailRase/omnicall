# Headset exclusive mute/hold sync locks

**Дата:** 2026-07-10 12:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/forwardHeadsetHardwareEvent.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/services/headset/HeadsetIntegrationService.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/projections/headset/applyHeadsetSyncBusyToActiveCallControls.ts`
- `src/renderer/hooks/useCallFeatureShell.ts`

## Что
- Exclusive lock: второй mute/hold (UI или гарнитура) отклоняется, пока intent не выполнен
- UI busy по pending intent → CallControlsBar и call lines блокируют mute/hold/resume
- При ошибке Use Case — abort sync (не залипает)
- Mute с гарнитуры запрещён на incoming/outgoing (pre-connect); UI уже блокировал Connecting/Ringing
- Safety prune intent по таймеру, если snapshot так и не совпал

## Зачем
- Убрать рассинхрон от быстрых кликов mute/hold между гарнитурой и session control bar

## Результат
- vitest headset+projections: 56 passed
- CallControlsBar + facade: 31 passed
