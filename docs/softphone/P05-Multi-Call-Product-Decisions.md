# P05 Multi-Call — Product Decisions (Canonical)

## Type

DOCUMENT.

**Status:** Accepted (2026-06-25).  
**Scope:** SIP-only product path; OCP deferred (ADR-0002).  
**Features:** F-002, F-003, F-004, F-006, F-007 (policy slice).  
**Legacy:** LF-021, LF-023, LF-032.

Supersedes ambiguous WU1-only behavior where noted. Implementation: **P05 WU6**.

## Core model

- **Session (call line)** = first-class object: own state (`Ringing`, `Connecting`, `Active`, `Held`, …), hold, mute, media attach flags.
- **Active unheld** = at most **one** line with live conversation audio at a time.
- **multiSessionsEnabled** default: **true** (SIP-only).
- **No hard max** line count in product; practical limit = SBC + adapter capability.
- **Fail-safe rule:** policy conflicts or unhandled scenarios **must not hang up or drop** existing calls. Reject the operation, log, surface user-visible reason.

## A. States and limits

| ID | Decision |
| --- | --- |
| A1 | While any line is `Connecting`, block new outgoing dial and incoming **answer**. First `Connecting` unchanged. |
| A2 | Multiple simultaneous incoming `Ringing` — **deferred** to Tone FSM backlog (`MULTI-CALL-BACKLOG.md` § Tone). WU6: no duplicate tones; incoming ringtone priority highest. |
| A3 | `multiSessionsEnabled=false` + established call exists → second incoming **auto-reject 486** (not only disable Answer). |

## B. Hold-all and failures

| ID | Decision |
| --- | --- |
| B0 | **Outgoing** and **incoming answer** (when multi-sessions ON) run **hold-all** on all other `Active` lines before proceeding (symmetry LF-021). |
| B1 | Hold-all **partial failure** (e.g. 2nd hold fails after 1st held): **compensating rollback** — attempt unhold on calls already held in this batch; emit `AllOtherCallsHeld` `phase: failed`; reject dial/answer; **no hangup**. If rollback unhold also fails → `MultiCallOperationRejected` + banner; leave lines as-is; log snapshot. |
| B2 | While `hold_all_in_progress`, block **all** conflicting telephony ops: dial, answer, resume, transfer start. |
| B3 | Exclusive resume: **single** auto-hold attempt on other `Active` lines; on failure leave current `Active` unchanged; error via `ActiveCallControlFailed`; **no automatic retry loop**. |

## C. Audio and active line

| ID | Decision |
| --- | --- |
| C1 | Remote audio attach: **only** the single `Active` unheld line. Held / other lines: no remote audio mix. |
| C2 | On Active↔Held swap (exclusive resume or hold-all), **stop** non-priority tones on other lines (ringback, etc.). Full priority arbiter → Tone FSM backlog. |
| C3 | Mute **per call** (per session state), not global. |

## D. Hangup and logout

| ID | Decision |
| --- | --- |
| D1 | Hangup `Active` while other `Held` lines exist → **no auto-resume**; operator manually resumes desired line. |
| D2 | Remote party ends `Held` line → remove line only; **no** change to `Active`, no tones on unrelated lines. |
| D3 | End session (logout) with 2+ lines → existing confirm modal; on confirm → `EndUserSessionUseCase` hangs up **all** lines (current behavior). |

## E. Transfer (deferred refactor)

| ID | Decision | Status |
| --- | --- | --- |
| E1 | Consultation = normal outbound line for limits. | Current code |
| E2 | Incoming during attended transfer → allowed; accept cancels transfer mode. | **Backlog** — transfer-per-session mode |
| E3 | Blind transfer in progress + dial — shared input UX. | **Backlog** — transfer UI refactor |

Do **not** implement E2/E3 in WU6. See `MULTI-CALL-BACKLOG.md` § Transfer mode.

## F. Auto-answer, DND, settings

| ID | Decision |
| --- | --- |
| F1 | Auto-answer while another established/active call exists → **block** (future setting may override). |
| F2 | DND ON with active lines → finish existing calls; **new** incoming auto-reject; no forced hangup of active. |
| F3 | `multiSessionsEnabled` default **true**. |

## G. Real adapter / SBC

| ID | Decision |
| --- | --- |
| G1 | WU6 delivers **mock + domain + application** first; **RAT step 08** real JsSIP multi-call smoke after mock gate. |
| G2 | SBC cannot hold N lines → `MultiCallOperationRejected`, log details; **no drop**. User diagnostics UI deferred (P09). |

## Unhandled / conflict behavior (mandatory)

1. Publish `MultiCallOperationRejected` (Domain) with `scenario`, `reason`, `affectedCallIds`, `correlationId`.
2. Projection: `multiCallProjection.lastPolicyViolation` → banner `multi-call-policy-error`.
3. **Forbidden:** silent hangup, auto-reject of unrelated lines, “fix” by teardown.
4. Log: operation, scenario, line snapshot (id + state), normalized error.

## Implementation gaps (WU6 targets)

| Gap | Current | WU6 |
| --- | --- | --- |
| Incoming answer hold-all | Missing in `IncomingCallOrchestrator` | Add |
| Connecting blocks second op | Partial (`deriveSecondSessionDialpadDisabled`) | Extend to answer/resume |
| multiSessions OFF auto-486 | Block answer only | Auto-reject second incoming |
| Fail-safe event | None | `MultiCallOperationRejected` |
| Per-session UI shell | Transfer-only `MultiLineCallList` | `CallLinesShell` WU6 |
| Real multi-call smoke | Not started | RAT step 08 |

## Related

- UX: `P05-Multi-Call-Policy-UX-Design.md` (WU6 section)
- Agent prompt: `handoffs/P05-WU6-Multi-Call-Completeness-Agent-Prompt.md`
- Backlog: `MULTI-CALL-BACKLOG.md`
- RAT: `real-integration/step-08-multi-call-real.md`
