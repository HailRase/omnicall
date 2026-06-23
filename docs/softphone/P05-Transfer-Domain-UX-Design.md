# P05 Transfer Domain UX Design (WU2)

- Phase: `P05` WU2; Feature: `F-006` (blind transfer domain slice); Legacy: `LF-028`.
- Primary context: `Telephony`; projections: `transferProjection` + existing `callProjection` (no new React UI in WU2).
- Out of scope WU2: transfer mode panel, target entry UI, cancel button (`LF-030` UI → WU4); attended transfer (`F-007` → WU3).

## Domain / Projection States (blind transfer)

| Phase key | Meaning | Driven by event |
| --- | --- | --- |
| `idle` | No transfer in flight | initial / after terminal transfer outcome |
| `transfer_requested` | Transfer command accepted, pre-gateway | `CallTransferRequested` |
| `transferring` | Gateway REFER in progress (mock) | same event, in-flight |
| `transferred` | Blind transfer completed, call ended | `CallTransferred` |
| `transfer_failed` | Gateway or validation failure | `CallTransferFailed` |

## Disabled Reasons (projection-driven, WU4 surfaces)

| Reason key | User label (reserved) | When |
| --- | --- | --- |
| `transfer_not_allowed` | Transfer not available | Call state not `Active`/`Held`, or already `Transferring` |
| `no_active_call` | No active call | Missing `callId` in tracker |
| `invalid_target` | Invalid transfer target | Target fails `PhoneNumber` validation |
| `transfer_in_progress` | Transfer in progress | Hold/resume/mute/unmute while `callState` is `Transferring` |

## Error and Recovery

- `CallTransferFailed` carries normalized `reason`; projection sets `transfer_failed` and `lastFailureReason`.
- Application restores call out of `Transferring` via FSM `transfer_failed` → `Active` (held-line nuance deferred to WU4 `CallAutoUnheldAfterTransferFailure`).
- WU4 will show recovery banner; WU2 only projects failure facts.

## Active Call Controls During Transfer (WU2)

- `activeCallControlsProjection` syncs `callState` from transfer events (`CallTransferRequested` → `Transferring`, `CallTransferFailed` → `Active`, `CallTransferred`/`CallEnded` → `Ended`).
- Hold, resume, mute, unmute disabled with `transfer_in_progress` while `callState` is `Transferring`.
- Hangup remains **enabled** during blind transfer in-flight (FSM allows hangup from `Transferring`) — acts as emergency cancel until WU4 `control-cancel-transfer` exists.

## Reserved Test IDs (WU4 — not implemented WU2)

- `transfer-panel` — transfer mode shell container.
- `transfer-target-input` — target number entry.
- `control-blind-transfer` — blind transfer action button.
- `control-attended-transfer` — attended transfer (WU3+).
- `control-cancel-transfer` — cancel transfer (`LF-030`, WU4).
- `transfer-failure-banner` — failure recovery message.
- `transfer-in-progress-indicator` — in-flight status.

## WU3–WU4 Backlog Events (not implemented WU2)

- `TransferModeStarted`, `TransferModeCancelled`, `CallAutoUnheldAfterTransferFailure`.
- Attended consultation leg model and multi-line UI.
