# F-023 Step 7 — Real bootstrap FileSettingsRepository wiring

**Дата:** 2026-07-06 01:06
**Статус:** выполнено
**Коммит:** —

## Где
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/infrastructure/bootstrap/createRealBootstrapSettingsRepository.ts`
- `src/infrastructure/bootstrap/resolveAxatalkProfilesStorageRoot.ts`
- `src/main/profiles/registerProfilesPersistenceIpc.ts`
- `src/adapters/settings/PreloadFileSystemAdapter.ts`
- `src/renderer/bootstrap/resolveRealBootstrapDiskOptions.ts`
- `src/adapters/settings/profileStoragePaths.ts`

## Что
- `createRealAccountBootstrap` использует `FileSettingsRepository` + `resolveSettingsAccountKey` для codec adapter
- Main IPC: `profiles:get-storage-root`, `profiles:invoke-filesystem` с `NodeFileSystemAdapter`
- Renderer real mode: preload storage root + `PreloadFileSystemAdapter` (без прямого fs)
- `profileStoragePaths`: pure join без `node:path` — renderer bundle безопасен
- Интеграционные тесты: persist A→restart, first-run defaults, mock in-memory regression
- Feature Registry F-023 Step 7 evidence

## Зачем
Подключить реальную disk persistence в bootstrap factory; main владеет userData path, renderer — facade only.

## Результат
- `npm run test` — 1161 passed
- `npm run lint`, `typecheck`, `registry:check` — ok
- `npm run build` — ok
