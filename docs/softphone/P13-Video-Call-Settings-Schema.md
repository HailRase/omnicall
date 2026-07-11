# P13 Video Call Settings Schema (WU2)

Related: **F-027**, **ADR-0008**, `P13-Video-Calls-Design.md`.

## Schema version

| Version | Status | Notes |
| --- | --- | --- |
| v4 | previous | Headset fields; no video prefs. |
| v5 | current | Adds preferred devices + session view prefs. |

Migration: v0…v4 → v5 via `migrateUserSettings`; missing video fields get safe defaults.

## New fields

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `preferredAudioInputDeviceId` | `string \| null` | `null` | Mic deviceId; null = system default |
| `preferredVideoInputDeviceId` | `string \| null` | `null` | Camera deviceId; null = system default |
| `defaultSessionView` | `expanded \| hidden \| fullscreen` | `expanded` | Layout after video connect (legacy `compact` migrates to `expanded`) |
| `autoFullscreenOnConference` | `boolean` | `false` | Auto fullscreen when substring matches |
| `conferenceNumberSubstring` | `string \| null` | `null` | Optional remote-number match; null disables |

No global `audioOnly` — per-call media mode (ADR-0008).

## Out of scope (WU2)

- Applying device ids to gUM / JsSIP (done in later WUs via bootstrap preferred ids)
- Enabling SDP video

## Settings UI (post-WU2)

- Section `Settings → Video`: mic/camera selects, live camera preview, default session view, auto-fullscreen + conference substring
- Preview streams are adapter-owned; never stored in Domain/Zustand
