# AccountPanel: crash на account.error.serverRegistration

**Дата:** 2026-07-17 16:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/helpers/formatAccountAuthorizationError.ts`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`

## Что
- Исправлен вызов i18n: `t(key)` без params для function-ключа `account.error.serverRegistration`
- Добавлен `formatAccountAuthorizationError` + тесты
- Форматтеры locales защищены от `params === undefined`

## Зачем
- После SIP «Войти» при `registration_failed` Alert падал с `Cannot read properties of undefined (reading 'detail')`

## Результат
- `npm run test -- AccountPanel / formatAccountAuthorizationError` — green
