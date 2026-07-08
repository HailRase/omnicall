# Contacts CSV export dialog fix

**Дата:** 2026-07-08 23:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/contacts/registerContactsCsvIpc.ts`
- `src/renderer/components/contacts/ContactsPanelShell.tsx`
- `src/renderer/hooks/useContactActions.ts`
- `src/shared/ipc/ContactsCsvFileContract.ts`
- `src/renderer/i18n/messages.ts`, `bgMessages.ts`

## Что
- Save/Open dialog: detached `dialog.showSaveDialog` / `showOpenDialog` (без parent) + `Documents` defaultPath — fix для frameless Electron на Windows.
- CSV dropdown: `modal={false}`, задержка 100ms перед действием (Radix modal блокировал native dialog).
- IPC parser: fallback `savedFileName` для совместимости со старым main без перезапуска.
- Toast при отмене экспорта: `contacts.csv.info.exportCancelled`.

## Зачем
- Экспорт CSV визуально «ничего не делал»: диалог не появлялся, уведомлений не было.

## Результат
- `vitest` (contract + useContactActions) — 5/5 PASS
- `npm run i18n:check` — PASS
- **Требуется полный перезапуск `npm run dev`** (изменения main + preload)
