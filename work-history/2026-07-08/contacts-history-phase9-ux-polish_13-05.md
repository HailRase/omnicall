# Contacts/History Phase 9 UX polish

**Дата:** 2026-07-08 13:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useDialogReturnFocus.ts`, `useRestoreRouteFocus.ts`
- `src/renderer/components/history/HistoryDetailPanel.*`, `HistoryDeleteConfirmationModal.tsx`, `HistoryPanelShell.tsx`
- `src/renderer/components/contacts/ContactsPanelShell.*`, `ContactDeleteConfirmationModal.tsx`, `ContactsImportSummaryPanel.tsx`
- `src/renderer/shells/history/HistoryShellRoutePanel.tsx`, `src/renderer/shells/contacts/ContactsShellRoutePanel.tsx`
- Storybook: `HistoryDetailPanel.stories.tsx`, `ContactEditPanel.stories.tsx`, `ContactsImportSummaryPanel.stories.tsx`
- `docs/softphone/Contacts-History-Identity-Persistence-Plan.md`, `Feature-Registry.md`, `I18N-Coverage.md`

## Что
- Заменены hardcoded `#ffffff`/`#000000` в call-action кнопках на semantic tokens (`--color-text-on-accent`, `--color-bg-surface-deep`)
- Добавлен `margin-top` для danger-group в history detail — destructive отделён от primary actions
- Реализован focus restore: `useDialogReturnFocus` для delete/import modals, `useRestoreRouteFocus` для back-навигации list↔detail
- Storybook stories light/dark для history detail, contact edit, CSV import summary
- Обновлены Phase 9 status в плане и Feature Registry (F-013, F-025, F-026)

## Зачем
Завершить Phase 9 плана contacts/history identity + persistence: accessibility, light/dark polish, focus management, i18n parity gate.

## Результат
- `npm run test` (focused Phase 9) — 12 passed
- `npm run i18n:check` — PASS
- `npm run typecheck` — PASS
- `npm run registry:check` — PASS
- `npm run lint` — 6 pre-existing errors вне scope Phase 9 (ContactsImportSummaryPanel domain imports и др.)
