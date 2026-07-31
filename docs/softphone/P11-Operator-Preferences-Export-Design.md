# P11 Operator Preferences Export / Import

Related: **F-030**, **F-016**, **F-023**, **F-031**, **LF-076**, **LF-077**. Bounded context: Settings.

## Goal

Allow an operator to move **portable preferences** of the active account profile to another PC without copying secrets or machine-local device bindings.

## Non-goals

- Cloud sync / MDM push (unchanged from `P11-Local-Account-Profiles-Design.md`).
- Export of SIP passwords, OCP API keys, or SDK pairing blobs (`safeStorage` remains machine-local).
- Silent overwrite of another profile’s settings without an active profile context.
- Downgrade path: importing a **newer** `UserSettings.schemaVersion` or `formatVersion` into an older app.
- External Services journal / Run results (local operational history only).

## Format

File: UTF-8 JSON (`*.json`), suggested name `omnicall-preferences-YYYY-MM-DD.json`.

| Field | Meaning |
| --- | --- |
| `format` | Always `omnicall.preferences` |
| `formatVersion` | Bundle format (`1` today). Independent of `UserSettings.schemaVersion`. |
| `exportedAt` | ISO-8601 timestamp |
| `appVersion` | Optional exporter app version (informational) |
| `profileKey` | Optional source `SettingsAccountKey` (informational; import targets **active** profile) |
| `settings` | Portable `UserSettings` after sanitize (v13 includes `externalServices` trigger delays) |
| `transfer.authMaterialOmitted` | Always `true` |
| `transfer.machineDeviceIdsCleared` | Always `true` |
| `transfer.ocpLinkedReset` | Always `true` |

Domain SSoT: `src/domain/settings/PreferencesExportDocument.ts`.

Outer `PREFERENCES_EXPORT_FORMAT_VERSION` stays **1**; F-031 nests under migrated `UserSettings` (schema **13**; v12 string triggers migrate to `{ eventType, delaySeconds }`).

## Portable sanitize (export + import)

Always cleared / reset before write:

- `preferredAudioInputDeviceId` → `null`
- `preferredVideoInputDeviceId` → `null`
- `headsetPreferredDeviceId` → `null`
- `dismissedUpdateBannerVersion` → `null`
- `ocpIntegration.linked` → `false` (domain / enabled / autoConnect preserved)

Included without stripping:

- `externalServices` collections, requests, variables, query/header rows, body modes, trigger bindings (incl. `delaySeconds`), enable flags
- Authored External Services header/query **values** (product decision: portable configuration, not a secrets vault)

Excluded:

- External Services journal files and Run-now result payloads (not part of `UserSettings`)
- SIP passwords, OCP API keys, SDK pairing blobs (never in `UserSettings` export surface)

Secret-like JSON **property names** (`password`, `token`, `credential`, `secret` fragments) are rejected fail-closed. Key/value rows use neutral fields `key` / `value`, so names such as `Authorization` are values, not forbidden property names.

## Version skew

| Direction | Behavior |
| --- | --- |
| Older bundle → newer app | `migrateUserSettings` upgrades nested settings; **new preference fields appear with defaults** (empty External Services when absent) |
| Newer `UserSettings.schemaVersion` → older app | `unsupported_schema_version` — import fails; no mutation |
| Newer `formatVersion` → older app | `unsupported_format_version` — import fails; no mutation |
| Corrupt / wrong `format` | Fail closed; active profile settings and F-031 runtime unchanged |

`SETTINGS_SCHEMA_VERSION` evolves with product settings (v13 for F-031 delays). Bundle evolution uses `PREFERENCES_EXPORT_FORMAT_VERSION` only when the outer document shape changes.

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

After **successful** import the facade also:

- applies headset user settings (existing)
- refreshes F-031 `ExternalServicesRuntimeRegistry` via `replaceActiveSettings`
- returns portable `UserSettings` so the renderer projection updates without restart

Failed imports leave repository settings and F-031 runtime unchanged.

Mocks: `MockPreferencesFileGateway` for non-real bootstrap.

## UI

Settings → General → «Перенос настроек»: Export / Import + status line.  
Copy states that passwords and SDK pairings are excluded; operator must sign in again on the new PC.  
Authored External Services header/query values **are** portable when present.

## Tests

- Domain: sanitize, round-trip (incl. External Services), older schema migrate, unsupported format/schema fail-closed, secret field reject, journal absent.
- Application: export→import across profile keys; External Services exact round trip; invalid import does not mutate.
- Facade: post-import F-031 runtime refresh; failed import leaves registry unchanged.
- Renderer: transfer section click + status.

## Out of scope (follow-ups)

- Optional contacts inclusion in the same bundle (contacts already have CSV export).
- Optional machine-common `sdk-origin-trust.json` merge (profile already carries `sdkIntegration` in `UserSettings`).
- Passphrase-encrypted secret migrate (explicit product decision required).
- Single-collection External Services JSON transfer (F-031 WU-07).
