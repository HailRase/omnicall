# Template autocomplete для External Services

**Дата:** 2026-07-30 21:47
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-services/templateAutocomplete/`
- `ExternalServicesRequestEditor.tsx`, `ExternalServicesRequestUrlBar.tsx`, `ExternalServicesKeyValueTable.tsx`
- `src/renderer/hooks/useExternalServicesPanel.ts`
- `external-services-plan/05-UI-UX.md`, `11-ACCEPTANCE.md`
- `docs/softphone/Feature-Registry.md` (F-031)

## Что
- Чистая логика детекта сессии `{{…` + фильтрация system/collection suggestions
- Popup-autocomplete в URL, Params/Headers values и Body
- Caret-aware Insert из вкладки Variables
- i18n `variables.autocomplete*` (ru/en/fr/de/bg), тесты helpers + field UI

## Зачем
- Ускорить набор шаблонов без запоминания имён переменных и без костылей в Domain

## Результат
- `npm test -- --run …/templateAutocomplete …/ExternalServicesRequestsEditor.test.tsx` — PASS (38)
- `npm run typecheck` — PASS
- `npm run i18n:check` — PASS
- `npm run ui:catalog` — PASS
