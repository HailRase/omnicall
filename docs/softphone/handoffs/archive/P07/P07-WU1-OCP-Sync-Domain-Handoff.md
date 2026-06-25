# P07 WU1 OCP Sync Domain Handoff

- Scope: WU1 domain foundation for OCP queue sync; legacy `LF-037`; design for `LF-038`, `LF-039`.
- Out of scope WU1: React campaign modal, real OCP WebSocket, `SyncMainAcallIdUseCase` E2E, `dlg_stop`, campaign Use Cases.

## Architecture Decision

- **Port:** separate `OcpSyncGateway` (not `OperatorPlatformGateway`) — inbound message parsing vs outbound operator commands.
- **Domain location:** `src/domain/operator/ocp/` for value objects and message schemas; `Operator` bounded context.
- **Core telephony:** `CallEngine` does not depend on OCP queue/campaign types.

## Delivered (WU1)

- UX: `docs/softphone/P07-OCP-Sync-UX-Design.md`
- Domain: `MainAcallId`, `OcpCallCorrelation`, `parseOcpInboundMessage`, `matchQueueInfoToCall`
- Events: `QueueInfoReceived` + tests
- Application: `queueInfoProjection` + store wire in `useAccountBootstrapStore`
- Port: `OcpSyncGateway.parseInboundMessage` stub
- Mock: `MockOcpSyncGateway` + sample queue fixture
- Pre-step: logout modal closes only on `result.ok` in `useOperatorStatusActions`
- Feature Registry: F-015 → `in_progress`

## Migration Evidence — LF-037 (Queue Name Display)

| Area | Path |
| --- | --- |
| Value object | `src/domain/operator/ocp/MainAcallId.ts` |
| Exact match rule | `src/domain/operator/rules/matchQueueInfoToCall.ts` |
| Event | `src/domain/operator/events/queueInfoEvents.ts` |
| Projection | `src/application/projections/queueInfoProjection.ts` |
| Tests | `MainAcallId.test.ts`, `matchQueueInfoToCall.test.ts`, `queueInfoEvents.test.ts`, `queueInfoProjection.test.ts` |

## Migration Evidence — LF-038 / LF-039 (design only WU1)

| Area | Path |
| --- | --- |
| UX states | `P07-OCP-Sync-UX-Design.md` |
| Campaign payload skeleton | `OcpInboundMessages.ts` (`campaign_event`) |
| Test IDs reserved | `queue-info-label`, `campaign-event-modal`, `campaign-accept`, `campaign-reject` |
| UI | WU3–WU4 |

## Domain Events Backlog (WU2+)

| Event | Work Unit | Legacy |
| --- | --- | --- |
| `CampaignEventReceived` | WU2–WU3 | LF-038 |
| `CampaignEventAnswered` | WU2 | LF-040 |
| `CallButtonBlocked` | WU2+ | LF-050 |
| `OcpNotificationReceived` | WU3+ | LF-059 |
| `DlgStopRequested` / `DlgStopSent` | WU3+ | LF-063–065 |

## WU2 Backlog

1. `SyncMainAcallIdUseCase` — correlation registry, gateway confirm before events
2. Wire `queueInfoProjection` → `incomingCallProjection.queueInfo`
3. OCP disconnect clear hook (`OcpDisconnected` — P08 overlap)
4. Integration tests: mock gateway queue message → `QueueInfoReceived` chain
5. Campaign accept/reject Use Cases (`LF-040`)

## WU3–WU4 Backlog

- Campaign modal React UI (`LF-039`)
- Campaign context on incoming modal (`LF-038`)
- `dlg_stop` exactly-once policy

## Verification

```bash
npm run test
npm run lint
npm run typecheck
```

Baseline 351 → +21 new tests (372 total) after WU1.
