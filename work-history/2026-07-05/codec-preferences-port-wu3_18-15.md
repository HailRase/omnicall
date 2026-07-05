# Codec preferences port WU-3

**Дата:** 2026-07-05 18:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/media/CodecPreferencesPort.ts`
- `src/adapters/settings/SettingsRepositoryCodecPreferencesAdapter.ts`
- `src/adapters/mock/MockCodecPreferencesPort.ts`
- `src/application/media/resolveEnabledCodecs.ts`
- `src/domain/settings/resolveSettingsAccountKey.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `docs/softphone/handoffs/P11-Codec-Preferences-WU4-Adapter-Agent-Prompt.md`

## Что
- Port `CodecPreferencesPort` + adapter из SettingsRepository
- `resolveEnabledCodecs` — prefs → ordered MIME types + capability filter
- Inject `codecPreferencesPort` в `JsSipTelephonyAdapter` (getter, apply в WU-4)
- Refactor `resolveSettingsAccountKeyFromSipAccount` в domain
- Unit tests; handoff prompt для `/adapter` WU-4

## Зачем
Связать persisted codec prefs с telephony adapter без изменения CallEngine/TelephonyGateway.

## Результат
- `npm run test` — 1081 passed, 1 skipped
- `npm run lint` / `typecheck` — green
- Следующий: `/adapter` по handoff WU-4
