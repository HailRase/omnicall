# AlertDialog подтверждение удаления профиля

**Дата:** 2026-07-07 13:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/DeleteSavedAccountProfileConfirmationModal.tsx`
- `src/renderer/components/ui/alert-dialog/AlertDialog.module.css`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx` (подключение без изменений)

## Что
- Подтверждение удаления профиля переведено на канон UI Kit: `Button` ghost/destructive вместо `IconControlButton`
- `AlertDialog` поднят на `--z-modal`, чтобы диалог отображался поверх fullscreen-настроек
- Удалены локальные стили модалки; заголовок и описание через `AlertDialogTitle`/`AlertDialogDescription`
- Обновлены тесты модалки и панели аккаунта

## Зачем
При нажатии на иконку удаления в настройках аккаунта пользователь должен видеть блокирующий AlertDialog из UI Kit с явными кнопками «Отмена» / «Удалить».

## Результат
- `npm run test` (21 тест по затронутым файлам) — passed
- `npm run lint` — passed
- `npm run typecheck` — passed
