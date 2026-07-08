# P08 WU2 Recovery Orchestration Handoff

- Scope: `ReconnectScheduler`, `ConnectionRecoveryOrchestrationService`, port `reconnectTransport`, mock wiring, facade transport handlers, SIP/legacy operator platform integration tests; Feature `F-014`; legacy `LF-008`, `LF-057`, `LF-058`.
- Out of scope WU2: connection overlay React (WU3), logout cascade (WU3+), manual retry menu (WU4), real JsSIP/WebSocket adapters, Electron shutdown IPC (WU4).

## Delivered (WU2)

| Area | Path |
| --- | --- |
| Scheduler | `src/application/infrastructure/ReconnectScheduler.ts` |
| Orchestration | `src/application/services/ConnectionRecoveryOrchestrationService.ts` |
| Facade wiring | `AccountBootstrapFacade` — transport handlers + test helpers |
| SIP integration | `src/application/integration/SipRecoveryOrchestration.integration.test.ts` |
| legacy operator platform integration | `src/application/integration/OcpRecoveryOrchestration.integration.test.ts` |
| Port extensions | `TelephonyGateway.reconnectTransport`, `legacy operator gateway.reconnectTransport` |
| Mock adapters | `MockTelephonyGateway`, `Mocklegacy operator gateway` — disconnect simulate + reconnect |

## Migration Evidence — LF-008 (SIP Reconnect Chain)

| Step | Path |
| --- | --- |
| Transport hook | `TelephonyGateway.setTransportDisconnectedHandler` → orchestration |
| Policy | `SIP_RECONNECT_POLICY_CONFIG` via `planReconnectAttempt` |
| Events | `SipReconnectScheduled` → `SipReconnectSucceeded` / `SipReconnectFailed` |
| Gateway | `reconnectTransport(correlationId)` — mock maps `reconnectScenario` |
| Projection | `connectionRecoveryProjection` — `reconnecting` → `connected` |
| Facade helper | `simulateSipTransportDisconnected` (dev/test) |

## Migration Evidence — LF-058 (legacy operator platform WS 6×5s Retry)

| Step | Path |
| --- | --- |
| Transport hook | `legacy operator gateway.setTransportDisconnectedHandler` → orchestration |
| Disconnect event | `legacy disconnect event` then `OcpReconnectScheduled` |
| Policy | `OCP_RECONNECT_POLICY_CONFIG` (6 attempts, 5s flat) |
| Terminal | `OcpReconnectFailed` with `isTerminal: true` on attempt 6 |
| SIP-only | legacy operator platform orchestration no-op when `isOcpMode` false |
| Facade helper | `simulateOcpTransportDisconnected` (dev/test) |

## Correlation IDs

- Disconnect `correlationId` reused across all retry attempts in one recovery session.
- Logs: `operation`, `correlationId`, `featureId: F-014`, `attemptNumber`, `delayMs`, `result`.

## Scheduler Cleanup

- Cancel on: `*ReconnectSucceeded`, terminal `*ReconnectFailed`, `ServerTerminateReceived`, `dispose()`.
- No `setInterval`; one-shot `setTimeout` via injectable `ReconnectScheduler`.

## Deferred (WU3–WU4)

| Item | Legacy | Target WU |
| --- | --- | --- |
| Connection overlay React | LF-057 | WU3 |
| Logout cascade | LF-048 | WU3+ |
| Manual retry Use Case + menu | LF-009, LF-010 | WU4 |
| `ServerTerminateReceived` cascade handler | LF-049 | WU3 |
| App shutdown IPC | LF-079 | WU4 |

## WU2 Gate

- [x] SIP transport disconnect → retry chain → projection (LF-008)
- [x] legacy operator platform disconnect → 6×5s retry → terminal (LF-058)
- [x] Scheduler cleanup on success/terminal/terminate
- [x] Facade + mock wiring
- [x] Integration tests with fake timers
- [x] Handoff + registry + legacy evidence
- [x] P07/P08 WU1 regression green

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Baseline 451 → **458 tests** (+7).
