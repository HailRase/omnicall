# P08 WU1 Recovery Domain Foundation Handoff

- Scope: reconnect policy, WU1 recovery domain events, `connectionRecoveryProjection` skeleton, port disconnect hooks (stubs), UX design; Feature `F-014`; legacy `LF-008`, `LF-057`, `LF-058`, `LF-048` (design), `LF-049` (event skeleton).
- Out of scope WU1: connection overlay React UI (WU3), retry scheduler/orchestration (WU2), logout cascade (WU3+), manual re-register menu (WU4), Electron shutdown IPC (WU4).

## Delivered (WU1)

| Area | Path |
| --- | --- |
| UX design | `docs/softphone/P08-Recovery-UX-Design.md` |
| Reconnect policy | `src/domain/shared/recovery/ReconnectPolicy.ts` |
| OCP recovery events | `src/domain/operator/events/ocpRecoveryEvents.ts` |
| SIP recovery events | `src/domain/telephony/events/sipRecoveryEvents.ts` |
| Server terminate event | `src/domain/operator/events/serverTerminateEvents.ts` |
| Projection | `src/application/projections/connectionRecoveryProjection.ts` |
| Store wire | `useAccountBootstrapStore.connectionRecoveryProjection` |
| Ports | `TelephonyGateway.setTransportDisconnectedHandler`, `OperatorPlatformGateway.setTransportDisconnectedHandler` |
| Mock stubs | `MockTelephonyGateway`, `MockOperatorPlatformGateway` |

## Reconnect Policy Presets

| Preset | Legacy | Constants |
| --- | --- | --- |
| `OCP_RECONNECT_POLICY_CONFIG` | LF-058 | 6 attempts, 5s flat, 10% jitter |
| `SIP_RECONNECT_POLICY_CONFIG` | LF-008 | 10 attempts, 2s base, ×2 backoff, 15% jitter, 60s cap |

## Migration Evidence — LF-008 (SIP Retry Policy)

| Step | Path |
| --- | --- |
| Explicit policy | `ReconnectPolicy.ts` — `SIP_RECONNECT_POLICY_CONFIG` |
| Domain events | `sipRecoveryEvents.ts` |
| Projection | `connectionRecoveryProjection` — `SipReconnect*` + `RegistrationFailed` |
| Port hook | `TelephonyGateway.setTransportDisconnectedHandler` (WU2 wiring) |

## Migration Evidence — LF-057 / LF-058 (OCP Overlay + WS Retry)

| Step | Path |
| --- | --- |
| UX states | `P08-Recovery-UX-Design.md` — test IDs reserved |
| OCP policy | `OCP_RECONNECT_POLICY_CONFIG` |
| Domain events | `ocpRecoveryEvents.ts` |
| Projection | `connectionRecoveryProjection` — OCP fields N/A in SIP-only |
| Port hook | `OperatorPlatformGateway.setTransportDisconnectedHandler` (WU2) |

## Design Note — LF-048 (Logout Cascade)

- `P08-Recovery-UX-Design.md` documents safe logout path on `server_terminate`.
- Backlog events: `AppShutdownRequested`, `AgentLoggedOut` (extends existing `AgentLogoutRequested`).
- Ordered teardown: OCP close → SIP unregister → call hangup → projection reset (WU3+).

## Correlation IDs (WU2 orchestration contract)

Every recovery event factory requires `correlationId`. Scheduler/orchestration service (WU2) must:

1. Reuse disconnect `correlationId` across retry attempts for one recovery session.
2. Log: operation, correlationId, feature `F-014`, attempt number, delayMs, result.
3. Clean up timers on success, terminal failure, or `ServerTerminateReceived`.

## Deferred (WU2–WU4)

| Item | Legacy | Target WU |
| --- | --- | --- |
| Retry scheduler with timer cleanup | LF-008, LF-058 | WU2 |
| `ConnectionRecoveryOrchestrationService` | — | WU2 |
| Lost connection overlay React | LF-057 | WU3 |
| Logout cascade | LF-048 | WU3+ |
| Manual retry Use Case + menu | LF-009, LF-010 | WU4 |
| `ServerTerminateReceived` handler | LF-049 | WU3 |
| App shutdown IPC | LF-079 | WU4 |

## WU1 Gate

- [x] UX doc before domain
- [x] `ReconnectPolicy` unit-tested (backoff/jitter/max)
- [x] WU1 recovery events typed + tested
- [x] `connectionRecoveryProjection` skeleton + store
- [x] F-014 → `in_progress`
- [x] LF-008 evidence; LF-057/048 design refs
- [x] P07 regression green

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Baseline 424 → see test output after WU1.
