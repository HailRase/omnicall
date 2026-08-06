# Account sign-in server errors → Notification channel

**Дата:** 2026-08-06 15:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/settings/deriveAccountSignInNotificationFeedback.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/hooks/useActionNotifications.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/adr/ADR-0026-feedback-channel-law.md`
- `docs/softphone/UI-Architecture.md`, `UX-UI-Design-Blueprint.md`, `STATUS.md`, `Feature-Registry.md`, `I18N-Coverage.md`

## Что
- Классификатор `classifyAccountSignInErrorPresentation` / `assignAccountSignInErrorChannels` (validation→Alert, server/register→toast)
- `useAccountActions`: `notificationError` отдельно от inline `error`; CTA System State на toast; modal OCP suppress dual
- `useActionNotifications`: notification → `actionable` + CTA; inline → `critical` journal only
- ADR-0026 amendment + anti-desync docs; CHANGELOG `[Unreleased]`

## Зачем
- SIP 403 / registration failed не должны выглядеть как ошибка поля пароля; канал — Notification Center с CTA «Состояние системы».

## Результат
- Targeted vitest: 60/60 green (`deriveAccountSignInNotificationFeedback`, `useAccountActions`, `useActionNotifications`, `AccountPanel`)
- `npm run i18n:check` green
- Manual smoke (остаётся оператору): SIP 403 → toast+CTA без Alert; empty password → Alert; OCP modal failure без dual toast
