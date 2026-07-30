# External Services Variables/History UI polish

**Дата:** 2026-07-30 17:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `src/domain/integration/external-services/ExternalServiceJournalEntry.ts`
- `src/adapters/settings/externalServicesJournalDocument.ts`
- `src/application/use-cases/integration/ExecuteExternalServiceRequestUseCase.ts`
- `src/application/projections/integration/deriveExternalServicesJournalPanel.ts`
- `src/renderer/components/settings/external-services/ExternalServicesJournalEntry.tsx`
- `src/renderer/components/settings/external-services/ExternalServices.module.css`
- `docs/softphone/Feature-Registry.md` (F-031)

## Что
- Группа Variables `always`: «Всегда» → «Общие» (и General / Général / Allgemein / Общи)
- Journal entry сохраняет HTTP `method`; legacy-файлы без поля → GET
- В свёрнутой History-строке: цветной method badge + вертикальные сепараторы между method / trigger / outcome / status / duration
- `flex-wrap: nowrap`, чтобы высота ряда не росла
- Тесты journal/projection/document обновлены

## Зачем
- Понятная подпись группы общих system-переменных и читаемый collapsed History без потери method/статуса

## Результат
- `npx vitest run` journal/projection/document — 8 passed
- `npm run i18n:check` — passed
