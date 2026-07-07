# Откат macOS hotkey-правок

**Дата:** 2026-07-07 15:48
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/lifecycle/darwinApplicationMenuTemplate.ts`
- `src/main/lifecycle/createApplicationMenu.ts`
- `src/main/index.ts`
- удалён `src/main/lifecycle/installDeveloperWebContentsShortcuts.ts`

## Что
- Откат `appMenu`/`editMenu`/`viewMenu` platform roles
- Удалён `installDeveloperWebContentsShortcuts` (F12/Ctrl+Shift+I на Win/Linux)
- Восстановлен предыдущий шаблон меню с ручным Edit + View (dev only)

## Зачем
Пользователь уточнил: задача была про DevTools, а не про macOS hotkeys.

## Результат
Остаётся только DevTools-логика: `webPreferences.devTools` по `!app.isPackaged` и View→`toggleDevTools` на macOS в dev. `vitest run src/main/lifecycle/` — 12 passed.
