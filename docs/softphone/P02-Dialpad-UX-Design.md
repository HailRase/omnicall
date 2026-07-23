# P02 Dialpad UX Design

## LF Coverage
- `LF-020`: outgoing call starts only through `MakeCallUseCase`.
- `LF-025`: active call dialpad sends DTMF via `SendDtmfUseCase`.
- `LF-026`: long press `0` inserts `+` in number mode.
- `LF-033`/`LF-034`: progress and failure tones are Media-driven.
- `LF-035`: remote audio attach is Media-owned.

## State Inventory
- `idle`: no active call and no typed number.
- `enteringNumber`: editable number with digits, `*`, `#`, delete, clear.
- `invalidNumber`: invalid dial string with disabled call action.
- `registeredButEmptyNumber`: registered account without number input.
- `calling`: outgoing call requested and connecting started.
- `progress`: provisional progress indicator for 180/183.
- `activeCallDtmfMode`: active call with keypad sending DTMF.
- `failedBusy` / `failedUnavailable` / `failedRejected`: legacy DialpadUiState labels retained for typing; terminal outbound failures now project to Idle + `lastOutgoingFailure` and a global notification (no sticky `OutgoingCallCard`).
- `disabledByNotRegistered`: registration gate blocks call action.
- `disabledByOcpReserved`: legacy operator platform reserved gate blocks call action.
- `disabledBySecondSessionPolicy`: second-session policy blocks call action.

## Actions And Use Cases
- `Dial digit` -> local input update (number mode).
- `Call` -> `MakeCallUseCase`.
- `DTMF digit` -> `SendDtmfUseCase`.
- `Delete` -> remove one digit.
- `Clear` -> reset number input.
- `Mode toggle` -> projection mode switch (`number` / `dtmf`).

## Accessibility
- Keyboard entry: digits, `*`, `#`, `+`, `Backspace`, `Enter`.
- Every control has visible focus style and `aria-label`.
- Disabled call action exposes explicit reason text.
- Critical actions remain keyboard reachable in all states.
- Status differences are not color-only.
- Test IDs exist for all critical controls and states.

## Test IDs
- `dialpad-panel`, `dialpad-input`, `dialpad-key-{symbol}`.
- `dialpad-delete`, `dialpad-clear`, `dialpad-call`.
- `dialpad-disabled-reason`, `dialpad-mode-number`, `call-dtmf-toggle`.
- `outgoing-call-card`, `call-state-label`, `call-failed-alert`.
- `sip-registered-hint`, `phone-status-badge`.
- `softphone-shell`.

