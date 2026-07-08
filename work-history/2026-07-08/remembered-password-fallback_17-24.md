# Remembered-password fallback по типу ошибки

**Дата:** 2026-07-08 17:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/settings/shouldRevealPasswordEntryAfterRememberedSignInFailure.ts`
- `src/application/projections/settings/shouldRevealPasswordEntryAfterRememberedSignInFailure.test.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/hooks/useAccountActions.test.ts`

## Что
- Добавлен чистый хелпер `shouldRevealPasswordEntryAfterRememberedSignInFailure` для классификации ошибок remembered-password sign-in
- `useAccountActions` раскрывает ручной ввод пароля только при auth/secret/validation ошибках, не при 403 и сетевых сбоях
- Тесты: 403 сохраняет compact UI; Authentication Error и secret_load_failed раскрывают пароль
- Обновлён тест переключения профиля после auth-failure fallback

## Зачем
Исправить баг: после 403 Forbidden не должен раскрываться пароль и чекбокс «Запомнить пароль» — только сообщение об ошибке регистрации.

## Результат
- `npm run test -- shouldRevealPasswordEntryAfterRememberedSignInFailure` — 8 passed
- `npm run test -- useAccountActions` — 23 passed
- `npm run test -- mapAccountAuthorizationError` — 8 passed
- `npm run test -- AccountPanel` — 28 passed
- `npm run i18n:check` — passed
- `npm run typecheck` — passed
- `npm run lint` — passed (1 pre-existing warning в useOverlayShell.ts)
