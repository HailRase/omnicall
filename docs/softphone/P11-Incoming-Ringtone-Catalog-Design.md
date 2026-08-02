# Incoming Ringtone Catalog Design (F-033)

- Purpose: selectable incoming ringtone presets without changing Tone FSM / call audio attach.
- Inputs: `UserSettings.incomingRingtoneId` (schema **v18**); Settings → Sessions UI select + preview.
- Outputs: `MediaGateway.configureIncomingRingtone` / preview APIs; WebAudio via `classicRingtone` + `ringtonePresets`.
- Default **`classic`**: FM ring — carrier 660 Hz, square LFO 15 Hz × depth 200, cadence `[440,66,660,1980]` ms, peak gain 0.5.
- Catalog (non-`classic`): original F-033 single-oscillator step presets from `ringtonePresets`.
- Non-goals: copyrighted OEM ringtone assets; ringback/busy melody catalogs; mid-ring hot-swap; schema bump for synthesis retunes.
