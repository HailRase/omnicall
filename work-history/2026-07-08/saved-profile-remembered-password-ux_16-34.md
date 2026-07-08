# Saved profile remembered-password UX

**Дата:** 2026-07-08 16:34
**Статус:** выполнено
**Коммит:** `6b16663`

## Где
- `src/application/projections/settings/deriveSavedProfileCredentialPromptState.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/components/settings/SettingsPanel.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/Feature-Registry.md`

## Что
- Добавлена чистая проекция `deriveSavedProfileCredentialPromptState` для видимости поля пароля и remember-password.
- В `useAccountActions` добавлен `forcePasswordEntryForSelectedProfile` с сбросом при смене вкладки/профиля и при ошибке remembered-password входа.
- При remembered password submit вызывается `authorizeSavedAccountProfile(profileId, "", { rememberPassword: false })`.
- `AccountPanel` скрывает поле пароля и remember-password по флагу `passwordFieldVisible`.
- Обновлены тесты hook/panel/projection и acceptance criteria F-024 в Feature Registry.

## Зачем
Исправить UX: при сохранённом пароле в secure storage показывать только кнопку «Войти», без поля пароля и чекбокса remember-password.

## Результат
- `npm run test -- --run` по затронутым файлам: 41/41 PASS
- `npm run i18n:check`: PASS
- Lint по изменённым файлам: без ошибок
