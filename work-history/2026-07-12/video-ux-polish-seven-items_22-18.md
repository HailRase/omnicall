# Video UX polish — 7 пунктов

**Дата:** 2026-07-12 22:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/media/resolveVideoCallAvailability.ts`, `src/renderer/hooks/useDialpadShell.ts`
- `src/renderer/components/dialpad/Dialpad.module.css`
- `src/renderer/components/call/IncomingCallSessionCard.module.css`, `IncomingCallOverlay.module.css`
- `src/renderer/styles/tokens.css`
- `src/application/services/telephony/CallEngine.ts`, `src/domain/media/events/videoMediaEvents.ts`
- `src/renderer/hooks/useVideoCallNotifications.ts`, `src/application/facades/AccountBootstrapFacade.ts`
- `src/domain/settings/UserSettings.ts` (schema v6), `SettingsVideoPanel.tsx`

## Что
- Tooltip видео: приоритет «Не зарегистрирован» как у «Позвонить», invalid number только после SIP/политик
- Dialpad: единый зелёный блок с мягким inset-разделителем
- Incoming card: тонкая inset-обводка выбора вместо жирного outline
- Кнопка видео в overlay/session card: убрана лишняя обводка
- Overlay/session: более прозрачный blur (iPhone-like токены)
- Исходящий video→audio downgrade при audio-only ответе + toast `notification.video.remoteAudioOnly`
- Настройка `enableLocalVideoAfterConnect` (schema v6) + автокамера после `CallAnswered`

## Зачем
Устранить UX-регрессии dialpad/incoming/video и согласовать поведение видео с реальным ответом абонента и пользовательскими предпочтениями.

## Результат
`CallEngine.test`, `migrateUserSettings.test`, `Dialpad.test`, `i18n:check`, `typecheck`, settings fixtures — passed
