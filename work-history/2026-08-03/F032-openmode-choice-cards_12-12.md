# F-032 openMode illustrated choice cards

**Дата:** 2026-08-03 12:12
**Статус:** выполнено
**Коммит:** `ae968b7`

## Где
- `src/renderer/components/ui/radio-group/`
- `src/renderer/components/settings/external-applications/OpenModeChoiceCards.tsx`
- `src/renderer/components/settings/external-applications/OpenModeSchematics.tsx`
- `src/renderer/components/settings/external-applications/ExternalApplicationsGeneralTab.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/ui-kit/UI-KIT.md`, `docs/softphone/Feature-Registry.md`, `docs/softphone/UI-Component-Catalog.md`

## Что
- Добавлен UI Kit `RadioGroup` / `RadioGroupItem` (Radix, CSS Modules, Storybook light/dark, тесты, barrel export)
- Select `openMode` заменён на illustrated radio cards (`electron_window` / `external_browser`) со статическими SVG-схемами
- i18n описаний режимов для ru/en/fr/de/bg
- Обновлены panel-тесты, Feature Registry F-032, UI catalog, I18N-Coverage
- Version bump не делался (UX enhancement существующего F-032, не release cut)

## Зачем
- Оператору проще понять исход выбора open mode до сохранения, без live preview окон/браузера

## Результат
- `npx vitest run …/RadioGroup.test.tsx …/ExternalApplicationsPanel.test.tsx` — 14 passed
- `npm run i18n:check` — passed
- `npm run ui:catalog` — обновлён каталог
