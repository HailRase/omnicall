# P03 Incoming Call UX Design

- Purpose: define renderer states and actions for `F-002` incoming call flow (`LF-012`, `LF-013`, `LF-014`, `LF-015`, `LF-016`, `LF-017`, `LF-036`, `LF-061`, `LF-090`).
- Inputs: `IncomingCallProjection`, `CallProjection`, phone status, reject reason selection, and callbacks bound to `AnswerCallUseCase` and `RejectCallUseCase`.
- Outputs: `IncomingCallModal` rendering, ringing indicator, auto-answer countdown label, reject-reason selector, and typed answer/reject intents.

## State Inventory

- `noIncomingCall`: no incoming call is visible.
- `incomingRinging`: incoming modal visible with ringing indicator.
- `callerIdentityLoading`: caller identity is loading from adapter boundary data.
- `callerIdentityResolved`: display name parsed from SIP boundary and projected.
- `queueInfoPending`: queue placeholder shown until P07 queue sync.
- `rejectReasonRequired`: reject reason control required before reject action.
- `autoAnswerCountdown`: countdown label visible while auto-answer timer is active.
- `dndAutoRejecting`: incoming is auto-rejected with 486 and modal is hidden.
- `answering`: answer action in progress, reject control disabled.
- `rejecting`: reject action in progress, answer control disabled.
- `answerFailed`: answer command failed and error feedback is visible.
- `rejectFailed`: reject command failed and error feedback is visible.
- `incomingEndedBeforeAnswer`: call ended remotely before user action.

## Controls, Keyboard, Accessibility, Test IDs

- Controls: `Answer`, `Reject`, and reject reason selector; disabled reasons come only from projection state.
- Keyboard: `Enter` and `Space` answer the call; `Escape` rejects when reject action is available; modal traps `Tab` focus.
- Accessibility: modal uses `role="dialog"`, buttons use explicit labels, and countdown uses `aria-live="polite"` with visible focus.
- Test IDs: `incoming-call-modal`, `caller-identity`, `answer-call`, `reject-call`, `reject-reason-select`, `auto-answer-countdown`, `ringing-indicator`.
