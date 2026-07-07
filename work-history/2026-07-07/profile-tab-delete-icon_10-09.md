# Иконка удаления на вкладках профиля

**Дата:** 2026-07-07 10:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/SavedAccountProfileSelector.tsx`
- `src/renderer/components/account/DeleteSavedAccountProfileConfirmationModal.tsx`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`

## Что
- Убрана общая кнопка «Удалить» справа от списка вкладок профилей
- На каждой вкладке сохранённого профиля добавлена иконка удаления (`IconControlButton`)
- Удаление вызывается по `profileId` конкретной вкладки, без привязки к текущему выбору
- Диалог подтверждения переведён на UI Kit `AlertDialog` с порталом и overlay
- Обновлены тесты селектора профилей и модального окна подтверждения

## Зачем
Упростить UX: удаление профиля доступно прямо на его вкладке с явным подтверждением через alert dialog.

## Результат
`npm run test` — 1475 passed; `npm run lint` и `npm run typecheck` — OK.
