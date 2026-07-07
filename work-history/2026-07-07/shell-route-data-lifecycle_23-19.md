# Shell route data lifecycle refactor

**Дата:** 2026-07-07 23:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/navigation/routeData/*`
- `src/renderer/hooks/useContactsShell.ts`
- `src/renderer/hooks/useCallHistoryShell.ts`
- `src/renderer/hooks/useContactDetailsShell.ts`
- `src/renderer/hooks/useContactEditShell.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/shells/contacts/ContactsShellRoutePanel.tsx`
- `src/renderer/shells/history/HistoryShellRoutePanel.tsx`

## Что
- Добавлен слой route lifecycle: `ShellRouteDataController`, `useShellRouteDataLoader`, контроллеры contacts/history, `useShellRouteDataStore`, `loadCoordinator`.
- Из shell hooks убраны `useEffect`-загрузки (`loadContacts`, `loadHistory`, `getContact`).
- Shell hooks переведены на projection → localized view-model; edit hook держит только form state с init по route token.
- `ShellRouteDataController` смонтирован в `SoftphoneReadyShell` overlay layer.
- Добавлены тесты: route enter once, StrictMode dedupe, direct contact route, invalid id без facade, race A→B, edit form не перезаписывается projection refresh.

## Зачем
Убрать хрупкую feature-loading логику из renderer shell hooks и централизовать side effects в явном route lifecycle слое без big-bang refactor.

## Результат
- `npm run test` — pass
- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm run i18n:check` — pass
- `npm run ui:catalog` — pass
