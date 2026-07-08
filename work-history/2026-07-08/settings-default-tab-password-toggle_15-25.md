# Settings default tab and password visibility

**Дата:** 2026-07-08 15:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/settings/deriveDefaultSettingsSection.ts`
- `src/renderer/hooks/useOverlayShell.ts`
- `src/renderer/components/account/AccountPasswordField.tsx`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/Feature-Registry.md` (F-016)

## Что
- Добавлена projection `deriveDefaultSettingsSection`: account при неавторизованном SIP, general при регистрации
- `useOverlayShell` открывает настройки на нужной вкладке и редиректит `#/settings` → account для гостя
- Компонент `AccountPasswordField` с toggle показа/скрытия пароля и иконками `form.password.show/hide`
- i18n для 5 локалей, тесты projection/hook/account panel, обновлён Feature Registry

## Зачем
Улучшить UX входа в настройки и ввода SIP-пароля: неавторизованный пользователь сразу видит аккаунт, авторизованный — общие настройки; пароль можно проверить перед отправкой.

## Результат
`npm run test` — 1478 passed, 1 skipped; `npm run lint`, `typecheck`, `i18n:check` — green.
