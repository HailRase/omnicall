# Contacts/History Phase 5 — History Detail UI

**Дата:** 2026-07-08 12:26
**Статус:** выполнено
**Коммит:** `50d5b81`

## Где
- `src/application/use-cases/contacts/GetCallHistoryEntryUseCase.ts`
- `src/application/projections/contacts/deriveCallHistoryDetailShell.ts`
- `src/renderer/components/history/HistoryDetailPanel.tsx`
- `src/renderer/hooks/useCallHistoryDetailShell.ts`
- `src/renderer/shells/history/HistoryShellRoutePanel.tsx`
- `src/renderer/navigation/` (historyDetails route + route-data)

## Что
- Добавлен `GetCallHistoryEntryUseCase` и метод `AccountBootstrapFacade.getCallHistoryEntry`.
- Расширена навигация: маршрут `historyDetails` (`/history/:entryId`), route-data store/loader для одной записи.
- Реализованы `deriveCallHistoryDetailShell`, `useCallHistoryDetailShell`, `HistoryDetailPanel` (hero, redial, metadata).
- Список истории открывает detail по клику на строку; back возвращает к `/history`.
- i18n ключи `history.detail.*` для ru/en/fr/de/bg; тесты Application/Renderer/Navigation.

## Зачем
- Phase 5 плана `Contacts-History-Identity-Persistence-Plan.md`: iPhone-like просмотр записи истории без delete/add-to-contacts (Phase 6/7).

## Результат
- `npm run test` (focused 26 tests) — pass
- `npm run i18n:check` — pass
- `npx tsc --noEmit -p tsconfig.web.json` — pass
- Следующий шаг: Phase 6 — Delete History Entry
