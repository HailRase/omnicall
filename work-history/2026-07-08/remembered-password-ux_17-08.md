# Remembered-password UX for saved SIP profiles

**Дата:** 2026-07-08 17:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/projections/settings/deriveSavedProfileCredentialPromptState.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `docs/softphone/P11-Local-Account-Profiles-Design.md`

## Что
- Добавлены `forgetRememberedSipPassword` и `getActiveSipAccount` в `AccountBootstrapFacade`
- Проекция `deriveSavedProfileCredentialPromptState` расширена флагом `forgetRememberedPasswordVisible`
- `useAccountActions`: forget handler, active-session password preload для `savedFull`, очистка пароля при logout
- `AccountPanel`: кнопка «Забыть сохранённый пароль» для remembered-профиля
- i18n ключи `account.profile.rememberPassword.forget*` для ru/en/fr/de/bg
- Тесты facade/hook/panel и обновление Feature Registry + P11 design

## Зачем
Корректный UX запомненного пароля: явный Sign in без поля пароля, локальное забывание секрета, отображение in-memory пароля активной сессии в полной форме.

## Результат
- `npm run test -- AccountBootstrapFacade` — PASS (26)
- `npm run test -- useAccountActions` — PASS (20)
- `npm run test -- AccountPanel` — PASS (11)
- `npm run test -- SettingsAccountPanel` — PASS (12)
- `npm run i18n:check` — PASS
- `npm run typecheck` — PASS
- `npm run lint` — PASS (1 pre-existing warning в `useOverlayShell.ts`)
- `npm run registry:check` — PASS
