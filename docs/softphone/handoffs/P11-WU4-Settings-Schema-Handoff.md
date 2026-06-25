# P11 WU4 Settings Schema Handoff

- Scope: typed `UserSettings` v1 schema, validation, v0→v1 migration, repository aggregate, facade read/write; Feature **F-016**; legacy **LF-077**, **LF-076**, **LF-016**, **LF-033** (schema only).
- Out of scope WU4: full settings panels, user menu, Electron IPC file store, Radix/CSS migration.

## Delivered (WU4)

| Area | Path |
| --- | --- |
| Design | `docs/softphone/P11-Settings-Schema-Design.md` |
| Domain | `src/domain/settings/UserSettings.ts`, `SettingsAccountKey.ts`, `validateUserSettings.ts`, `migrateUserSettings.ts`, `userSettingsMapping.ts` |
| Application | `src/application/settings/migrateUserSettings.ts` (Result wrapper) |
| Port | `SettingsRepository.getUserSettings` / `saveUserSettings` |
| Adapters | `InMemorySettingsRepository` (per-account map), `FileSettingsRepository` stub |
| Facade | `getUserSettingsForAccount`, `saveUserSettings`, `refreshUserSettingsProjections`; `updateMultiCallSettings` via schema |
| Store | `bindFacade` uses `refreshUserSettingsProjections` |

## Settings write path (WU1 regression)

```txt
SettingsOverlay → useSettingsActions → facade.updateMultiCallSettings()
  → UserSettings aggregate → saveUserSettings(accountKey)
  → applyMultiCallSettings → multiCallProjection
```

## Account key

SIP `username` → `SettingsAccountKey`; anonymous `__anonymous__` when no account.

## WU4 Gate

- [x] `P11-Settings-Schema-Design.md` created
- [x] Versioned schema + validation tests
- [x] Migration v0→v1 tested
- [x] Repository aggregate read/write
- [x] Facade + projection refresh
- [x] WU1 multi-session regression green
- [x] LF-077 evidence in Legacy-Feature-Coverage
- [x] Feature Registry F-016 updated

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Baseline WU3 **676** → **694 tests** (+18), 1 skipped.

## Manual smoke

1. Toggle multi-session — persists through schema path.
2. Fresh install — default v1 settings.
3. Corrupt JSON in `FileSettingsRepository` — observable `settings_corrupt` error.

## STOP

Do not start full settings panels (account/audio/theme) or user menu (LF-086) until next WU prompt.

## Next

- **P11 WU5 (UI-4):** CSS Modules + tokens migration by slice — `handoffs/P11-WU5-CSS-Modules-Tokens-Agent-Prompt.md`
- P11 settings UX panels per roadmap
