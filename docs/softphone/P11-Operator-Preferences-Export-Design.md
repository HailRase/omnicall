# P11 Operator Preferences Export / Import

Related: **F-030**, **F-016**, **F-023**, **LF-076**, **LF-077**. Bounded context: Settings.

## Goal

Allow an operator to move **portable preferences** of the active account profile to another PC without copying secrets or machine-local device bindings.

## Non-goals

- Cloud sync / MDM push (unchanged from `P11-Local-Account-Profiles-Design.md`).
- Export of SIP passwords, OCP API keys, or SDK pairing blobs (`safeStorage` remains machine-local).
- Silent overwrite of another profile’s settings without an active profile context.
- Downgrade path: importing a **newer** `UserSettings.schemaVersion` or `formatVersion` into an older app.

## Format

File: UTF-8 JSON (`*.json`), suggested name `axatalk-preferences-YYYY-MM-DD.json`.

| Field | Meaning |
| --- | --- |
| `format` | Always `axatalk.preferences` |
| `formatVersion` | Bundle format (`1` today). Independent of `UserSettings.schemaVersion`. |
| `exportedAt` | ISO-8601 timestamp |
| `appVersion` | Optional exporter app version (informational) |
| `profileKey` | Optional source `SettingsAccountKey` (informational; import targets **active** profile) |
| `settings` | Portable `UserSettings` after sanitize |
| `transfer.authMaterialOmitted` | Always `true` |
| `transfer.machineDeviceIdsCleared` | Always `true` |
| `transfer.ocpLinkedReset` | Always `true` |

Domain SSoT: `src/domain/settings/PreferencesExportDocument.ts`.

## Portable sanitize (export + import)

Always cleared / reset before write:

- `preferredAudioInputDeviceId` → `null`
- `preferredVideoInputDeviceId` → `null`
- `headsetPreferredDeviceId` → `null`
- `dismissedUpdateBannerVersion` → `null`
- `ocpIntegration.linked` → `false` (domain / enabled / autoConnect preserved)

Secret-like JSON field names (`password`, `token`, `credential`, `secret` fragments) are rejected fail-closed.

## Version skew

| Direction | Behavior |
| --- | --- |
| Older bundle → newer app | `migrateUserSettings` upgrades nested settings; **new preference fields appear with defaults** |
| Newer `UserSettings.schemaVersion` → older app | `unsupported_schema_version` — import fails; no mutation |
| Newer `formatVersion` → older app | `unsupported_format_version` — import fails; no mutation |
| Corrupt / wrong `format` | Fail closed; active profile settings unchanged |

`SETTINGS_SCHEMA_VERSION` is **not** bumped by this feature. Bundle evolution uses `PREFERENCES_EXPORT_FORMAT_VERSION`.

## Architecture slice

```txt
UI (Settings → General)
  → usePreferencesTransferActions
  → AccountBootstrapFacade.export/importOperatorPreferences
  → ExportOperatorPreferencesUseCase / ImportOperatorPreferencesUseCase
  → Domain PreferencesExportDocument + migrateUserSettings
  → SettingsRepository (active profile)
  → PreferencesFileGateway (dialog + file IO)
  → Preload IPC → main registerPreferencesFileIpc
```

Mocks: `MockPreferencesFileGateway` for non-real bootstrap.

## UI

Settings → General → «Перенос настроек»: Export / Import + status line.  
Copy states that passwords and SDK pairings are excluded; operator must sign in again on the new PC.

## Tests

- Domain: sanitize, round-trip, older schema migrate, unsupported format/schema fail-closed, secret field reject.
- Application: export→import across profile keys; invalid import does not mutate.
- Renderer: transfer section click + status.

## Out of scope (follow-ups)

- Optional contacts inclusion in the same bundle (contacts already have CSV export).
- Optional machine-common `sdk-origin-trust.json` merge (profile already carries `sdkIntegration` in `UserSettings`).
- Passphrase-encrypted secret migrate (explicit product decision required).
