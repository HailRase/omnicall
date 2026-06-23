# P06 WU1 Operator Status Domain

**Дата:** 2026-06-23 23:10
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P06-Operator-Status-UX-Design.md`
- `docs/softphone/handoffs/P06-WU1-Operator-Status-Domain-Handoff.md`
- `src/domain/operator/AgentStatus*.ts`, `DndAgentStatusPolicy.ts`, `events/agentStatusEvents.ts`
- `src/application/projections/operatorStatusProjection.ts`
- `src/ports/operator/OperatorPlatformGateway.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`

## Что
- UX design artifact для P06 WU1 (без React)
- Domain: `AgentStatus`, `StatusReason`, FSM переходов, DND policy (LF-018/019/045)
- События: `AgentStatusChangeRequested`, `AgentStatusChanged`, `AgentStatusChangeRejected`
- Projection skeleton + подписка store
- Port stub `changeAgentStatus` + mock adapter test
- F-010 → `in_progress` в Feature Registry

## Зачем
Заложить operator agent status domain foundation для Phase P06 без UI и real OCP, сохранив разделение `PhoneStatus` и `AgentStatus`.

## Результат
- `npm run test`: 287 passed (67 files)
- `npm run lint`: green
- `npm run typecheck`: green
- WU2 backlog в handoff; reviewer → WU2
