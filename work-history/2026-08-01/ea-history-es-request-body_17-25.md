# History button + journal request body

**Дата:** 2026-08-01 17:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-applications/ExternalApplicationsSidebar.tsx`
- `src/domain/integration/external-services/ExternalServiceJournalEntry.ts`
- `src/application/use-cases/integration/ExecuteExternalServiceRequestUseCase.ts`
- `src/adapters/settings/externalServicesJournalDocument.ts`
- `src/renderer/components/settings/external-services/ExternalServicesJournalEntryDetail.tsx`

## Что
- Кнопка «История» во Внешних приложениях переведена на UI Kit `Button` рядом с «Добавить»
- В журнал F-031 добавлены `requestBody` / `requestBodyTruncated` (truncate 16 KiB)
- History показывает тело запроса только если оно непустое; legacy-записи без поля читаются как пустые
- i18n `journal.requestBody*` для ru/en/fr/de/bg; обновлены Feature Registry и plan docs

## Зачем
- Выровнять UX сайдбара External Applications и показать в истории реально отправленное тело HTTP-запроса

## Результат
- Фокусные тесты Execute/Journal/Panel/document + `i18n:check` + `typecheck` — PASS
- Старые записи истории без тела запроса; новые запуски с body mode ≠ none сохраняют тело
