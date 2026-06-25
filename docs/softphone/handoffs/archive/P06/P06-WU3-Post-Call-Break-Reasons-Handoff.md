# P06 WU3 Post-Call Break Reasons Handoff

- Scope: WU3 post-call workflows, break reasons sync, timer projection prep; legacy `LF-044`, `LF-062`, `LF-078`, `LF-046` (projection).
- Out of scope WU3: Status Selector / timer React UI (WU4), real OCP WebSocket, logout cascade (P08).

## Delivered (WU3)

- Events: `BreakReasonsReceived`, `PostCallStatusUpdated`
- Settings: `SettingsRepository.setAllowedBreakReasons` + `InMemorySettingsRepository` wire
- Services: `BreakReasonsSyncService`, `OcpAuthBootstrapService` (DND-at-auth fix), `PostCallRejectOrchestrationService`
- Use Cases: `UpdatePostCallStatusUseCase`; `ChangeAgentStatusUseCase` break validation via `allowedBreakReasons`
- Domain: `AgentBreakReasonPolicy.isAgentBreakReasonRequired`
- Port: `OperatorPlatformGateway.getBreakReasons`, `updatePostCallStatus`
- Mock gateway: `getBreakReasons()`, `updatePostCallStatus()`, `postCallStatusScenario`
- Projections: `operatorStatusTimerProjection`, extended `operatorStatusProjection` (`timerRunning`, `allowedBreakReasonsCount`, post-call fields)
- Facade: `updatePostCallStatus`, reject → post-call chain (LF-062)

## BreakReason vs StatusReason (handoff note)

| Concept | Type | Use |
| --- | --- | --- |
| `BreakReason` | OCP/incoming reject list item | `allowedBreakReasons`, reject validation, post-call gateway reason |
| `StatusReason` | Agent status change metadata | `AgentStatusChanged` / gateway `changeAgentStatus` payload |

Break transitions validate with `BreakReason` list; published agent events carry `StatusReason` (string brand).

## breakReasonRequired policy (WU3 decision)

- `true` when `targetStatus === "break"` AND `allowedBreakReasons.length > 0` AND `trigger !== "phone_dnd"`
- Replaces WU2 use of `incomingCallSettings.rejectReasonRequired` for agent status break

## Migration Evidence — LF-078

| Area | Path |
| --- | --- |
| Event | `breakReasonsEvents.ts` |
| Sync | `BreakReasonsSyncService.ts` |
| Settings | `SettingsRepository.setAllowedBreakReasons` |
| Gateway | `MockOperatorPlatformGateway.getBreakReasons` |
| Test | `BreakReasonsSyncService.test.ts`, `BreakReasonsAndPostCall.integration.test.ts` |

## Migration Evidence — LF-044 / LF-062

| Area | Path |
| --- | --- |
| Event | `postCallStatusEvents.ts` |
| Use Case | `UpdatePostCallStatusUseCase.ts` |
| Orchestration | `PostCallRejectOrchestrationService.ts` → `AccountBootstrapFacade.rejectCall` |
| Gateway | `updatePostCallStatus` mock |
| Test | `UpdatePostCallStatusUseCase.test.ts`, integration LF-062 |

## Migration Evidence — LF-046 (projection prep)

| Area | Path |
| --- | --- |
| Timer derive | `operatorStatusTimerProjection.ts` |
| Projection flag | `operatorStatusProjection.timerRunning` |
| Test | `operatorStatusTimerProjection.test.ts` |

## WU2 review fixes included

- `OcpAuthBootstrapService`: DND-at-auth → `DndAgentStatusOrchestrationService` after sync
- Gateway `rejected` → `Requested` + `Rejected` with `gateway_failed` (test in `ChangeAgentStatusUseCase.test.ts`)

## WU4 Backlog

- Status Selector React UI (`LF-041`, `LF-042`, `LF-043`)
- Status timer component using `deriveStatusDurationSeconds` (`LF-046` UI)
- Logout reason modal (`LF-047`)
- Wire `deriveOperatorStatusDisabledReason` to controls

## Verification

```bash
npm run test
npm run lint
npm run typecheck
```

All green after WU3: **327 tests** (78 files). Baseline WU2: 305 (+22).

## Phase P06 WU3 Gate

- [x] `BreakReasonsReceived` + settings sync from mock gateway
- [x] Break reason validation in `ChangeAgentStatusUseCase` via `allowedBreakReasons`
- [x] `UpdatePostCallStatusUseCase` + `PostCallStatusUpdated`
- [x] LF-062 reject → post-call integration test
- [x] Timer projection derived from `statusChangedAt`
- [x] DND-at-auth orchestration fix
- [x] Handoff + registry + legacy evidence
- [x] Regression green

**Stop gate:** reviewer-agent pass → WU4 only.
