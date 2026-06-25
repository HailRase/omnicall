# P11 Settings Schema Design

Related: **F-016**, **LF-076**, **LF-077**, **LF-016**, **LF-033**, **LF-032**. Phase: P11 WU4.

## Account key

- Per-user storage key = SIP `authorization_user` / `username` (`SettingsAccountKey`).
- OCP `agentId` may alias the same key when SIP credentials arrive from OCP bootstrap.
- Anonymous bucket `__anonymous__` when no SIP account is active (dev/tests only).

## Schema version

| Version | Status | Notes |
| --- | --- | --- |
| v0 | legacy | Fragmented in-memory: `multiCallSettings` + `autoAnswerTimeoutSec` without `schemaVersion`. |
| v1 | current | Typed `UserSettings` aggregate (see below). |

## UserSettings v1 fields

| Field | Type | Default | Legacy | Validation |
| --- | --- | --- | --- | --- |
| `schemaVersion` | `1` | `1` | — | Must equal `1`. |
| `multiSessionsEnabled` | `boolean` | `true` | LF-032 | Required boolean. |
| `autoUnholdOnTransferFailure` | `boolean` | `true` | transfer policy | Required boolean. |
| `autoAnswerTimeoutSec` | `number \| null` | `null` | LF-016 | `null` or integer `0…300`. |
| `ringbackToneEnabled` | `boolean` | `true` | LF-033 | Required boolean; wire-ready for RBT policy. |

OCP-only break-reason lists remain in `IncomingCallSettings` (synced from operator gateway), not in `UserSettings`.

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
- `FileSettingsRepository` stub persists JSON per key with in-memory fallback for tests.

## Fresh install

No persisted blob → `createDefaultUserSettings()` (v1).

## Corrupt / unsupported version

- Adapter throws `settings_corrupt:*` or `settings_validation_failed:*`.
- Facade maps to `PlatformError` / `useSettingsActions` surfaces message to UI.

## Out of scope (WU4)

Full settings panels, Electron IPC file store, OCP-only field UI, Use Cases for boolean config toggles.
