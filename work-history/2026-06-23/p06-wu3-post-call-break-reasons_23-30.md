# P06 WU3 Post-Call Break Reasons

**Дата:** 2026-06-23 23:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/operator/events/breakReasonsEvents.ts`, `postCallStatusEvents.ts`
- `src/application/use-cases/UpdatePostCallStatusUseCase.ts`
- `src/application/services/BreakReasonsSyncService.ts`, `OcpAuthBootstrapService.ts`, `PostCallRejectOrchestrationService.ts`
- `src/application/projections/operatorStatusTimerProjection.ts`
- `docs/softphone/handoffs/P06-WU3-Post-Call-Break-Reasons-Handoff.md`

## Что
- `BreakReasonsReceived` + sync в settings (LF-078)
- `UpdatePostCallStatusUseCase` + `PostCallStatusUpdated` (LF-044)
- Reject → post-call orchestration (LF-062)
- Timer projection prep (LF-046)
- DND-at-auth fix через `OcpAuthBootstrapService`
- Break validation через `allowedBreakReasons` в `ChangeAgentStatusUseCase`

## Зачем
Закрыть WU3 F-010: post-call workflows и break reasons без UI и real OCP.

## Результат
- `npm run test`: 327 passed (78 files)
- `npm run lint`: green
- `npm run typecheck`: green
- Stop gate WU3; reviewer → WU4
