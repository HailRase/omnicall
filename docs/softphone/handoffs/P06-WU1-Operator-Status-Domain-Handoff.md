# P06 WU1 Operator Status Domain Handoff

- Scope: WU1 domain foundation for OCP agent status; legacy `LF-018`, `LF-019`, `LF-045`; design for `LF-041`.
- Out of scope WU1: React UI, `ChangeAgentStatusUseCase` E2E, real OCP WebSocket, logout cascade (`LF-048` → P08).

## Delivered (WU1)

- UX: `docs/softphone/P06-Operator-Status-UX-Design.md`
- Domain: `AgentStatus`, `StatusReason`, `AgentStatusTransition`, `DndAgentStatusPolicy`
- Events: `AgentStatusChangeRequested`, `AgentStatusChanged`, `AgentStatusChangeRejected`
- Application: `AgentStatusValidationService`, `operatorStatusProjection`
- Port: `OperatorPlatformGateway.changeAgentStatus` signature + `MockOperatorPlatformGateway` stub
- Store: `useAccountBootstrapStore` subscribes `operatorStatusProjection`
- Feature Registry: F-010 → `in_progress`

## Migration Evidence — LF-045 (Status Transition Validation)

| Area | Path |
| --- | --- |
| FSM | `src/domain/operator/AgentStatusTransition.ts` |
| Tests | `src/domain/operator/AgentStatusTransition.test.ts` (14 cases) |
| Service | `src/application/services/AgentStatusValidationService.ts` |

## Migration Evidence — LF-019 (DND Blocks Ready)

| Area | Path |
| --- | --- |
| Rule | `validateAgentStatusTransition` → `dnd_blocks_ready` |
| Policy | `src/domain/operator/DndAgentStatusPolicy.ts` → `isReadyBlockedByDnd` |
| Tests | `AgentStatusTransition.test.ts`, `DndAgentStatusPolicy.test.ts` |

## Migration Evidence — LF-018 (DND → Break Mapping)

| Area | Path |
| --- | --- |
| Contract | `mapDndToAgentBreakRequest` in `DndAgentStatusPolicy.ts` |
| Tests | `DndAgentStatusPolicy.test.ts` |
| OCP command | deferred WU2 (`ChangeAgentStatusUseCase` + gateway) |

## Migration Evidence — LF-041 (Status Selector — design only WU1)

| Area | Path |
| --- | --- |
| UX states | `P06-Operator-Status-UX-Design.md` |
| Test IDs reserved | `status-selector`, `status-timer`, `control-change-ready`, `control-change-break`, `logout-reason-modal` |
| UI | WU4 |

## Domain Events Backlog (WU2–WU4)

| Event | Work Unit | Legacy |
| --- | --- | --- |
| `BreakReasonsReceived` | WU2/WU3 | LF-078 |
| `PostCallStatusUpdated` | WU3 | LF-044, LF-062 |
| `AgentLogoutRequested` | WU4 | LF-047 |
| `AgentLoggedOut` | P08 | LF-048 |
| `AgentStatusSynced` | WU2 | initial OCP sync |

## WU2 Backlog

1. `ChangeAgentStatusUseCase` — validate → `AgentStatusChangeRequested` → gateway → `AgentStatusChanged` / `AgentStatusChangeRejected`
2. Wire DND phone change → `mapDndToAgentBreakRequest` orchestration (LF-018)
3. Mock gateway scenarios: success, rejection, network error
4. Integration tests: mock gateway status change chain
5. Do **not** publish `AgentStatusChanged` before gateway confirmation

## WU3 Backlog

- `UpdatePostCallStatusUseCase`, `PostCallStatusUpdated`
- `BreakReasonsReceived` + settings projection
- Status duration timer projection (`statusChangedAt` already in skeleton)

## WU4 Backlog

- Status Selector React UI (`LF-041`, `LF-042`, `LF-043`)
- Logout reason modal (`LF-047`)
- Status timer UI (`LF-046`)

## Test IDs (WU4 — reserved)

- `status-selector`, `status-timer`
- `control-change-ready`, `control-change-break`
- `logout-reason-modal`

## Verification

```bash
npm run test
npm run lint
npm run typecheck
```

All green after WU1: **287 tests** (67 files).

## Phase P06 WU1 Gate

- [x] UX doc before domain code
- [x] Agent status FSM + DND rules unit-tested
- [x] WU1 domain events typed + tested
- [x] Operator status projection skeleton + store wire
- [x] F-010 registry `in_progress`
- [x] LF-018/019/045 evidence
- [x] P05 regression green (258 baseline + 29 new)
- [x] lint + typecheck green

**Next:** reviewer-agent pass → WU2 only.
