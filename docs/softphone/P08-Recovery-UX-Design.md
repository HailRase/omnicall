# P08 Recovery UX Design (WU1 — design only)

- Phase: `P08` WU1; Feature: `F-014`; Legacy: `LF-008`, `LF-057`, `LF-048` (design note), `LF-058`.
- Primary context: `Telephony` + `Operator`; projection: `connectionRecoveryProjection` (WU1 skeleton).
- Out of scope WU1: React overlay (WU3), retry scheduler wiring (WU2), logout cascade impl (WU3+), manual menu re-register (WU4).

## User Goal

Understand which connection failed (OCP, SIP, or both), see automatic retry progress, manually retry when allowed, and reach a safe terminal state without hidden failures.

## Connection Overlay States (`LF-057`)

| State key | Meaning | Projection driver |
| --- | --- | --- |
| `connected` | OCP (if enabled) and SIP transports healthy | no pending reconnect; `RegistrationSucceeded` / `OcpReconnectSucceeded` |
| `ocp_disconnected` | OCP WebSocket lost; SIP may still work | `OcpDisconnected`; OCP-only overlay copy |
| `sip_disconnected` | SIP registration/transport lost; OCP may still work | `RegistrationFailed` or SIP reconnect chain |
| `reconnecting` | Automatic retry in progress | `OcpReconnectScheduled` / `SipReconnectScheduled` |
| `reconnect_failed` | Max attempts exhausted | `OcpReconnectFailed` / `SipReconnectFailed` with `isTerminal: true` |
| `manual_retry_available` | User may trigger retry Use Case (WU4) | terminal failure + manual retry policy |
| `server_terminate` | Server forced logout (`LF-049`) | `ServerTerminateReceived` |

## SIP-Only vs OCP Mode

| Mode | Overlay scope | OCP fields |
| --- | --- | --- |
| SIP-only (`StartupModeResolved.sip_only_ready`) | SIP disconnect/reconnect only; no OCP overlay | `ocpReconnectAttempt` N/A; OCP events no-op in projection |
| OCP enabled | Combined overlay when either channel fails | Shows OCP attempt + countdown; SIP row when both affected |

Active SIP call controls remain reachable during OCP-only disconnect unless SIP is also down (blueprint rule).

## Loading States

- `reconnecting`: spinner + attempt `n` of `max` + countdown from `nextRetryAt`.
- Initial disconnect: brief transition before first `*ReconnectScheduled` event.

## Error States

| Feedback | When |
| --- | --- |
| Channel label (OCP / SIP) | `ocp_disconnected` vs `sip_disconnected` |
| `lastFailureReason` text | terminal or last failed attempt |
| `reconnect_failed` banner | max attempts reached |
| `server_terminate` | non-dismissable until cascade completes (WU3) |

## Disabled States

| Control | Disabled reason |
| --- | --- |
| `control-retry-connection` | `reconnecting` in progress |
| `control-retry-connection` | not in `manual_retry_available` |
| Dialpad / call (optional) | SIP not registered — existing projection |

## Recovery States

- Auto-retry driven by `ReconnectPolicy` (WU1 domain); scheduler emits `*ReconnectScheduled` (WU2).
- Success: `*ReconnectSucceeded` → `connected`.
- Manual retry (WU4): `RetryConnectionUseCase` resets attempt counter.
- Logout cascade (`LF-048`): design note — `ServerTerminateReceived` / `AgentLoggedOut` triggers ordered teardown WU3+; overlay shows safe logout path.

## Layout (WU3 — implemented)

```txt
[ConnectionOverlay] data-testid="connection-overlay"
  channel-status-row (OCP | SIP) — data-testid="connection-channel-ocp|sip"
  reconnect-countdown data-testid="reconnect-countdown"
  control-retry-connection data-testid="control-retry-connection" (disabled until WU4)
  control-safe-logout data-testid="control-safe-logout" (disabled placeholder LF-048)
```

## WU3 State Inventory (LF-057, LF-049)

| State | Visible copy | Loading | Error | Disabled | Recovery | a11y | Test IDs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `connected` | hidden | — | — | — | — | — | overlay not mounted |
| `ocp_disconnected` | "OCP connection lost" | — | `lastFailureReason` | retry: not WU4 | auto-retry pending | `role="region"` banner | `connection-overlay`, `connection-channel-ocp` |
| `sip_disconnected` | "SIP connection lost" | — | `lastFailureReason` | retry disabled | auto-retry pending | `role="alertdialog"` | `connection-channel-sip` |
| `reconnecting` | "Reconnecting" + spinner text | attempt n of max | — | retry: in progress | countdown `nextRetryAt` | `aria-live="polite"` on countdown | `reconnect-countdown` |
| `reconnect_failed` | "Connection could not be restored" | — | `lastFailureReason` | retry: not WU4 | manual retry WU4 | blocking if SIP affected | channel attempt rows |
| `manual_retry_available` | "Connection failed" | — | `lastFailureReason` | retry enabled WU4 | user retry | blocking if SIP | `control-retry-connection` |
| `server_terminate` | non-dismissable session ended | — | `lastFailureReason` | retry + safe logout disabled | cascade WU3+ | `role="alertdialog"` | `connection-server-terminate` |

SIP-only: OCP row hidden; OCP inbound no-op. OCP-only disconnect: non-blocking banner; active call controls stay reachable.

## Components (WU3)

| Test ID | Purpose |
| --- | --- |
| `connection-overlay` | Full-screen or semi-modal lost-connection panel |
| `control-retry-connection` | Manual retry button (WU4 wiring) |
| `reconnect-countdown` | Seconds until next automatic attempt |

## Accessibility (WU3 — implemented)

- Overlay: `role="alertdialog"` when blocking; `aria-live="polite"` for countdown updates.
- Retry button: `aria-label="Retry connection"`; keyboard Enter/Space.
- Non-color-only: text channel name + attempt fraction, not color alone.
- Focus trap only when SIP controls are unsafe; otherwise non-modal banner.

## Callbacks → Use Cases (WU2–WU4)

| Callback | Use Case |
| --- | --- |
| `onManualRetry` | `RetryConnectionUseCase` (WU4) |
| `onSafeLogout` | `LogoutOperatorUseCase` cascade (WU3) |

## Correlation IDs

All recovery domain events carry `correlationId`; overlay reads projection only (no adapter access).

## WU5 — SIP User Session Logout (LF-079)

| State | UI | Test ID |
| --- | --- | --- |
| idle, no calls | End session enabled | `control-end-session` |
| active telephony | Confirmation modal | `logout-active-session-modal` |
| confirm / cancel | Modal actions | `control-logout-confirm`, `control-logout-cancel` |
| logout in progress | Control disabled, reason "Logout in progress" | `control-end-session` |
| completed | Account panel, registration offline | `account-panel` |
| failed | Error banner + retry | `logout-error-banner` |

SIP-only: `deriveSessionLogoutShell` drives confirmation requirement from telephony projections. `EndUserSessionUseCase` → `SessionTeardownOrchestrationService` → `UserSessionEnded`.

## Domain Events — WU1 Implemented

- `OcpDisconnected`, `OcpReconnectScheduled`, `OcpReconnectSucceeded`, `OcpReconnectFailed`
- `SipReconnectScheduled`, `SipReconnectSucceeded`, `SipReconnectFailed`
- `ServerTerminateReceived`
- Backlog WU3+: `AppShutdownRequested`, `AgentLoggedOut` (`LF-048`)
