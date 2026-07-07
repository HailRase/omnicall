# Shell Navigation Phase 3 — Contacts Domain Slice (F-025)

**Дата:** 2026-07-07 21:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/Contact*.ts`, `events/contactEvents.ts`
- `src/ports/settings/ContactRepository.ts`
- `src/adapters/settings/InMemoryContactRepository.ts`
- `src/application/use-cases/{List,Get,Create,Update,Delete,Call}Contact*.ts`
- `src/application/projections/contactsProjection.ts`, `deriveContactsShell.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`, `hooks/useContactActions.ts`
- `docs/softphone/Feature-Registry.md` (F-025)

## Что
- Зарегистрирована фича **F-025 Local Contacts** (Settings, без LF-маппинга).
- Domain: `Contact`, `ContactId`, валидация имени/телефонов, события CRUD.
- Application: 6 Use Cases, projection + deriveContactsShell, facade API.
- In-memory `ContactRepository` + тесты; store projection + `useContactActions`.
- UI экранов контактов не добавлялось (Phase 4).

## Зачем
- Phase 3 master prompt: контакты как domain slice до UI sidebar.

## Результат
- Focused tests: 14/14 passed
- `npm run test`: 1553 passed, 1 skipped; 1 pre-existing sonner teardown error
- `npm run lint` / `npm run typecheck` — green
- Не сделано: contacts UI, file persistence, i18n catalogs, Phase 5 settings route
