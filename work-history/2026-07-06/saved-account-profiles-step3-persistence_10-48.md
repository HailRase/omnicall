# F-024 Step 3 — Saved account profiles disk persistence

**Дата:** 2026-07-06 10:48
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/settings/FileSavedAccountProfileRepository.ts`
- `src/adapters/settings/profileStoragePaths.ts` (`saved-accounts.json`)
- `src/infrastructure/bootstrap/createRealBootstrapSavedAccountProfileRepository.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/adapters/settings/FileSavedAccountProfileRepository.test.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.test.ts`

## Что
- File repo: `{storageRoot}/profiles/saved-accounts.json`, atomic writes, secret guard
- Corrupt/unsupported JSON → warn log + empty profiles (без crash)
- `replaceProfiles` в in-memory для hydrate с timestamps
- Real bootstrap wiring через `createRealBootstrapSavedAccountProfileRepository`
- IPC не требуется — используется существующий `PreloadFileSystemAdapter` + path allowlist

## Зачем
Персистентность saved SIP profiles отдельно от UserSettings в Electron user-data.

## Результат
- Adapter tests: 9/9 PASS
- Bootstrap test: persistence across instances PASS
- `npm run typecheck` — PASS
- Следующий шаг: UI (Step 4)
