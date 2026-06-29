# P03 Incoming Call UX Design

- Purpose: define renderer states and actions for `F-002` incoming call flow (`LF-012`, `LF-013`, `LF-014`, `LF-015`, `LF-016`, `LF-017`, `LF-036`, `LF-061`, `LF-090`).
- Inputs: `IncomingCallProjection`, `CallProjection`, phone status, and callbacks bound to `AnswerCallUseCase` and `RejectCallUseCase`.
- Outputs: `IncomingCallOverlay` banner (design parity), auto-answer progress, and typed answer/reject intents.

## UI migration (2026-06-29)

- **Removed:** `IncomingCallModal`, `IncomingCallActions`, `CallerIdentityBlock`, `AutoAnswerCountdown` — Radix-style modal with reject-reason selector.
- **Current:** `IncomingCallOverlay` — non-blocking top banner under shell header (`SoftphoneReadyShell`), accept/reject only (no reject-reason picker in UI).
- Reference: `softphone-electron-design/src/app/components/IncomingCallOverlay.tsx` (reason picker omitted by product decision).

## State Inventory

- `noIncomingCall`: no incoming call is visible.
- `incomingRinging`: incoming overlay visible with pulsing icon.
- `callerIdentityLoading`: caller identity is loading from adapter boundary data.
- `callerIdentityResolved`: display name parsed from SIP boundary and projected.
- `queueInfoPending`: queue badge shows loading placeholder until P07 queue sync.
- `autoAnswerCountdown`: countdown label and progress bar while auto-answer timer is active.
- `dndAutoRejecting`: incoming is auto-rejected with 486 and overlay is hidden.
- `answering`: answer action in progress, reject control disabled.
- `rejecting`: reject action in progress, answer control disabled.
- `answerFailed`: answer command failed and error feedback is visible.
- `rejectFailed`: reject command failed and error feedback is visible.
- `incomingEndedBeforeAnswer`: call ended remotely before user action.

## Controls, Keyboard, Accessibility, Test IDs

- Controls: `Ответить` and `Отклонить` text buttons; disabled reasons come only from projection state.
- Keyboard: `Enter` answers; `Escape` rejects when reject action is available.
- Accessibility: overlay uses `role="dialog"`, buttons use explicit labels; countdown uses `aria-live="polite"`.
- Test IDs: `incoming-call-overlay`, `caller-identity`, `answer-call`, `reject-call`, `auto-answer-countdown`, `queue-info-label`, `incoming-campaign-context`, `incoming-answer-disabled-reason`, `incoming-call-status`.
