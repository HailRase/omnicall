# P05 Multi-Call Policy UX Design (WU1)

- Phase: `P05` WU1; Features: `F-006`/`F-007` policy slice; Legacy: `LF-021`, `LF-023`, `LF-032`.
- Primary context: `Telephony`; UI consumes `multiCallProjection` + existing auth/call projections only.
- Visual states: `single_active_call`, `second_call_blocked`, `hold_all_before_dial_in_progress`.
- Transfer mode visual state — **out of scope WU1**; see WU4 backlog in `P05-WU1-Multi-Call-Policy-Handoff.md`.

## Disabled Reasons (projection-driven)

| Reason key | User label | Surfaces |
| --- | --- | --- |
| `second_session_disabled` | Second session disabled | Dialpad call button, incoming answer |
| `hold_all_in_progress` | Holding other calls… | Dialpad call button, `multi-call-hold-all-indicator` |
| `not_registered` | Not registered | Dialpad (reuse auth projection) |
| `ocp_reserved` | OCP reserved | Dialpad (reuse auth projection) |

## Hold-All Batch (LF-021)

- Loading: dialpad call disabled with `hold_all_in_progress`; shell shows `multi-call-hold-all-indicator`; outgoing card unchanged until `OutgoingCallRequested`.
- Success: `AllOtherCallsHeld` (`phase: completed`) → dial proceeds; established calls show `Held` in call projection.
- Error: hold gateway failure emits `AllOtherCallsHeld` (`phase: failed`) + `ActiveCallControlFailed`; dial does not start (`OutgoingCallRequested` not emitted); projection clears `holdAllInProgress`; dialpad re-enabled when policy allows.
- Recovery: retry last failed hold via existing P04 retry path on active call controls.

## Second Session Block (LF-032)

- Outgoing: `SecondSessionBlocked` emitted; dialpad shows `second_session_disabled`; no new `OutgoingCallRequested`.
- Incoming: modal remains visible; answer button disabled with `second_session_disabled`; visible `incoming-answer-disabled-reason`; reject stays enabled.

## Exclusive Hold (LF-023)

- WU1: resume on held line silently auto-holds other active lines before resume (application orchestration).
- Visible user reason only when exclusive-hold auto-hold fails — via P04 `ActiveCallControlFailed` on resume control (`resume failed`), not a separate multi-call projection reason.

## Test IDs (WU1 surfaces)

- `dialpad-disabled-reason` — dialpad disabled hint (`Dialpad.tsx`).
- `incoming-answer-disabled-reason` — incoming modal answer disabled hint (`IncomingCallActions.tsx`).
- `multi-call-hold-all-indicator` — shell status when `hold_all_in_progress` (`MultiCallHoldAllIndicator.tsx`).

## WU2–WU4 Backlog Events (design only, not implemented WU1)

- `TransferModeStarted`, `TransferModeCancelled`, `CallTransferRequested`, `CallTransferred`, `CallTransferFailed`, `CallAutoUnheldAfterTransferFailure`.
