# Phase 6: Delete History Entry

**Дата:** 2026-07-08 12:33
**Статус:** выполнено
**Коммит:** `34ae550`

## Где
- `src/domain/settings/events/callHistoryEvents.ts`
- `src/ports/settings/CallHistoryRepository.ts`
- `src/adapters/settings/InMemoryCallHistoryRepository.ts`, `FileCallHistoryRepository.ts`
- `src/application/use-cases/contacts/DeleteCallHistoryEntryUseCase.ts`
- `src/application/projections/contacts/callHistoryProjection.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useCallHistoryActions.ts`, `useCallHistoryDetailShell.ts`
- `src/renderer/components/history/HistoryDetailPanel.tsx`, `HistoryDeleteConfirmationModal.tsx`
- `src/renderer/shells/history/HistoryShellRoutePanel.tsx`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `Contacts-History-Identity-Persistence-Plan.md`

## Что
- Добавлен `CallHistoryDeleted` domain event и `deleteEntry` в `CallHistoryRepository`.
- Реализован `DeleteCallHistoryEntryUseCase` с публикацией события и логированием.
- In-memory и file-репозитории удаляют запись и атомарно персистят JSON.
- `callHistoryProjection` убирает строку по событию без reload.
- Facade/action hook `deleteCallHistoryEntry` с success/error toast.
- iPhone-like danger group в `HistoryDetailPanel` + `AlertDialog` подтверждение.
- После успешного удаления навигация возвращает на список истории.
- i18n ключи для ru/en/fr/de/bg; Feature Registry и план обновлены.

## Зачем
Безопасное удаление одной записи истории звонков per-account с подтверждением, персистенцией на диск и синхронизацией projection — Phase 6 плана contacts/history identity.

## Результат
- Focused tests: 21 passed (use case, projection, adapters, UI panel).
- `npm run i18n:check` — passed.
- `npx tsc --noEmit` — passed.
- Следующий шаг: Phase 7 — Add Unknown Number To Contacts.
