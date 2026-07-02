# T-008 Phase 3 — SIP recovery orchestration

**Дата:** 2026-07-02 14:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/SipRecoveryOrchestrationService.ts`
- `src/application/services/SipConnectionJournal.ts`
- `src/application/use-cases/ManualSipTransportReconnectUseCase.ts`
- `src/application/use-cases/ForceRefreshSipRegistrationUseCase.ts`
- `src/application/services/ConnectionRecoveryOrchestrationService.ts` (OCP-only)
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/integration/SipRecoveryOrchestration.integration.test.ts`
- `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md` §12

## Что
- Добавлен `SipRecoveryOrchestrationService`: transport→registration pipeline, ADR-0004 события, пауза при активном звонке
- Отдельные политики transport/registration; auth 401/403 — немедленный terminal + русское сообщение
- `SipConnectionJournal` — in-memory ring buffer для settings journal
- Use cases: `ManualSipTransportReconnectUseCase`, `ForceRefreshSipRegistrationUseCase`
- `ConnectionRecoveryOrchestrationService` оставлен только для OCP (LF-058)
- Facade: wiring sip recovery, teardown dispose обоих orchestrators
- Bridge в `connectionRecoveryProjection` для `SipTransport*` событий (совместимость overlay до Phase 5)
- `mapSipRegistrationFailureKey`: pass-through для `authentication_error` / `forbidden`

## Зачем
- Phase 3 плана T-008: SIP-only orchestration вместо смешанного connection recovery

## Результат
- `npm run test` — 983 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- Следующий шаг: Phase 4 — `sipSessionHealthProjection`, `deriveSipStatusShell` (`/logic`)
