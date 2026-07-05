# Local account profiles — secret handling (Step 5)

**Дата:** 2026-07-06 00:45
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P11-Local-Account-Profiles-Design.md` (Path A locked)
- `src/ports/secrets/SecretStoragePort.ts`
- `src/adapters/settings/assertPersistedProfileJsonExcludesSecrets.ts`
- `src/adapters/settings/FileSettingsRepository.ts` (guard on write)

## Что
- **Path A:** SIP password session-transient; remember-me не поддерживается.
- Контракт `SecretStoragePort` + `SIP_PASSWORD_SECRET_ID` для будущего Path B.
- Guard `assertPersistedProfileJsonExcludesSecrets` перед atomic write index/settings.
- Тесты: guard unit + disk scan после `saveSipAccount` с password.

## Зачем
Исключить plain-text credentials в profile JSON; зафиксировать продуктовое ограничение.

## Результат
- `npm run test` — 1148 passed, 1 skipped
- `npm run lint`, `npm run typecheck`, `npm run registry:check` — OK
- Electron safeStorage adapter — deferred (Path B).
