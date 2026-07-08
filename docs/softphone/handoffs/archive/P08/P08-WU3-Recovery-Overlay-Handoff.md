# P08 WU3 Recovery Overlay Handoff

- Scope: `ConnectionOverlay`, `useConnectionRecoveryShell`, `useReconnectCountdown`, `deriveConnectionRecoveryShell`, legacy `server_terminate` inbound, facade/mock helpers; Feature `F-014`; legacy `LF-057`, `LF-049`.
- Out of scope WU3: manual retry Use Case (WU4), full logout cascade (LF-048 WU3+), app shutdown IPC (WU4), real adapters.

## Delivered (WU3)

| Area | Path |
| --- | --- |
| Overlay component | `src/renderer/components/recovery/ConnectionOverlay.tsx` |
| Shell hook | `src/renderer/hooks/useConnectionRecoveryShell.ts` |
| Countdown hook | `src/renderer/hooks/useReconnectCountdown.ts` |
| Shell derivation | `src/application/projections/deriveConnectionRecoveryShell.ts` |
| App wiring | `src/renderer/App.tsx` |
| Server terminate parse | `src/domain/operator/legacy operator/OcpInboundMessages.ts` |
| Inbound handler | `src/application/use-cases/removed inbound message use case.ts` |
| Mock helpers | `AccountBootstrapFacade.simulateServerTerminate` |
| Integration test | `src/application/integration/ServerTerminate.integration.test.ts` |
| UX inventory | `docs/softphone/P08-Recovery-UX-Design.md` (WU3 section) |

## Migration Evidence — LF-057 (Lost WS Overlay)

| Step | Path |
| --- | --- |
| Projection driver | `connectionRecoveryProjection` → `connectionState` |
| Shell flags | `deriveConnectionRecoveryShell` — `showOverlay`, `isBlocking`, channel rows |
| Presentational UI | `ConnectionOverlay` — channel rows, countdown, disabled retry |
| legacy operator platform-only banner | `isBlocking: false` when only legacy operator platform channel affected |
| SIP blocking | `role="alertdialog"` when SIP unsafe |
| Countdown | `useReconnectCountdown` — one-shot `setTimeout`, no `setInterval` |

## Migration Evidence — LF-049 (Server Terminate)

| Step | Path |
| --- | --- |
| Inbound parse | `parseOcpInboundMessage` — `server_terminate` / `entity_terminate` |
| Use Case | `removed inbound message use case` → `ServerTerminateReceived` |
| Orchestration | `ConnectionRecoveryOrchestrationService` stops scheduler on terminate |
| Projection | `connectionState: server_terminate`, `nextRetryAt: null` |
| Facade helper | `AccountBootstrapFacade.simulateServerTerminate` |
| Mock | `Mocklegacy operator gateway.simulateServerTerminate` |

## Deferred (WU4+)

| Item | Legacy | Target WU |
| --- | --- | --- |
| Manual retry Use Case + button wiring | LF-009, LF-010 | WU4 |
| Logout cascade on server terminate | LF-048 | WU3+ |
| App shutdown IPC | LF-079 | WU4 |
| JsSIP re-register menu | LF-010 | WU4 |

## WU3 Gate

- [x] `ConnectionOverlay` renders projection states (LF-057)
- [x] Countdown from `nextRetryAt` without polling
- [x] SIP-only / legacy operator mode visibility correct
- [x] a11y + test IDs per UX doc
- [x] Server terminate legacy operator platform → `ServerTerminateReceived` → overlay + scheduler stop (LF-049)
- [x] Component + integration tests
- [x] Handoff + registry + legacy evidence
- [x] WU1–WU2 regression green

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Baseline 458 → **476 tests** (+18).
