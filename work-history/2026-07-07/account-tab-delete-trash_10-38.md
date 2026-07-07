# Удаление сохранённого профиля — иконка корзины на табе

**Дата:** 2026-07-07 10:38
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/SavedAccountProfileSelector.tsx`
- `src/renderer/components/account/DeleteSavedAccountProfileConfirmationModal.tsx`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/components/icons/iconCatalog.ts`
- `src/renderer/i18n/messages.ts`, `locales/bg-strings.json`
- `docs/softphone/Icon-Registry.md`

## Что
- На каждом сохранённом табе профиля — красная иконка корзины (`Trash2`, semantic `account.profile.delete`)
- Клик по корзине вызывает `onDeleteRequest` → `AlertDialog` UI Kit с подтверждением
- Подтверждение удаляет профиль через `useAccountActions.confirmDeleteSelectedProfile`
- Добавлены i18n-ключи `icons.account.profile.delete` (ru/en/fr/de/bg)
- Расширены тесты `SettingsAccountPanel` (клик корзины + confirm)

## Зачем
UX удаления сохранённого SIP-профиля в настройках «Аккаунт» с явной иконкой корзины и блокирующим подтверждением.

## Результат
- `npm run test` (account + SettingsAccountPanel): 28/28 PASS
- `npm run lint`, `npm run typecheck`: PASS
- `npm run i18n:check`: FAIL (pre-existing `FormField.tsx`, не связано с задачей)
