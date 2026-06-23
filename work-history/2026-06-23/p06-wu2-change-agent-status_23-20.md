# P06 WU2 Change Agent Status

**Дата:** 2026-06-23 23:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/ChangeAgentStatusUseCase.ts`
- `src/application/services/DndAgentStatusOrchestrationService.ts`
- `src/application/services/AgentStatusSyncService.ts`
- `src/application/read-models/InMemoryAgentStatusReadModel.ts`
- `src/ports/operator/AgentStatusReadModel.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `docs/softphone/handoffs/P06-WU2-Change-Agent-Status-Handoff.md`

## Что
- `ChangeAgentStatusUseCase`: validate → requested → gateway → changed/rejected
- DND orchestration LF-018 через facade `setPhoneStatus`
- Mock gateway scenarios + `getAgentStatus` initial sync
- Projection fix: `currentBreakReason` clear при leave break
- Gateway rejection reasons в domain + projection
- `deriveOperatorStatusDisabledReason` helper

## Зачем
Закрыть WU2 F-010: end-to-end agent status change через mock OCP gateway без UI.

## Результат
- `npm run test`: 305 passed (71 files)
- `npm run lint`: green
- `npm run typecheck`: green
- Stop gate WU2; reviewer → WU3
