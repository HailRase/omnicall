# Contacts CSV export UX fix

**Дата:** 2026-07-08 22:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/contacts/registerContactsCsvIpc.ts`
- `src/renderer/components/contacts/ContactsPanelShell.tsx`
- `src/renderer/hooks/useContactActions.ts`
- `src/shared/ipc/ContactsCsvFileContract.ts`
- `src/ports/settings/ContactCsvFileGateway.ts`
- `src/renderer/i18n/messages.ts`, `bgMessages.ts`

## Что
- Перед нативным диалогом main фокусирует окно Electron.
- Экспорт/импорт из CSV-меню откладываются на следующий tick (Radix dropdown не блокирует dialog).
- IPC возвращает `savedFileName`; toast: «Файл … сохранён. Контактов: N».
- Тест `useContactActions` на success-notification.

## Зачем
- Пользователь не видел диалог сохранения и не получал обратной связи после экспорта.

## Результат
- `vitest` (contract, bootstrap CSV, useContactActions) — PASS
- `npm run i18n:check` — PASS
- Ожидаемое поведение: CSV → Экспорт → диалог «Сохранить как» → toast с именем файла
