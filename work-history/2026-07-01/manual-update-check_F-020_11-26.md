# Manual in-app update check (F-020)

**Дата:** 2026-07-01 11:26
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/updates/`, `src/application/use-cases/CheckForUpdatesUseCase.ts`
- `src/adapters/updates/`, `src/adapters/platform/Preload*Gateway.ts`
- `src/shared/ipc/OpenExternalUrlContract.ts`, `src/main/index.ts`, `src/preload/index.ts`
- `src/renderer/hooks/useAppUpdate.ts`, `SettingsGeneralPanel.tsx`
- `docs/softphone/Manual-Update-Manifest.md`, `docs/softphone/Feature-Registry.md` (F-020)

## Что
- Контракт remote manifest, валидация, semver-сравнение, evaluateUpdateAvailability
- Use case + порты + FetchUpdateMetadataAdapter + typed IPC openExternal (HTTPS only)
- UI «О программе» в Настройки → Общее: версия, статус, проверка, открытие страницы загрузки
- 21 новый unit/component тест; без electron-updater и автоустановки

## Зачем
Ручная проверка обновлений в production без подписи и silent install.

## Результат
`npm run typecheck`, `lint`, `test` (937 passed), `registry:check` — green. Требуется задать `VITE_UPDATE_MANIFEST_URL` и опубликовать manifest JSON.
