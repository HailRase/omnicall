# F-032 illustrated switch previews for raise / always-on-top

**Дата:** 2026-08-03 13:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-applications/WindowBehaviorSwitchRow.tsx`
- `src/renderer/components/settings/external-applications/WindowBehaviorSwitchSchematics.tsx`
- `src/renderer/components/settings/external-applications/WindowBehaviorSwitchSchematicParts.tsx`
- `src/renderer/components/settings/external-applications/WindowBehaviorSwitchPreview.module.css`
- `src/renderer/components/settings/external-applications/WindowBehaviorSwitchSchematics.module.css`
- `src/renderer/components/settings/external-applications/ExternalApplicationsWindowBehavior.tsx`
- `src/renderer/components/settings/external-applications/ExternalApplicationsPanel.test.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, `UI-Component-Catalog.md`

## Что
- У switches raiseOnOpen / alwaysOnTopDuringCall добавлены compact desktop SVG-превью (ON/OFF outcomes)
- CSS-motion с `linear` + `prefers-reduced-motion`; switches остаются boolean-контролами
- i18n caption `windowBehavior.preview.otherWindow` для ru/en/fr/de/bg
- Panel-тесты на toggle intents, наличие SVG и hide при external_browser

## Зачем
- Оператору сразу видно разницу включённого и выключенного поведения окна без смены Select на cards

## Результат
- `npx vitest run …/ExternalApplicationsPanel.test.tsx` — 9/9 PASS
- `npm run i18n:check` — PASS
- `npm run ui:catalog` — обновлён каталог
- Version bump не выполнялся
