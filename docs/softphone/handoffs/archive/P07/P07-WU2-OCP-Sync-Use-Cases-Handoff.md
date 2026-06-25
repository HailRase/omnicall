# P07 WU2 OCP Sync Use Cases Handoff

- Scope: WU2 inbound sync Use Cases, correlation registry, incoming projection wire; legacy `LF-037` integration, `LF-038` event/projection prep.
- Out of scope WU2: React campaign modal / queue-info-label UI (WU3–WU4), real OCP WebSocket, `dlg_stop`, `LF-040` campaign answer/reject Use Cases.

## Architecture Decision — Correlation Timing

- **When registered:** `TelephonyIncomingCallNotification.mainAcallId` (optional adapter metadata) → `RegisterOcpCallCorrelationUseCase` in `AccountBootstrapFacade` incoming handler, **after** `CallEngine.handleIncomingReceived`.
- **Why not on `IncomingCallReceived` event alone:** SIP adapter owns `main_acallid`; telephony port carries typed optional metadata without OCP imports in Domain telephony events.
- **Cleanup:** `InMemoryOcpCallCorrelationRegistry` removes on `CallEnded` / `IncomingCallEndedBeforeAnswer`; clears on `OcpAuthenticationFailed` / SIP-only `StartupModeResolved`.

## Delivered (WU2)

| Area | Path |
| --- | --- |
| Port | `OcpCallCorrelationRegistry`, `OcpSyncReadModel` |
| Registry | `InMemoryOcpCallCorrelationRegistry` |
| Use Cases | `RegisterOcpCallCorrelationUseCase`, `ProcessOcpInboundMessageUseCase` |
| Events | `OcpCallCorrelationRegistered`, `CampaignEventReceived` |
| Projections | `incomingCallProjection.queueInfo` wire, `campaignProjection` skeleton |
| Facade | `AccountBootstrapFacade.processOcpInboundMessageRaw`, correlation on incoming |
| Mock | `MockOcpSyncGateway` scenarios, `TelephonyIncomingCallNotification.mainAcallId` |
| Integration | `OcpQueueInfoSync.integration.test.ts` |
| Logging | `ocp_queue_info_matched`, `ocp_queue_info_rejected`, `ocp_call_correlation_registered` |

## Migration Evidence — LF-037 (Queue Name E2E)

| Step | Path |
| --- | --- |
| Inbound parse | `OcpSyncGateway.parseInboundMessage` → `ProcessOcpInboundMessageUseCase` |
| Exact match | `matchQueueInfoToCall` (domain rule, no Application substring logic) |
| Event | `QueueInfoReceived` |
| Incoming UI read model | `incomingCallProjection.queueInfo`, `uiState: queueInfoPending → callerIdentityResolved` |
| Store | `useAccountBootstrapStore` reducers |

## Migration Evidence — LF-038 (Prep)

| Area | Path |
| --- | --- |
| Event | `CampaignEventReceived` |
| Projection | `campaignProjection` + store wire |
| UI | WU3–WU4 |

## Backlog — WU3+

| Item | Legacy | Work Unit |
| --- | --- | --- |
| Campaign modal React UI | LF-039 | WU3–WU4 |
| `queue-info-label` component | LF-037 | WU3 |
| Campaign accept/reject Use Cases | LF-040 | WU3 |
| `dlg_stop` exactly-once | LF-063–065 | WU3+ |
| OCP disconnect full reconnect clear | P08 overlap | WU3/P08 |

## WU2 Gate

- [x] Correlation registry + register path tested
- [x] Inbound queue_info → match → `QueueInfoReceived` integration test
- [x] Substring mismatch logged, no event published
- [x] `incomingCallProjection.queueInfo` wired
- [x] `CampaignEventReceived` skeleton (LF-038 prep)
- [x] Facade/mock wiring; no React UI
- [x] Handoff + registry + legacy evidence
- [x] P06/P07 WU1 regression green

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Baseline 372 → **388** tests (+16) after WU2.

**Stop here. Do not implement campaign modal React UI (WU3).**
