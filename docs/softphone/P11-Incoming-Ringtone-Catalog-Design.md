# Incoming Ringtone Catalog Design (F-033)

- Purpose: selectable incoming ringtone presets without changing default call audio behavior.
- Inputs: `UserSettings.incomingRingtoneId` (schema **v18**); Settings → Sessions UI select + preview.
- Outputs: `MediaGateway.configureIncomingRingtone` / preview APIs; WebAudio synthesis via `ringtonePresets`.
- Default: `classic` (pre-v18 440/480 dual-tone) — no audible downgrade for existing profiles.
- Non-goals: copyrighted OEM ringtone assets; ringback/busy melody catalogs; mid-ring hot-swap.
