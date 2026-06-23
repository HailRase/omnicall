# P06 WU2 Change Agent Status Handoff

- Scope: WU2 `ChangeAgentStatusUseCase`, DND orchestration, mock gateway scenarios, initial status sync; legacy `LF-018`, `LF-019`, `LF-045`.
- Out of scope WU2: Status Selector UI (WU4), post-call workflows (WU3), logout cascade (P08), real OCP WebSocket.

## Delivered (WU2)

- Use Case: `ChangeAgentStatusUseCase` — validate → requested → gateway → changed/rejected
- Read model: `InMemoryAgentStatusReadModel` (port `AgentStatusReadModel`)
- Orchestration: `DndAgentStatusOrchestrationService` + facade `setPhoneStatus` hook (LF-018)
- Sync: `AgentStatusSyncService` on `OcpAuthenticationSucceeded` (initial `AgentStatusChanged`, `previousStatus: null`)
- Mock gateway: `statusChangeScenario` (`success` | `rejected` | `network_error`), `getAgentStatus()`, `initialAgentStatus`
- Projection fixes: `currentBreakReason` cleared on non-break; `parseOptionalStatusReason`; gateway rejection reasons
- Helper: `deriveOperatorStatusDisabledReason`
- Facade: `changeAgentStatus` exposed; DND hook wired

## Migration Evidence — LF-018 (DND → Break Orchestration)

| Area | Path |
| --- | --- |
| Domain contract | `DndAgentStatusPolicy.mapDndToAgentBreakRequest` |
| Orchestration | `DndAgentStatusOrchestrationService.ts` |
| Facade hook | `AccountBootstrapFacade.setPhoneStatus` |
| Integration test | `DndAgentStatusOrchestration.integration.test.ts` |

## Migration Evidence — LF-019 / LF-045 (Use Case Path)

| Area | Path |
| --- | --- |
| Validation | `ChangeAgentStatusUseCase` + `AgentStatusValidationService` |
| Rejection event | `AgentStatusChangeRejected` with `dnd_blocks_ready` / `invalid_transition` |
| Tests | `ChangeAgentStatusUseCase.test.ts` |

## Initial Status Sync (WU2)

- On `OcpAuthenticationSucceeded`, `AgentStatusSyncService` calls `OperatorPlatformGateway.getAgentStatus`
- Mock default: `initialAgentStatus: "ready"`
- Publishes `AgentStatusChanged` with `previousStatus: null` (no separate `AgentStatusSynced` event in WU2)

## Gateway Rejection Reasons (domain)

- `gateway_failed`, `ocp_not_connected`, `network_error` added to `AgentStatusRejectionReason`
- Projection accepts all via `isAgentStatusRejectionReason`

## WU3 Backlog

- `UpdatePostCallStatusUseCase`, `PostCallStatusUpdated`
- `BreakReasonsReceived` + settings projection (LF-078)
- Status duration timer projection/UI prep

## WU4 Backlog

- Status Selector React UI (`LF-041`, `LF-042`, `LF-043`)
- Logout reason modal (`LF-047`)
- Wire `deriveOperatorStatusDisabledReason` to UI controls

## Verification

```bash
npm run test
npm run lint
npm run typecheck
```

All green after WU2: **305 tests** (71 files). Baseline WU1: 287 (+18).

## Phase P06 WU2 Gate

- [x] `ChangeAgentStatusUseCase`: validate → requested → gateway → changed/rejected
- [x] DND→break orchestration LF-018 integration test
- [x] Mock gateway failure paths
- [x] Projection fix `currentBreakReason` clear
- [x] Facade wired, store events flow
- [x] Handoff + registry + legacy evidence
- [x] P05/P06 WU1 regression green

**Stop gate:** reviewer-agent pass → WU3 only.
