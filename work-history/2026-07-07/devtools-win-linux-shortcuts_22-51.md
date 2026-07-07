# DevTools shortcuts для Windows/Linux в dev

**Дата:** 2026-07-07 22:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/lifecycle/installDeveloperWebContentsShortcuts.ts`
- `src/main/lifecycle/installDeveloperWebContentsShortcuts.test.ts`
- `src/main/index.ts`
- `docs/softphone/Feature-Registry.md` (F-016)

## Что
- Добавлен `installDeveloperWebContentsShortcuts` для F12 и Ctrl+Shift+I на Win/Linux
- Подключён в `createMainWindow` только для unpackaged dev (`!app.isPackaged`)
- macOS по-прежнему использует View → Toggle DevTools; production без DevTools
- Unit-тесты для shortcut detection и guard-условий

## Зачем
На Windows/Linux меню отключено (`Menu.setApplicationMenu(null)`), поэтому стандартные accelerators Electron не работали, хотя `webPreferences.devTools` уже был включён в dev.

## Результат
`vitest run src/main/lifecycle/` — 18 passed. В `npm run dev`: F12 или Ctrl+Shift+I открывают DevTools; в packaged prod — заблокировано.
