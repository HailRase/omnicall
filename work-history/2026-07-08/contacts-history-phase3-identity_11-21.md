# Contacts/History Phase 3 — Caller Identity

**Дата:** 2026-07-08 11:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/read-models/contactDirectory.ts`
- `src/application/projections/deriveCallHistoryShell.ts`
- `src/domain/settings/Contact.ts`
- `src/application/use-cases/CreateContactUseCase.ts`, `UpdateContactUseCase.ts`
- `src/renderer/hooks/useCallHistoryShell.ts`
- `docs/softphone/Feature-Registry.md` (F-013, F-025, F-026)
- `docs/softphone/Contacts-History-Identity-Persistence-Plan.md`

## Что
- Добавлен read model `contactDirectory` с `CallerPresentation` и индексом телефонов
- `deriveCallHistoryShell` обогащает строки истории без мутации `displayLabel` в storage
- `useCallHistoryShell` использует enriched `primaryLabel` и i18n для unknown caller
- Domain `validateContactPhoneUniqueness` + проверка в create/update Use Cases
- i18n ключи duplicate phone и unknown caller для ru/en/fr/de/bg
- Feature Registry: F-026 Caller Identity Presentation; обновлены F-013/F-025

## Зачем
Единообразное отображение имён абонентов в истории звонков через Application read model, с политикой уникальных номеров контактов.

## Результат
- Focused tests: 30 passed (contactDirectory, deriveCallHistoryShell, Contact, ContactUseCases, mapContactValidationErrors)
- `npm run lint` — green
- `npm run typecheck` — green
- `npm run i18n:check` — green
