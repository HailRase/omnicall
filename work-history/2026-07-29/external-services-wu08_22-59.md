# F-031 WU-08 External Services UI

**Дата:** 2026-07-29 22:59
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/settingsSections.ts`
- `src/renderer/components/settings/external-services/`
- `src/application/settings/deriveExternalServicesCollectionsPanel.ts`
- `src/application/settings/mutateExternalServicesCollections.ts`
- `src/renderer/hooks/useExternalServicesShell.ts`
- `src/renderer/hooks/useExternalServicesActions.ts`
- `docs/softphone/Feature-Registry.md` (F-016/F-031)

## Что
- Leaf `integrations-external-services` в Integrations beside OCP; SDK top-level сохранён
- UI-safe summaries/mutations + facade-backed shell/actions/panel hooks
- Collections UI: loading/empty/error, toggle, CRUD/duplicate/import/export, variables, journal anchor
- i18n ru/en/fr/de/bg; nav/panel/component tests + light/dark stories
- Обновлены PROGRESS, handoff, STATUS, I18N-Coverage, Feature Registry

## Зачем
- Settings UI управления коллекциями External Services без редактора запросов и журнала записей

## Результат
- Focused vitest PASS; `typecheck` / `i18n:check` / `ui:catalog` / `registry:check` PASS; версия не повышалась
- Next: `Implement WU-09 from external-services-plan/10-WORK-UNITS.md`
