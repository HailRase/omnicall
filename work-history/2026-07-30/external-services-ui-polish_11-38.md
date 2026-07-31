# External Services UI polish

**Дата:** 2026-07-30 11:38
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-services/*`
- `src/renderer/hooks/useExternalServicesPanel.ts`
- `src/renderer/components/icons/iconCatalog.ts`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `Icon-Registry.md`, `I18N-Coverage.md`
- `external-services-plan/05-UI-UX.md`

## Что
- Центрирование empty states; убран дубль «Журнал» в History; без отступа у children коллекций; компактный method badge
- Breadcrumb click-to-edit rename; исправлен rename запроса из sidebar через диалог
- Quick-add `+` у коллекций; hover у `+`/Import; title create-диалога = «Название коллекции»
- Params/Triggers count badges; body-mode radios; компактные KV/journal; Response/History expand-collapse
- Обновлены i18n (ru/en/fr/de/bg), иконки, тесты, Feature Registry / UI UX docs

## Зачем
- Полировка Settings → Внешние сервисы без потери функций F-031 и без downgrade UX-контракта

## Результат
- `vitest` External Services UI: 15/15 pass
- `npm run typecheck` pass
- `npm run i18n:check` pass
- eslint touched files pass
- `npm run ui:catalog` обновлён
