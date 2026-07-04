# Post-logout SIP state + account feedback UX

**Дата:** 2026-07-04 18:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/sipSessionHealthProjection.ts`
- `src/application/projections/deriveSipStatusShell.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/i18n/messages.ts`

## Что
- При `RegistrationSucceeded` transport переводится в `connected`, если был `connecting`/`idle` (гонка после logout→login)
- `deriveSipStatusShell` показывает «Зарегистрирован», если registration уже `registered`
- i18n: «Перерегистрация выполнена» вместо «запущена» (ru/en/fr/de)
- Account panel: styled success/error banners, auto-dismiss 3.2s, ключ `account.success.authorizationSucceeded`
- Тесты projection, status shell, AccountPanel, SettingsSystemStatePanel

## Зачем
После выхода и повторной авторизации UI застревал на «Подключение»/«Соединение» при успешной регистрации; неверный текст перерегистрации; некрасивые и «вечные» уведомления в разделе «Аккаунт».

## Результат
- `npm run test` — 1029 passed, 1 skipped
- `npm run lint`, `npm run typecheck`, `npm run i18n:check` — green
