# P05 Transfer Panel UX Design (WU4)

- Phase: `P05` WU4; Features: `F-006`, `F-007`; Legacy: `LF-030`, `LF-031`.
- Primary context: `Telephony`; projections: `transferProjection`, `multiLineCallProjection`, `activeCallControlsProjection`.
- Out of scope WU4: JsSIP/REFER adapters, E2E harness, Phase P06.

## User Goal

Enter transfer mode on an active call, enter a target, run blind or attended transfer, cancel safely, and recover from failures with clear feedback.

## Visual States

| State key | Meaning | Projection driver |
| --- | --- | --- |
| `hidden` | No transfer UI | `transferModeActive` false and single-line session |
| `transfer_mode` | Target entry and actions visible | `TransferModeStarted` / `transferModeActive` |
| `multi_line` | Two call lines during consultation | `multiLineCallProjection.lines.length > 1` |
| `transfer_in_progress` | Gateway REFER in flight | `phase` `transferring` or `attended_transfer_in_progress` |
| `transfer_failed` | Failure banner visible | `transfer_failed` or `attended_transfer_failed` |
| `recovery_unhold` | Auto-unhold after failure | `CallAutoUnheldAfterTransferFailure` (LF-031) |

## Loading States

- Blind/attended transfer buttons disabled with `transfer_in_progress` while gateway runs.
- Consultation start disabled with `consultation_in_progress` when session blocks second leg.

## Error States

| Banner copy | When |
| --- | --- |
| `Transfer failed: {reason}` | `CallTransferFailed` / `AttendedTransferFailed` |
| `Consultation failed: {reason}` | `ConsultationCallFailed` |

## Disabled Reasons (projection-driven)

| Reason key | User label | When |
| --- | --- | --- |
| `no_active_call` | No active call | Missing source `callId` |
| `transfer_not_allowed` | Transfer not available | Call state not `Active`/`Held` or `Transferring` |
| `invalid_target` | Invalid transfer target | Target fails phone validation |
| `transfer_in_progress` | Transfer in progress | Gateway transfer active |
| `consultation_in_progress` | Consultation in progress | Blocking transfer session phase |
| `second_session_disabled` | Second session disabled | `multiSessionsEnabled` false |
| `consultation_not_active` | Consultation not ready | Complete attended before consultation answered |
| `relationship_invalid` | Transfer relationship invalid | Missing source/consultation legs |

## Recovery (LF-031)

- On transfer failure, application restores valid call state (not terminal).
- When `autoUnholdOnTransferFailure` is true and source was `Held`, emit `CallAutoUnheldAfterTransferFailure` and resume source to `Active`.
- When setting is false, source returns to `Held`.

## Cancel Transfer (LF-030)

- `control-cancel-transfer` exits transfer mode without ending source call.
- Blocked with `transfer_in_progress` during gateway REFER.
- If consultation leg exists, hang up consultation and clear session before cancel event.

## Layout

```txt
[Active Call Controls]
[Transfer Panel — when transfer mode or multi-line]
  transfer-in-progress-indicator (conditional)
  transfer-failure-banner (conditional)
  multi-line-call-list (conditional)
  transfer-target-input
  [Blind Transfer] [Start Consultation] [Complete Attended] [Cancel]
```

## Components

| Component | Props | Callbacks |
| --- | --- | --- |
| `TransferPanel` | visibility, target, disabled reasons, failure, in-progress | onTargetChange, onBlindTransfer, onStartConsultation, onAttendedTransfer, onCancel |
| `MultiLineCallList` | `lines` from projection | none (presentational) |

## Accessibility

- Panel: `aria-label="Transfer call"`.
- Target input: `aria-label="Transfer target number"`.
- Failure banner: `role="alert"`.
- In-progress indicator: `role="status"`, `aria-live="polite"`.
- All buttons: keyboard focus, visible focus ring, descriptive `aria-label`.
- Cancel: Escape does not auto-close (explicit cancel only).

## Test IDs

- `transfer-panel`, `transfer-target-input`
- `control-blind-transfer`, `control-attended-transfer`, `control-start-consultation`, `control-cancel-transfer`
- `transfer-failure-banner`, `transfer-in-progress-indicator`
- `multi-line-call-list`, `call-line-{callId}`

## UI Tests

- TransferPanel renders all controls with correct test IDs.
- Disabled reasons surfaced via `aria-disabled` + status text.
- Failure banner has `role="alert"`.
- Multi-line list renders one row per `call-line-{callId}`.
