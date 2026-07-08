# History Add To Contacts

**Дата:** 2026-07-08 12:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/history/HistoryShellRoutePanel.tsx`
- `src/renderer/hooks/useContactEditShell.ts`
- `src/renderer/navigation/routeData/`
- `src/renderer/components/history/HistoryDetailPanel.tsx`
- `docs/softphone/Contacts-History-Identity-Persistence-Plan.md`
- `docs/softphone/Feature-Registry.md`

## Что
- Закрыта Phase 7: history detail открывает найденный контакт или форму создания нового контакта.
- Добавлен typed route-data prefill для `contacts/new/edit` без хранения бизнес-данных в URL.
- Prefill использует номер из истории и SIP label только как безопасное начальное имя.
- Убраны прямые Domain imports из `useCallHistoryDetailShell` через Application-facing detail entry contract.
- Добавлены i18n keys для `ru`, `en`, `fr`, `de`, `bg` и focused тесты.

## Зачем
- Оператор может быстро создать контакт из неизвестного номера в истории без дублей и без обхода Domain validation.

## Результат
- `npm run test -- src/application/projections/contacts/deriveCallHistoryDetailShell.test.ts src/renderer/components/history/HistoryDetailPanel.test.tsx src/renderer/hooks/useContactEditShell.test.tsx` — PASS, 10/10.
- `npm run i18n:check` — PASS.
- `npx eslint ...changed files...` — PASS.
- `npm run typecheck` — PASS.
- `npm run registry:check` — PASS.
