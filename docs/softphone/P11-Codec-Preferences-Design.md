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
- Calls remain **audio-only**; video codec prefs are persisted for schema compatibility but not applied to JsSIP/WebRTC sessions.

## Adapter wiring (WU-4, hardened)

```txt
makeCall:
  start resolveJsSipSessionCodecs → ua.call → lifecycle → executeJsSipOutboundCall listeners
  → await resolve → wireJsSipSessionCodecPreferencesSync → await call progress

incoming:
  registerSession → lifecycle → void prepareJsSipSessionCodecPreferences → incoming handler

answerCall:
  prepareJsSipSessionCodecPreferences (await, idempotent) → session.answer
```

Dual-layer apply per session:

1. `setCodecPreferences` on audio transceivers (per-transceiver try/catch; failure → SDP munging fallback).
2. Local SDP munging on every `sdp` event with `originator: local` (offer/answer/re-INVITE).

Readiness: outbound resolves settings **before** `ua.call`; listeners attach synchronously after session creation. Incoming starts `prepare` fire-and-forget in parallel with UI notification; **answerCall** awaits `prepare` idempotently **before** `session.answer` — this is the guaranteed wiring point on the answer path.

Diagnostics: after `confirmed`/`accepted`, best-effort `getStats` logs negotiated audio MIME/payload (no SDP bodies or credentials).

Residual: if JsSIP emits local SDP synchronously inside `ua.call` before the adapter receives the session handle, first offer may rely on SDP munging only — mitigated by pre-resolve + immediate sync wire.

## Write path

```txt
SettingsCodecsPanel → useSettingsActions → facade.saveUserSettings()
  → validateUserSettings / validateCodecPreferences → SettingsRepository
```

Pure config — no Use Case (same as theme/multiSessions).

## Out of scope (WU-2)

- Video call enablement (calls remain audio-only; video UI is future-only, schema preserved).

## Tests

- `validateCodecPreferences.test.ts`
- `reorderCodecPreferences.test.ts`
- `validateUserSettings.test.ts` (v3)
- `migrateUserSettings.test.ts` (v2→v3)
- Adapter: `prepareJsSipSessionCodecPreferences.test.ts`, `applyCodecPreferencesToPeerConnection.test.ts`, `wireJsSipCodecPreferences.test.ts`, `logNegotiatedAudioCodecs.test.ts`, `JsSipTelephonyAdapter.test.ts` (codec paths)
