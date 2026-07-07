# macOS edit shortcuts restore

**Дата:** 2026-07-07 15:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/lifecycle/createApplicationMenu.ts`
- `src/main/lifecycle/darwinApplicationMenuTemplate.ts`
- `src/main/lifecycle/darwinApplicationMenuTemplate.test.ts`
- `vitest.config.ts`
- `docs/softphone/Feature-Registry.md` (F-016)

## Что
- Диагностирована причина: F-016 заменил дефолтное меню Electron на минимальное без Edit roles
- Добавлен macOS Edit submenu с нативными roles (copy/paste/cut/selectAll/undo/redo)
- Вынесен тестируемый шаблон `buildDarwinApplicationMenuTemplate`
- Добавлены unit-тесты и включён `src/main/**/*.test.ts` в vitest
- Обновлены acceptance criteria F-016 в Feature Registry

## Зачем
Восстановить Cmd+A/C/V/X/Z в полях ввода на macOS без возврата полного File/View/Window/Help меню.

## Результат
`npm run test` (darwinApplicationMenuTemplate + AppShutdownCoordinator), `npm run lint`, `npm run typecheck` — OK. Проверка на Mac: Cmd+A/C/V в input/textarea после пересборки.
