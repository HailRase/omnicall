# Local account profiles — disk persistence (Step 4)

**Дата:** 2026-07-06 00:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/filesystem/FileSystemPort.ts`
- `src/infrastructure/filesystem/NodeFileSystemAdapter.ts`
- `src/adapters/settings/profileStoragePaths.ts`
- `src/adapters/settings/profilesIndexDocument.ts`
- `src/adapters/settings/parsePersistedUserSettings.ts`
- `src/adapters/settings/FileSettingsRepository.ts`
- `src/adapters/settings/FileSettingsRepository.test.ts`

## Что
- `FileSystemPort` + `NodeFileSystemAdapter` (atomic write tmp→rename).
- Layout: `profiles/index.json` (activeProfileKey), `profiles/settings/{base64url(key)}.json`.
- `FileSettingsRepository` читает/пишет на диск; session state — in-memory.
- Тесты: cross-instance persistence, A/B isolation, corrupt JSON, index restore.

## Зачем
Реальная локальная persistence per-profile settings без доступа renderer к filesystem.

## Результат
- `npm run test` — 1143 passed, 1 skipped
- `npm run lint`, `npm run typecheck`, `npm run registry:check` — OK
- Bootstrap wiring (Step 7) и facade orchestration (Step 6) — не сделаны.
