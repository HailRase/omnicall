# P11 Settings Schema Design

Related: **F-016**, **LF-076**, **LF-077**, **LF-016**, **LF-033**, **LF-032**. Phase: P11 WU4.

## Account key

- Branded `SettingsAccountKey` identifies a settings profile bucket.
- **Current (WU4):** SIP `username` only via `resolveSettingsAccountKeyFromSipAccount`.
- **F-023 target:** normalized `username@domain` (+ server suffix when server host ≠ domain); see `P11-Local-Account-Profiles-Design.md`.
- legacy operator platform `agentId` may alias the same key when SIP credentials arrive from legacy operator platform bootstrap.
- Anonymous bucket `__anonymous__` when no SIP account is active (dev/tests only).

## Schema version

Source of truth: `SETTINGS_SCHEMA_VERSION` in `src/domain/settings/UserSettings.ts` (currently **v18**).

| Version | Status | Notes |
| --- | --- | --- |
| v0 | legacy | Fragmented in-memory: `multiCallSettings` + `autoAnswerTimeoutSec` without `schemaVersion`. |
| v1 | legacy | Typed `UserSettings` aggregate (superseded). |
| v2 | legacy | Added language + SIP recovery fields. |
| v3…v16 | legacy | Incremental fields (codecs, notifications, headset, OCP/SDK, external services/apps, …). |
| v17 | legacy | Adds `windowAlwaysOnTop` (shell titlebar always-on-top pin; F-016). |
| **v18** | **current** | Adds `incomingRingtoneId` (F-033 selectable incoming ringtone; default `classic`). |

## UserSettings v1 fields

| Field | Type | Default | Legacy | Validation |
| --- | --- | --- | --- | --- |
| `schemaVersion` | `1` | `1` | — | Must equal `1`. |
| `multiSessionsEnabled` | `boolean` | `true` | LF-032 | Required boolean. |
| `autoUnholdOnTransferFailure` | `boolean` | `true` | transfer policy | Required boolean. |
| `autoAnswerTimeoutSec` | `number \| null` | `null` | LF-016 | `null` or integer `0…300`. |
| `ringbackToneEnabled` | `boolean` | `true` | LF-033 | Required boolean; wire-ready for RBT policy. |
| `incomingRingtoneId` | `IncomingRingtoneId` | `classic` | LF-012 / F-033 | Catalog whitelist; unknown → `classic` (no load failure). |

legacy operator platform-only break-reason lists remain in `IncomingCallSettings` (synced from operator gateway), not in `UserSettings`.

## Migration v0 → v1

1. Read raw JSON or legacy fragments from repository.
2. If `schemaVersion === 1` → `validateUserSettings`.
3. If `schemaVersion` is `0` or missing → merge `multiCallSettings` + `autoAnswerTimeoutSec` into v1 defaults (`ringbackToneEnabled: true`).
4. If version unknown or fields invalid → fail with observable error (no silent override of user flags).

Implementation: `src/domain/settings/migrateUserSettings.ts`; application wrapper in `src/application/settings/migrateUserSettings.ts`.

## Write path (unchanged UX)

```txt
SettingsOverlay → useSettingsActions → facade.updateMultiCallSettings()
  → UserSettings aggregate → SettingsRepository.saveUserSettings()
  → refreshUserSettingsProjections → store multiCallProjection
```

Pure config flags do not use a Use Case (ADR not required for WU4).

## Repository boundary

- Adapters parse `unknown` JSON via domain `migrateUserSettings` / `validateUserSettings`.
- `InMemorySettingsRepository` holds per-account `UserSettings` map.
- `FileSettingsRepository` stub persists JSON per key in memory (F-023: real disk persistence).
- Local profile index + active profile: `P11-Local-Account-Profiles-Design.md`.

## Fresh install

No persisted blob → `createDefaultUserSettings()` (v1).

## Corrupt / unsupported version

- Adapter throws `settings_corrupt:*` or `settings_validation_failed:*`.
- Facade maps to `PlatformError` / `useSettingsActions` surfaces message to UI.

## Out of scope (WU4)

Full settings panels, Electron IPC file store, legacy operator platform-only field UI, Use Cases for boolean config toggles.

## Operator preferences transfer (F-030)

Cross-PC transfer does **not** change `SETTINGS_SCHEMA_VERSION`. It uses a separate portable bundle:

- Format id: `omnicall.preferences`
- Format version: `PREFERENCES_EXPORT_FORMAT_VERSION` (independent of this schema table)
- Design: `P11-Operator-Preferences-Export-Design.md`
- Import always runs `migrateUserSettings` so older blobs gain new fields with defaults on newer apps; newer schema/format into older apps fails closed (no downgrade).
