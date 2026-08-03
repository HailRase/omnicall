# F-032 Multi-App Overlay Preview

**Дата:** 2026-08-03 15:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-applications/WindowGeometryOverlays.tsx`
- `src/renderer/components/settings/external-applications/WindowGeometryOverlayCards.tsx`
- `src/renderer/components/settings/external-applications/useWindowGeometryOverlaySelection.ts`
- `src/renderer/components/settings/external-applications/WindowGeometryEditor.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `P14-External-Applications-Design.md`, `I18N-Coverage.md`

## Что
- Добавлен session-only выбор peer `electron_window` приложений для наложения на 1:10 preview
- Read-only overlay-карточки с геометрией из настроек peer и кнопкой remove
- UI добавления (DropdownMenu) + chip-list с remove; текущее и browser-приложения исключены
- Проводка `applications` Panel → Editor → GeneralTab → WindowGeometryEditor
- i18n `windowGeometry.overlays.*` (ru/en/fr/de/bg) + тесты + docs

## Зачем
- Оператор видит, как окна других External Applications лягут относительно текущего приложения, без изменения persisted settings.

## Результат
- `vitest` ExternalApplicationsPanel + WindowGeometryEditor — 17/17 ✓
- `tsc --noEmit -p tsconfig.web.json` ✓
- `npm run i18n:check` ✓
- `npm run ui:catalog` ✓
