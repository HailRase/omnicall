# Step 03: Browser Media Adapter (R2)

## Goal

Real audio: incoming ringtone, remote audio on answer, ringback on 183.

## Feature IDs

F-002 partial (LF-012), F-003 partial (LF-033, LF-034), F-005

## Tasks

1. `src/adapters/media/browser/BrowserMediaAdapter.ts`:
   - `<audio>` elements per callId
   - `attachRemoteAudio` — bind RTCPeerConnection remote stream from JsSIP session (adapter-internal hook only)
   - `playRingtone` / `stopRingtone` — dev asset or WebAudio tone
   - `playRingbackTone`, `playBusyTone`, `playFailedTone`, `stopTone`
   - `muteCall` / `unmuteCall` — `track.enabled`
2. JsSipTelephonyAdapter: narrow internal hook for peer connection per callId (adapter-private, not on port).
3. Wire `BrowserMediaAdapter` in real bootstrap.

## UX

- Incoming: ringtone; answer stops ringtone; hear remote party
- Outgoing 183: ringback when SBC supports
- Failed call: busy/fail tone
- Mute icon reflects projection

## Gate

- Mock tests green
- Smoke: ringtone + bidirectional audio on test call

## Architecture note

Browser APIs stay in adapters layer; renderer process only.

## Update PROGRESS

Mark step 03 `done`.
