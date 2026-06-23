# P06 Operator Status UX Design (WU1)

- Phase: `P06` WU1; Feature: `F-010`; Legacy: `LF-018`, `LF-019`, `LF-041` (design), `LF-045`.
- Primary context: `Operator`; projections: `operatorStatusProjection`, `accountBootstrapProjection` (`isOcpMode`, `phoneStatus`).
- Out of scope WU1: React components, WebSocket, logout cascade (`LF-048` → P08), post-call UI, real OCP adapter.

## User Goal

View current OCP agent status, request allowed transitions, see duration in status, and understand why controls are disabled — without breaking SIP-only mode.

## Visual States (WU4 UI — design only in WU1)

| State key | Meaning | Projection driver |
| --- | --- | --- |
| `hidden` | SIP-only or OCP not connected | `isOcpStatusAvailable` false |
| `ocp_connected` | Status selector enabled | OCP authenticated + connected |
| `status_idle` | Stable current status | `statusChangeInProgress` false |
| `status_changing` | Pending gateway confirm | `AgentStatusChangeRequested` / `pendingStatus` |
| `status_rejected` | Last change failed | `AgentStatusChangeRejected` / `lastRejectionReason` |
| `timer_running` | Duration since last change | `statusChangedAt` (WU3) |

## Loading States

- Status buttons disabled with `status_change_in_progress` while gateway command runs.
- Initial sync: show last known status or placeholder until first `AgentStatusChanged` (WU2).

## Error States

| Banner / feedback | When |
| --- | --- |
| Rejection reason label | `AgentStatusChangeRejected` with `lastRejectionReason` |
| `invalid_transition` | FSM rejects disallowed target |
| `dnd_blocks_ready` | User requests Ready while phone DND active |

## Disabled Reasons (projection-driven)

| Reason key | User label (WU4) | When |
| --- | --- | --- |
| `ocp_not_connected` | Operator platform unavailable | SIP-only or OCP disconnected |
| `invalid_transition` | Status change not allowed | Target not in allowed transitions |
| `dnd_blocks_ready` | Ready unavailable while DND | `phoneStatus === "dnd"` and target Ready |
| `status_change_in_progress` | Status change in progress | Pending gateway response |
| `break_reason_required` | Break reason required | Break without valid `StatusReason` |

## DND Rules (LF-018, LF-019)

- **LF-019:** Ready control disabled while `phoneStatus` is `dnd`; domain rejects Ready transition with `dnd_blocks_ready`.
- **LF-018:** When phone enters DND and OCP is connected, application maps to break request (domain contract `mapDndToAgentBreakRequest`; full OCP command in WU2).
- `PhoneStatus` and `AgentStatus` remain separate concepts; no merged enum.

## Layout (WU4)

```txt
[Header]
  status-selector (OCP only)
    current status label
    status-timer
    control-change-ready
    control-change-break
  PhoneStatusBadge (unchanged — phone presence, not agent status)
```

## Components (WU4 — reserved test IDs)

| Test ID | Purpose |
| --- | --- |
| `status-selector` | Container for OCP status controls |
| `status-timer` | Duration in current status |
| `control-change-ready` | Request Ready |
| `control-change-break` | Request Break (opens reason when required) |
| `logout-reason-modal` | Logout reason capture (WU4) |

## Accessibility (WU4)

- Status selector: `aria-label="Operator status"`.
- Each control: keyboard focus, visible focus ring, non-color-only current status.
- Disabled controls: `aria-disabled` + `title` from projection disabled reason.

## Domain Events — WU1 Implemented

- `AgentStatusChangeRequested`
- `AgentStatusChanged`
- `AgentStatusChangeRejected`

## Domain Events — Backlog (WU2–WU4)

- `BreakReasonsReceived` (LF-078)
- `PostCallStatusUpdated` (LF-044, LF-062)
- `AgentLogoutRequested` (LF-047)
- `AgentLoggedOut` (LF-048 deferred P08)
- `AgentStatusSynced` (initial OCP sync, WU2)

## Callbacks → Use Cases (WU2+)

| UI action | Use Case |
| --- | --- |
| Ready | `ChangeAgentStatusUseCase` → `ready` |
| Break | `ChangeAgentStatusUseCase` → `break` + reason |
| Post-call complete | `UpdatePostCallStatusUseCase` |
| Logout | `LogoutOperatorUseCase` |

## SIP-Only Mode

- Hide or fully disable `status-selector`; projection `isOcpStatusAvailable: false`.
- No broken OCP-only controls; `PhoneStatusBadge` unchanged.
