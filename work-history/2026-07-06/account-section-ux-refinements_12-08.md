# Account section UX refinements

**Дата:** 2026-07-06 12:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsAccountPanel.*`
- `src/renderer/components/account/AccountPanel.*`
- `src/renderer/components/account/SavedAccountProfileSelector.*`
- `src/renderer/components/account/SwitchSavedAccountProfileConfirmationModal.*`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/i18n/messages.ts`
- `src/application/projections/formatAccountSwitchLoginLabel.ts`

## Что
- Раздел «Аккаунт» на всю ширину; форма авторизации по центру (`max-width: 20rem`)
- Кнопка «Войти» в режиме пароля — на всю ширину поля ввода
- Кнопка «Удалить» справа в строке табов; удаление через модальное подтверждение с backdrop
- При смене профиля во время активной регистрации — диалог «с {fromLogin} на {toLogin}»
- i18n ключи `account.profile.switch.*` для ru/en/fr/de
- Тесты: switch modal, SettingsAccountPanel, useAccountActions

## Зачем
Улучшить UX раздела аккаунта: полноширинная навигация по профилям, центрированная форма, безопасное удаление и подтверждение смены SIP-профиля.

## Результат
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm run i18n:check` — PASS
- vitest (17 тестов по затронутым модулям) — PASS
