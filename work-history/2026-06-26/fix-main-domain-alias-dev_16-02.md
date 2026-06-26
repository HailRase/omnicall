# Fix main process @domain alias for dev build

**Дата:** 2026-06-26 16:02
**Статус:** выполнено
**Коммит:** —

## Где
- `electron.vite.config.ts`

## Что
- Добавлен alias `@domain` в секцию `main.resolve` electron-vite
- Исправлена ошибка Rollup: `failed to resolve import "@domain/platform/ShellWindowLayout.js"`

## Зачем
`ShellWindowController` в main импортирует domain-модуль; без alias dev-сборка падала.

## Результат
`npm run dev` — main/preload/renderer собираются, Electron стартует.
