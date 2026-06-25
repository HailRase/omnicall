# Constitution logout refinement

**Дата:** 2026-06-25 10:20
**Статус:** выполнено
**Коммит:** —

## Где
- `UnregisterAccountUseCase.ts`, `registrationEvents.ts` (Unregistration*)
- `SessionTeardownOrchestrationService.ts`, `EndUserSessionUseCase.ts`
- `AccountBootstrapFacade.ts`, `accountBootstrapProjection.ts`

## Что
- `UnregisterAccountUseCase` — единая точка SIP unregister (симметрия с RegisterAccountUseCase)
- `UserSessionEnded` публикует только `EndUserSessionUseCase`, не orchestrator
- Сброс logout idempotency по `RegistrationSucceeded` (удалён `notifySessionActive`)
- Projection: `UnregistrationSucceeded` / `UnregistrationFailed`

## Зачем
Выровнять logout/teardown с Architecture Constitution: Use Case entry, event-driven lifecycle, unregister через Use Case.

## Результат
617 passed, 1 skipped; lint/typecheck green.
