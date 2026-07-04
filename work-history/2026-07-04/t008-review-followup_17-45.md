# T-008 review follow-up (High/Low)

**Дата:** 2026-07-04 17:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/SipRecoveryOrchestrationService.test.ts`
- `docs/softphone/adr/ADR-0004-sip-session-health.md`
- `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- Unit-тесты Q6: pause transport reconnect при активном звонке + resume после `CallEnded`
- ADR/plan: два manual actions; `ReregisterSipUseCase` = `gateway.reregister()`; убран `ForceRefreshSipRegistrationUseCase`
- Feature Registry WU2 evidence без runtime `ConnectionOverlay`; F-014 test coverage + pause/resume
- `TASK-QUEUE.md` Updated 2026-07-04; STATUS test count 1026

## Зачем
Закрыть High/Low findings gate-review T-008.

## Результат
- `npm run test`: 1026 passed, 1 skipped (+2)
- lint/typecheck: green
