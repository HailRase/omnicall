# Phase 4: Contacts UI (F-025)

**Дата:** 2026-07-07 21:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/contacts/ContactsShellRoutePanel.tsx`
- `src/renderer/components/contacts/*`
- `src/renderer/hooks/useContactsShell.ts`, `useContactDetailsShell.ts`, `useContactEditShell.ts`
- `src/renderer/helpers/mapContactValidationErrors.ts`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md` (F-025 → implemented)

## Что
- Sidebar UI для `/contacts`, `/contacts/:id`, `/contacts/:id/edit` и `/contacts/new/edit` поверх dialpad/call shell
- Список, детали, форма create/edit, delete confirmation, call → dialpad
- Точка входа «Контакты» в меню аватара
- i18n ru/en/fr/de/bg для всех видимых строк
- Тесты: `ContactsPanelShell.test.tsx`, `mapContactValidationErrors.test.ts`, обновлён `UserAvatarMenu.test.tsx`

## Зачем
- Phase 4 handoff: projection-driven contacts UI без нарушения shell/call baseline

## Результат
- `npm run test` — PASS (полный suite)
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run ui:catalog` — PASS
- `npm run i18n:check` — FAIL (pre-existing: hardcoded dev error в `FormField.tsx`, вне scope Phase 4)
