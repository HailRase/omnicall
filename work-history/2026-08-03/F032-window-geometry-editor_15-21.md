# F-032 Window Geometry Editor UI

**Дата:** 2026-08-03 15:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-applications/WindowGeometryEditor.tsx` (+ Preview/Presets/Size/Position, CSS, math)
- `src/renderer/components/settings/external-applications/ExternalApplicationsGeneralTab.tsx`
- `src/renderer/components/settings/external-applications/ExternalApplicationsPanel.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `P14-External-Applications-Design.md`, `I18N-Coverage.md`, `UI-Component-Catalog.md`

## Что
- Добавлен редактор геометрии окна внизу вкладки General (только `electron_window`)
- Пресеты размера, свободные W×H/X/Y, live-превью 1:10 с drag и стрелками
- Удалён дублирующий mid-tab grid ширины/высоты; тип `window` в панели дополнен `x`/`y`
- Extension point `overlaySlot` для Agent 3; i18n ru/en/fr/de/bg; тесты panel + editor + math

## Зачем
- Дать оператору наглядную настройку размера и позиции screen-pop окна до открытия

## Результат
- `npx vitest run` …WindowGeometry* + ExternalApplicationsPanel.test — 18 passed
- `npm run css:types`, `npm run ui:catalog`, `npm run lint:css` / `tsc -p tsconfig.web.json` — без ошибок по затронутым файлам
- Версию package не бампили; коммит не создавали
