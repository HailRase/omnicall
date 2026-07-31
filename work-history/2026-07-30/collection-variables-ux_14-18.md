# Collection variables UX

**Дата:** 2026-07-30 14:18
**Статус:** выполнено
**Коммит:** `cfc066b`

## Где
- `src/domain/integration/external-services/template/normalizeExternalServiceCollectionVariables.ts`
- `src/domain/integration/external-services/template/ExternalServiceVariableCatalog.ts`
- `src/application/services/integration/external-services/mutateExternalServicesCollections.ts`
- `src/renderer/components/settings/external-services/ExternalServicesRequestsView.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesVariablesDialog.tsx`
- `external-services-plan/00-PRODUCT-SPEC.md`, `02-DATA-MODEL.md`, `03-EVENTS-AND-VARIABLES.md`, `05-UI-UX.md`, `11-ACCEPTANCE.md`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, `UI-Component-Catalog.md`

## Что
- Domain normalize/inspect для ключей коллекции (дубликаты, пустой ключ со значением, soft system-name)
- Mutation отклоняет те же ошибки; i18n ru/en/fr/de/bg
- Компактный preview в workspace коллекции: hint, пример, колонка `{{token}}`
- Диалог: пример, live-валидация, предупреждение системных имён, preview токена
- Документация синхронизирована без downgrade

## Зачем
- Сделать переменные коллекции понятными и безопасными от ошибочных действий оператора

## Результат
- `npm run i18n:check` — ok
- vitest: normalize/catalog/mutate/dialog/requests editor — ok
- `tsc -p tsconfig.web.json` — ok
