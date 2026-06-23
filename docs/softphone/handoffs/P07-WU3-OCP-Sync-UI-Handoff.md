# P07 WU3 OCP Sync UI Handoff

- Scope: queue-info-label, campaign context on incoming, campaign modal accept/reject UI; legacy `LF-037`–`LF-040`.
- Out of scope WU3: real OCP WebSocket, `dlg_stop` (LF-063–065), toast notifications (LF-059), P08 reconnect overlay.

## Delivered (WU3)

| Area | Path |
| --- | --- |
| Domain event | `CampaignEventAnswered` — `campaignEvents.ts` |
| Port | `OcpSyncGateway.respondToCampaign` |
| Use Case | `RespondToCampaignUseCase` |
| Facade | `respondToCampaignById` |
| Mock | `MockOcpSyncGateway.respondToCampaign` |
| Helpers | `mapQueueLabelState.ts`, `mapCampaignModalDisabledReason.ts` |
| Hooks | `useIncomingCallShell.ts`, `useCampaignActions.ts` |
| Components | `QueueInfoLabel.tsx`, `CampaignEventModal.tsx` |
| Integration | `CallerIdentityBlock`, `IncomingCallModal`, `App.tsx` |
| Integration test | `OcpCampaignSync.integration.test.ts` |
| UX notes | `P07-OCP-Sync-UX-Design.md` WU3 section |

## Migration Evidence — LF-037 (Queue Label UI)

| Step | Path |
| --- | --- |
| Projection state | `deriveQueueLabelState` in `queueInfoProjection.ts` |
| Shell hook | `useIncomingCallShell.ts` |
| Component | `QueueInfoLabel.tsx` (`data-testid="queue-info-label"`) |
| SIP-only hide | `isOcpMode` → `hidden`, not rendered |

## Migration Evidence — LF-038 (Campaign Context)

| Step | Path |
| --- | --- |
| Projection | `campaignProjection` + `getCampaignForCall` |
| Hook | `useCampaignActions.campaignContextTitle` |
| UI | `incoming-campaign-context` in `CallerIdentityBlock` |

## Migration Evidence — LF-039 (Campaign Modal)

| Step | Path |
| --- | --- |
| Component | `CampaignEventModal.tsx` |
| Open logic | `useCampaignActions` — non-progressive only |
| Test IDs | `campaign-event-modal`, `campaign-accept`, `campaign-reject` |
| a11y | focus trap, Escape when allowed, labelled buttons |

## Migration Evidence — LF-040 (Accept/Reject)

| Step | Path |
| --- | --- |
| Gateway | `OcpSyncGateway.respondToCampaign` |
| Use Case | `RespondToCampaignUseCase` — event after gateway confirm |
| Event | `CampaignEventAnswered` |
| Facade | `respondToCampaignById` |

## Backlog — WU4+

| Item | Legacy | Work Unit |
| --- | --- | --- |
| `dlg_stop` exactly-once | LF-063–065 | WU4+ |
| OCP toast notifications | LF-059 | WU4+ |
| Queue `na` timeout state | LF-037 | WU4+ |
| Real OCP WebSocket adapter | — | WU4+ |
| E2E campaign + queue UI | F-015 | WU4 |

## WU3 Gate

- [x] `queue-info-label` projection-driven (LF-037)
- [x] Campaign context on incoming (LF-038)
- [x] Campaign modal + accept/reject (LF-039, LF-040)
- [x] a11y + test IDs
- [x] Component + Use Case + integration tests
- [x] Handoff + registry
- [x] Regression green

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Baseline 388 → **403** tests (+15) after WU3.

**Stop here. Do not implement dlg_stop (WU4+).**
