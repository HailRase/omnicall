# P05 Multi-Call Policy UX Design (WU1 + WU6)

- Phase: `P05` WU1 (done) + **WU6** (completeness); Features: F-002, F-003, F-004, F-006, F-007 policy; Legacy: LF-021, LF-023, LF-032.
- **Canonical product law:** `P05-Multi-Call-Product-Decisions.md`
- Primary context: `Telephony`; UI consumes projections + `UI-Architecture.md` shells.
- Visual states: `single_active_call`, `second_call_blocked`, `hold_all_before_dial_in_progress`, **`call_lines_panel`**, **`multi_call_policy_error`**.
- Transfer mode — **deferred refactor** (`MULTI-CALL-BACKLOG.md` § Transfer).

## Disabled Reasons (projection-driven)

| Reason key | User label | Surfaces |
| --- | --- | --- |
| `second_session_disabled` | Second session disabled | Dialpad call button, incoming answer |
| `hold_all_in_progress` | Holding other calls… | Dialpad, answer, resume, transfer start, `multi-call-hold-all-indicator` |
| `connecting_in_progress` | Call connecting… | Dialpad, incoming answer, resume |
| `multi_call_policy_violation` | Operation not allowed (see message) | `multi-call-policy-error` banner |
| `not_registered` | Not registered | Dialpad (reuse auth projection) |
| `ocp_reserved` | OCP reserved | Dialpad (reuse auth projection) |

## Hold-All Batch (LF-021)

- Loading: dialpad call disabled with `hold_all_in_progress`; shell shows `multi-call-hold-all-indicator`; outgoing card unchanged until `OutgoingCallRequested`.
- Success: `AllOtherCallsHeld` (`phase: completed`) → dial proceeds; established calls show `Held` in call projection.
- Error: hold gateway failure emits `AllOtherCallsHeld` (`phase: failed`) + `ActiveCallControlFailed`; dial does not start (`OutgoingCallRequested` not emitted); projection clears `holdAllInProgress`; dialpad re-enabled when policy allows.
- Recovery: retry last failed hold via existing P04 retry path on active call controls.

## Second Session Block (LF-032)

- Outgoing: `SecondSessionBlocked` emitted; dialpad shows `second_session_disabled`; no new `OutgoingCallRequested`.
- Incoming (multi-sessions OFF): **auto-reject 486** when established call exists (WU6); no answer path.
- Incoming (multi-sessions ON): hold-all on answer (WU6); see Hold-All Batch.

## WU6 — Call lines panel

| State | UI | Test ID |
| --- | --- | --- |
| 2+ established lines | `CallLinesShell` list | `call-lines-panel` |
| Per line | role, state, hold/mute badges | `call-line-{id}` |
| Resume held | exclusive swap | `control-resume-line-{id}` |
| Policy error | non-blocking banner | `multi-call-policy-error` |

Per-session mute/hold state from projections — not local component state.

## WU6 — Fail-safe banner

- Driver: `MultiCallOperationRejected` → `multiCallProjection.lastPolicyViolation`
- Copy: user-safe message from `reason` / `scenario` map (no SIP codes alone)
- **No** automatic hangup or line clear

## Exclusive Hold (LF-023)

- WU1: resume on held line silently auto-holds other active lines before resume (application orchestration).
- Visible user reason only when exclusive-hold auto-hold fails — via P04 `ActiveCallControlFailed` on resume control (`resume failed`), not a separate multi-call projection reason.

## Test IDs (WU1 surfaces)

- `dialpad-disabled-reason` — dialpad disabled hint (`Dialpad.tsx`).
- `incoming-answer-disabled-reason` — incoming overlay answer disabled hint (`IncomingCallOverlay.tsx`).
- `multi-call-hold-all-indicator` — shell status when `hold_all_in_progress` (`MultiCallHoldAllIndicator.tsx`).
- `call-lines-panel` — WU6 multi-line shell.
- `multi-call-policy-error` — WU6 fail-safe banner.

## Deferred (see MULTI-CALL-BACKLOG.md)

- Tone priority FSM (A2)
- Transfer per-session mode (E)
- Diagnostics UI for SBC policy failures (G2)
