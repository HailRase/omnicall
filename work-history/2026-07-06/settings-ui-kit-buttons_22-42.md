# Settings module — UI Kit buttons migration

**Дата:** 2026-07-06 22:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/` — overlay, sidebar, panel, panels/*
- `src/renderer/components/settings/SettingsForm.module.css` — удалены legacy primary/secondary

## Что
- Все `<button>` и `IconControlButton` в модуле настроек заменены на UI Kit `Button` / `IconButton`
- Primary/secondary actions, segment controls, nav rail, drag handles, backdrop scrim — через UI Kit
- Удалены дублирующие CSS-классы `.primary-button`, `.secondary-button`, `.button-loading`, `.button-spinner`
- CSS overrides для nav, backdrop, segment и drag-handle совместимы с UI Kit base styles

## Зачем
- Единый визуальный baseline UI Kit в модуле настроек; подготовка к дальнейшей миграции product UI.

## Результат
- `npm run test -- --run src/renderer/components/settings` — 46 passed
- `npm run lint` — ok
- `npm run typecheck` — ok
