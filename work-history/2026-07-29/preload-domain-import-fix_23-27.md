# Preload domain import fix

**Дата:** 2026-07-29 23:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/shared/ipc/ExternalServicesCollectionFileContract.ts`
- `src/shared/ipc/ExternalServicesCollectionFileContract.test.ts`
- `src/main/integration/registerExternalServicesCollectionFileIpc.ts`

## Что
- Убран value-импорт `@domain` из IPC-контракта, который тянул preload
- Лимит `EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES` объявлен в shared (как у Preferences/CSV)
- Main IPC читает лимит из shared-контракта
- Тест проверяет совпадение лимита shared ↔ domain

## Зачем
- `electron-vite` preload не резолвит `@domain` (алиас только `@shared`) — из-за этого падал `npm run dev`

## Результат
- `npx electron-vite build --mode development` — OK (main/preload/renderer)
- `npx vitest run src/shared/ipc/ExternalServicesCollectionFileContract.test.ts` — 4 passed
