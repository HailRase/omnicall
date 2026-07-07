# Fix infinite history/contacts load loop

**Дата:** 2026-07-07 22:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useCallHistoryShell.ts`
- `src/renderer/hooks/useContactsShell.ts`
- `src/renderer/hooks/useCallHistoryActions.ts`
- `src/renderer/hooks/useContactActions.ts`
- `src/renderer/hooks/useContactDetailsShell.ts`
- `src/renderer/hooks/useContactEditShell.ts`
- `src/renderer/hooks/useContactsAndHistoryShellLoad.test.tsx`

## Что
- Устранён бесконечный цикл `call_history_listed` / `contacts` load: `useEffect` зависел от объекта `actions`, пересоздававшегося каждый рендер
- Зависимости эффектов переведены на стабильные колбэки (`loadHistory`, `loadContacts`, `getContact`, …)
- Возвращаемые объекты action-хуков мемоизированы через `useMemo`
- Добавлены тесты: один load на активный route при повторных re-render

## Зачем
- Открытие «История звонков» / «Контакты» не должно спамить Use Case и консоль

## Результат
- `vitest` focused — 2/2 PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
