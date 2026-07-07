# DevTools только в dev-режиме

**Дата:** 2026-07-07 15:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/lifecycle/resolveMainProcessDevMode.ts`
- `src/main/lifecycle/darwinApplicationMenuTemplate.ts`
- `src/main/lifecycle/createApplicationMenu.ts`
- `src/main/index.ts`
- `src/main/lifecycle/*.test.ts`
- `docs/softphone/Feature-Registry.md` (F-016)

## Что
- Добавлен `resolveMainProcessDevMode` / `isMainProcessDevMode` на базе `!app.isPackaged`
- `webPreferences.devTools` включается только в unpackaged dev/preview
- macOS dev-сборка получает минимальное View-меню с `toggleDevTools` (Cmd+Option+I)
- Production macOS-меню остаётся App + Edit без View
- Unit-тесты для dev-mode resolver и View-меню; обновлены acceptance criteria F-016

## Зачем
Разрешить отладку через DevTools в `npm run dev`, но заблокировать DevTools в packaged production.

## Результат
`vitest run src/main/lifecycle/` (12 passed), `npm run lint`, `npm run typecheck` — OK.
