# P07 WU4 OCP Sync Polish Handoff

- Scope: `dlg_stop` exactly-once, OCP toast notifications, queue `na` timeout, P07 phase gate; legacy `LF-037` (timeout), `LF-059`, `LF-063`, `LF-064`.
- Out of scope WU4: real OCP WebSocket, P08 reconnect overlay, E2E harness, `LF-050` CallButtonBlocked, `LF-065` external host events (P12).

## Delivered (WU4)

| Area | Path |
| --- | --- |
| Domain events | `dlgStopEvents.ts`, `ocpNotificationEvents.ts` |
| Domain policy | `DlgStopPolicy.ts` — exactly-once per `callId` |
| Port | `OcpSyncGateway.sendDlgStop` |
| Use Case | `SendDlgStopUseCase` |
| Orchestration | `CallEndDlgStopOrchestrationService` → `AccountBootstrapFacade` |
| Inbound notification | `OcpInboundMessages` + `ProcessOcpInboundMessageUseCase` |
| Projections | `ocpNotificationProjection.ts`, `queueInfoProjection` NA timeout |
| Mock | `MockOcpSyncGateway.sendDlgStop`, `createSampleOcpNotificationRawMessage` |
| UI | `OcpToastStack.tsx`, `useOcpNotifications.ts`, `useQueueLabelNaTimer.ts` |
| Store | `ocpNotificationProjection` in `useAccountBootstrapStore` |
| Integration | `OcpDlgStopSync.integration.test.ts`, `OcpNotificationSync.integration.test.ts` |

## Migration Evidence — LF-063 / LF-064 (`dlg_stop`)

| Step | Path |
| --- | --- |
| Exactly-once policy | `DlgStopPolicy.ts` |
| Gateway send | `SendDlgStopUseCase` → `MockOcpSyncGateway.sendDlgStop` |
| Call end hook | `CallEndDlgStopOrchestrationService` on `CallEnded`, `IncomingCallEndedBeforeAnswer`, `CallFailed` |
| Correlation lookup | `OcpCallCorrelationRegistry` before lifecycle cleanup (orchestration subscribes first) |
| Events | `DlgStopRequested`, `DlgStopSent` (after gateway confirm) |
| SIP-only | `isOcpSyncAvailable` false → no gateway call |

## Migration Evidence — LF-059 (OCP Toasts)

| Step | Path |
| --- | --- |
| Domain event | `OcpNotificationReceived` |
| Projection | `ocpNotificationProjection.ts` |
| Hook | `useOcpNotifications.ts` — UI-only dismiss |
| Component | `OcpToastStack.tsx` (`data-testid="ocp-toast"`) |
| SIP-only hide | `isOcpMode` + `isOcpSyncAvailable` → empty stack |

## Migration Evidence — LF-037 (`na` Timeout)

| Step | Path |
| --- | --- |
| Loading timestamp | `queueLoadingSinceByCallId` on `IncomingCallReceived` |
| Derivation | `deriveQueueLabelState` + `QUEUE_LABEL_NA_TIMEOUT_MS` (5s) |
| Timer hook | `useQueueLabelNaTimer` — single `setTimeout`, cleanup on unmount |
| UI copy | `mapQueueLabelState` → `"N/A"` |

## Product Rule — Campaign Modal Close (WU3 review)

- **Close = dismiss without gateway** (legacy audit: operator may defer decision).
- Implemented in `useCampaignActions.handleCloseModal` — adds campaign to `dismissedCampaignIds`; does **not** call `RespondToCampaignUseCase`.
- Reject button still sends gateway reject via `RespondToCampaignUseCase`.

## Deferred

| Item | Legacy | Reason |
| --- | --- | --- |
| `CallButtonBlocked` | LF-050 | P12/host integration scope; ADR not required for optional WU4 item |
| External call events | LF-065 | Phase P12 host API |
| Real OCP WebSocket | — | Post-mock adapter phase |
| E2E campaign + queue UI | F-015 | Harness deferred |

## WU4 / P07 Phase Gate

- [x] `dlg_stop` exactly-once tested (LF-063, LF-064)
- [x] OCP notification projection + toast UI (LF-059)
- [x] Queue `na` timeout without infinite loading (LF-037)
- [x] SIP-only no-op verified
- [x] P07-Agent-Continuation-Handoff + F-015 status update
- [x] Regression green

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Baseline 403 → **424** tests (+21) after WU4.

**Stop here. Phase P07 complete. Next: P08 Connection Loss (LF-048 logout cascade overlap).**
