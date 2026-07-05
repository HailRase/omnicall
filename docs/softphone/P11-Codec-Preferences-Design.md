# P11 Codec Preferences Design

Related: **F-022**, **LF-084**, **F-016**. Phase: P11 codec WU-2 (domain).

## Schema version

| Version | Status | Notes |
| --- | --- | --- |
| v2 | legacy | No `codecPreferences` field. |
| v3 | current | Adds `codecPreferences` to `UserSettings`. |

Migration: v0/v1/v2 → v3 via `migrateUserSettings`; v2 installs receive default codec order.

## CodecPreferences shape

```txt
codecPreferences.audio[]: { id, enabled, order }
codecPreferences.video[]: { id, enabled, order }
```

### Canonical ids

| Kind | IDs (default order) |
| --- | --- |
| Audio | `opus`, `pcmu`, `pcma`, `g722`, `telephone-event` |
| Video | `vp8`, `vp9`, `h264`, `av1` |

MIME mapping lives in `src/domain/media/CodecId.ts` for adapter WU-4.

## Business rules

- At least one voice audio codec (`opus|pcmu|pcma|g722`) must stay enabled.
- `telephone-event` is always enabled (DTMF F-008).
- Order values must be a permutation of `0…n-1`; persisted order is normalized on validation.
- Settings changes apply to **new** RTC sessions only (not active call renegotiation).

## Write path (planned)

```txt
SettingsCodecsPanel → useSettingsActions → facade.saveUserSettings()
  → validateUserSettings / validateCodecPreferences → SettingsRepository
```

Pure config — no Use Case (same as theme/multiSessions).

## Out of scope (WU-2)

- JsSIP adapter SDP/`setCodecPreferences` wiring (`/adapter` WU-4).
- Settings UI drag-and-drop panel (`/ui` WU-5).
- Video call enablement (calls remain audio-only until product enables video).

## Tests

- `validateCodecPreferences.test.ts`
- `reorderCodecPreferences.test.ts`
- `validateUserSettings.test.ts` (v3)
- `migrateUserSettings.test.ts` (v2→v3)
