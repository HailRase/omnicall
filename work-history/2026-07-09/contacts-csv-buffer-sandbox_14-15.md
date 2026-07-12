# Contacts CSV Buffer sandbox fix

**Дата:** 2026-07-09 14:15
**Статус:** выполнено
**Коммит:** `772f641`

## Где
- `src/shared/ipc/ContactsCsvFileContract.ts`
- `src/main/contacts/registerContactsCsvIpc.ts`
- `src/adapters/platform/PreloadContactCsvFileGateway.ts`
- `src/application/import-export/ContactCsvCodec.ts`

## Что
- UTF-8 size check через `TextEncoder` вместо `Buffer.byteLength` (renderer sandbox).
- Sanitize `savedFileName` после Save As (пробелы/кириллица больше не ломают IPC).
- Импорт CSV: автодетект разделителя `,` / `;` (Excel).
- try/catch в PreloadContactCsvFileGateway вокруг IPC.

## Зачем
- Экспорт падал после `contacts_csv_export_prepared` с toast ошибки: `Buffer` недоступен в sandboxed renderer.
- Импорт мог падать на Excel `;` или небезопасном имени файла при реэкспорте.

## Результат
- `vitest` ContactsCsvFileContract + ContactCsvCodec + useContactActions — 11/11 PASS
- Нужен полный перезапуск `npm run dev` (main/preload)
