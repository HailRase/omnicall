# Commit and push contacts CSV fix

**Дата:** 2026-07-09 14:36
**Статус:** выполнено
**Коммит:** `c1e1a59` (основной `772f641`)

## Где
- `src/shared/ipc/ContactsCsvFileContract.ts`
- `src/main/contacts/registerContactsCsvIpc.ts`
- `src/adapters/platform/PreloadContactCsvFileGateway.ts`
- `src/application/import-export/ContactCsvCodec.ts`
- `work-history/2026-07-09/contacts-csv-buffer-sandbox_14-15.md`

## Что
- Закоммичены правки F-025 (CSV sandbox/export/import).
- Откат случайного форматирования `IncomingCallSessionCard.tsx` (не включён в коммит).
- Запушено в `origin/feature/real-adapters`.

## Зачем
- Сохранить и опубликовать исправления экспорта/импорта контактов CSV.

## Результат
- `772f641` + `c1e1a59` на `feature/real-adapters`, push успешен.
