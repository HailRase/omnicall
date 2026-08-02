# Feedback Channel Law (ADR-0026)

**Дата:** 2026-08-02 19:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useActionNotifications.ts`, `useContactActions.ts`, `usePreferencesTransferActions.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/history/HistoryDeleteConfirmationModal.tsx`
- `src/renderer/components/contacts/ContactDeleteConfirmationModal.tsx`, `ContactEditPanel.tsx`
- `src/renderer/components/call/CallLinesShell.tsx`, `CallSessionStack.tsx`
- `docs/softphone/adr/ADR-0026-feedback-channel-law.md`, `UI-Architecture.md`, `Feature-Registry.md`, `STATUS.md`

## Что
- Снят dual Account error: Alert владеет UX; `notify` с `interruptClass: "critical"` для journal без toast; CTA System State на Alert
- Убраны outcome strips из history/contacts delete modals; contact CRUD outcomes → toast
- Preferences export/import → toast; убран inline status
- Multi-call policy error только в `CallSessionStack`
- Зафиксирован ADR-0026 + синхронизация UI/UX/Registry/STATUS/notification-center non-goals

## Зачем
- Устранить двойной показ ошибок/успеха без даунгрейда persistent Account/banner/modal surfaces

## Результат
- `npx vitest run` (AccountPanel, useActionNotifications, preferences transfer, SettingsPanel/General, Contacts/History shells, producer tagging) — pass
- `npx tsc --noEmit -p tsconfig.web.json` — pass
- Version bump не делался (docs + anti-dual UX hygiene, не новый Registry feature ship)
