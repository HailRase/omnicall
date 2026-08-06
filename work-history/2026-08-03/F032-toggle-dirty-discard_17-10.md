# F-032: мгновенный enable/disable и dirty-guard

**Дата:** 2026-08-03 17:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useExternalApplicationsPanel.ts`
- `src/renderer/hooks/useExternalApplicationsPanelNavigation.ts`
- `src/renderer/hooks/externalApplicationsDraftUtils.ts`
- `src/renderer/components/settings/external-applications/*`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `P14-External-Applications-Design.md`, `I18N-Coverage.md`

## Что
- Вкл/выкл через ⋯ сразу сохраняет только `enabled` от последнего saved baseline, не сбрасывая остальные dirty-поля
- Draft vs saved: подсветка выбранного приложения, unsaved hint, Save активен только при dirty
- При уходе с dirty-черновика (другое приложение / история / create / duplicate / rename) — discard dialog как у F-031
- Тесты hook + panel; i18n ru/en/fr/de/bg

## Зачем
- Enable/disable не должен требовать Save и не должен сохранять чужие несохранённые правки; навигация не должна терять dirty без предупреждения

## Результат
- `npx vitest run …useExternalApplicationsPanel.test.tsx …ExternalApplicationsPanel.test.tsx` — 17 passed
- `npx vitest run src/renderer/i18n/messages.test.ts` — passed
