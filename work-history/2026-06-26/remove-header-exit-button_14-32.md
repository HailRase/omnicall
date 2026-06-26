# Убрать кнопку выхода из header

**Дата:** 2026-06-26 14:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/shells/SoftphoneShellHeader.test.tsx`
- `src/renderer/components/header/ShellHeader.stories.tsx`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/Feature-Registry.md`

## Что
- Удалена кнопка `control-end-session` из recovery-ряда header
- Убран проп `sessionLogoutActions` из `SoftphoneShellHeader`
- Строка recovery рендерится только при `showReregisterSipControl`
- Обновлены тесты, Storybook args и usage иконки `session.end`
- F-014 acceptance: выход через `user-menu-logout` в меню аватара

## Зачем
Упростить header: завершение сессии доступно через пункт «Выход» в меню аватара и в настройках аккаунта.

## Результат
`npm run test` — 749 passed, 1 skipped; `lint`, `typecheck`, `ui:catalog` — OK.
