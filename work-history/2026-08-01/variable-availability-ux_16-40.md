# Variable availability UX (F-031 / F-032)

**Дата:** 2026-08-01 16:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-services/template/ExternalServiceVariableCatalog.ts`
- `src/renderer/components/settings/external-services/templateAutocomplete/`
- `src/renderer/components/settings/external-services/ExternalServicesSystemVariablesHelp.tsx`
- `src/renderer/components/settings/external-applications/ExternalApplicationsVariablesTab.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `external-services-plan/03-EVENTS-AND-VARIABLES.md`, `05-UI-UX.md`, `11-ACCEPTANCE.md`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, `P14-External-Applications-Design.md`

## Что
- Domain helper `resolveExternalServiceSystemVariableAvailability` (в т.ч. `queue_name` → `campaign_acd`)
- Autocomplete: метка `Системная|Коллекция · {when}` без смены runtime resolve
- Variables tab ES: when-подзаголовки групп + строка «вне контекста → undefined»
- Variables tab EA: shared system catalog (browse) + свои переменные «всегда»
- i18n ru/en/fr/de/bg; тесты catalog/autocomplete/panel

## Зачем
- Настройщик видит, когда переменная заполняется, и не получает неожиданный `undefined`

## Результат
- `npm run i18n:check` — OK
- vitest: catalog, autocomplete, template field, messages, EA panel, ES requests editor — OK
- Runtime template merge/resolve не менялся
