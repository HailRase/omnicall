# Step 04: Real Incoming & Outgoing (R3)

## Goal

End-to-end call: dial → talk → hangup; incoming → answer/reject.

## Feature IDs

F-002, F-003, LF-013–017, LF-020, LF-036

## Tasks

1. Extend `JsSipTelephonyAdapter`:
   - `makeCall` — progress via existing CallEngine handlers
   - `setIncomingCallHandler` — use `mapTelephonyIncomingNotification`
   - `answerCall`, `rejectCall`, `hangup`
   - `setCallEndedHandler`
2. CallEngine incoming/outgoing orchestrators must remain unchanged.
3. Verify DND auto-reject 486 on real SBC.
4. Verify auto-answer policy with settings / URL param.

## UX (call center)

- `IncomingCallModal`: number, display name, queue label when legacy operator platform wired
- Answer/Reject keyboard accessible
- `OutgoingCallCard` during connect
- `ActiveCallControlsPanel` after answer
- All disabled reasons from projections

## Smoke

See `SMOKE-CHECKLIST.md` § R3.

## Gate

- Mock integration tests green
- Manual smoke R1+R2+R3 pass

## Update PROGRESS

Mark step 04 `done`.
