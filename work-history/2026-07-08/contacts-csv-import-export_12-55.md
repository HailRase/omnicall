# Contacts CSV Import Export

**Дата:** 2026-07-08 12:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/import-export/ContactCsvCodec.ts`
- `src/application/use-cases/contacts/ImportContactsCsvUseCase.ts`
- `src/application/use-cases/contacts/ExportContactsCsvUseCase.ts`
- `src/ports/settings/ContactCsvFileGateway.ts`
- `src/shared/ipc/ContactsCsvFileContract.ts`
- `src/main/contacts/registerContactsCsvIpc.ts`
- `src/adapters/platform/PreloadContactCsvFileGateway.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useContactActions.ts`
- `src/renderer/components/contacts/ContactsImportSummaryPanel.tsx`
- `src/renderer/shells/contacts/ContactsShellRoutePanel.tsx`
- `docs/softphone/Contacts-History-Identity-Persistence-Plan.md`
- `docs/softphone/Feature-Registry.md`

## Что
- Закрыта Phase 8: импорт/экспорт контактов через CSV с per-account изоляцией.
- Добавлены pure parser/serializer, Use Cases, typed IPC `contacts-csv:*`, main/preload gateway.
- Facade orchestrates open/save dialogs + import/export без filesystem в React.
- Toolbar CSV menu, import summary dialog, notifications и i18n `ru/en/fr/de/bg`.
- Import policy: create-only, skip duplicate normalized phones, row-level validation summary.

## Зачем
- Оператор может переносить контакты между локальными профилями и внешними инструментами без обхода архитектурных границ.

## Результат
- Focused tests — PASS (15/15 CSV/contacts UI subset).
- `npm run typecheck` — PASS.
- `npm run i18n:check` — PASS.
- `npm run registry:check` — PASS.
