# SIP-only: раздельные уведомления transport/registration

**Дата:** 2026-07-17 16:38
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/AccountSignInOutcome.ts`
- `src/application/projections/settings/deriveAccountSignInNotificationFeedback.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useAccountActions.ts`, `useActionNotifications.ts`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- Исправлен ложный success «SIP подключён, телефон зарегистрирован» при `ok` + `telephony.registration_failed` (ADR-AF-005)
- SIP-only ready даёт два toast: transport connected → registration succeeded
- Ошибки connect/register показывают текст ошибки и CTA «Состояние системы» на самом toast
- Outcome обогащён `detail` + `transportConnected`; Facade трекает `SipTransportConnected`
- i18n ru/en/fr/de/bg + registry/T-043

## Зачем
- Transport и registration ортогональны (ADR-0004); пользователь не должен видеть «зарегистрирован», пока REGISTER не успешен

## Результат
- `npm run test` — 2245 passed / 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
