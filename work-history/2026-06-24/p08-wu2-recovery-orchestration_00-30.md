# P08 WU2 Recovery Orchestration

**Дата:** 2026-06-24 00:30
**Статус:** выполнено
**Коммит:** `2bdd525`

## Где
- `src/application/infrastructure/ReconnectScheduler.ts`
- `src/application/services/ConnectionRecoveryOrchestrationService.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/ports/telephony/TelephonyGateway.ts`, `src/ports/operator/OperatorPlatformGateway.ts`
- `src/adapters/mock/MockTelephonyGateway.ts`, `MockOperatorPlatformGateway.ts`
- `src/application/integration/SipRecoveryOrchestration.integration.test.ts`
- `src/application/integration/OcpRecoveryOrchestration.integration.test.ts`
- `docs/softphone/handoffs/P08-WU2-Recovery-Orchestration-Handoff.md`

## Что
- `ReconnectScheduler` с `dispose()`/`cancelAll()` и unit-тестами
- `ConnectionRecoveryOrchestrationService` — SIP (LF-008) и OCP (LF-058) цепочки retry
- Порты `reconnectTransport`; mock simulate disconnect + reconnect scenarios
- Facade: transport handlers, `simulateSipTransportDisconnected` / `simulateOcpTransportDisconnected`
- Integration-тесты с fake timers и проверкой `connectionRecoveryProjection`
- Handoff WU2, обновления F-014, LF-008/058, fix baseline WU1 → 451

## Зачем
Автоматическое восстановление SIP/OCP соединения по политике retry с observable events и cleanup таймеров (P08 WU2 gate).

## Результат
`npm run test` — 458 passed; `npm run lint` — ok; `npm run typecheck` — ok. Baseline 451 → +7 тестов.
