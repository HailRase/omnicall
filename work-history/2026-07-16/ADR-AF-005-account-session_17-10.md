# ADR-AF-005: вход в аккаунт до SIP-ready

**Дата:** 2026-07-16 17:10
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-AF-005-account-session-before-sip-ready.md`
- `src/domain/shared/events/accountBootstrapEvents.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/use-cases/settings/PromoteAuthorizedSipSessionUseCase.ts`
- `src/application/services/integration/OcpSipCredentialService.ts`
- `src/application/projections/settings/deriveSettingsNavigationAvailability.ts`
- `src/application/projections/integration/deriveOcpSystemStateShell.ts`
- `src/renderer/i18n/messages.ts` (+ bg catalogs)

## Что
- На Login сразу promote профиля/настроек; SIP 403 не откатывает сессию
- Gate Settings и блокировка «Войти» по `hasActiveAccountSession`, не по SIP-ready
- Событие `AccountSessionActivated`; shell `deriveOcpSystemStateShell` для вкладки OCP
- Ключи i18n для System State SIP/OCP; UI tabs вынесены в T-034 `/ui`

## Зачем
- Пользователь получает настройки сразу после входа; статус OCP — в «Состояние системы»

## Результат
- Focused tests green; `npm run typecheck` / `lint` / `i18n:check` green
- Следующий шаг: `/ui` (T-034)
