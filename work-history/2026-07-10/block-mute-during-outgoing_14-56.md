# Block mute during outgoing dial

**Дата:** 2026-07-10 14:56
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/telephony/deriveCallLinesShell.ts`
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/services/headset/HeadsetIntegrationService.ts`
- i18n: `messages.ts`, `bgMessages.ts`

## Что
- Mute/unmute UI disabled на всех сессиях, пока идёт исходящий Connecting/Ringing
- `confirmUiMuteSync` после успешного mute/unmute
- Busy-timer покрывает intent timeout (loader не зависает навечно)
- Abort stale mute-sync на non-focus сессии при активном outgoing

## Зачем
- Бесконечный loader при mute held во время гудков исходящего

## Результат
- vitest headset + deriveCallLinesShell + CallControlsBar — 80 passed
- `npm run i18n:check` — passed
