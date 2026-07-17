# WU-02 OCP dual FSM + safe recovery

**Дата:** 2026-07-16 15:48
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/ocp/OcpServerState.ts`, `OcpAuthorizationState.ts`, `ocpDualFsm.ts`
- `src/ports/integration/OcpGateway.ts`
- `src/adapters/integration/ocp/OcpWebSocketAdapter.ts`, `src/adapters/mock/MockOcpGateway.ts`
- `src/application/projections/integration/ocpSessionProjection.ts`, `read-models/OcpProjectionHub.ts`
- `src/application/services/integration/OcpAuthenticateAndConnectService.ts`, `OcpAttemptTokenScope.ts`, `OcpTransportRecoveryService.ts`, `OcpBackedSignInOrchestrationService.ts`, `OcpIntegrationComposition.ts`
- `src/application/projections/settings/authorizationRetryContext.ts`, `facades/AccountBootstrapFacade.ts`
- `auth-flow/auth-flow-refactoring.md`, `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## Что
- Разделены Server/Authorization FSM (ADR-AF-002) с pure reducers и legacy `connectionState` bridge
- Адаптер стал transport-only: без auto-auth и без reconnect со stale token
- Application шлёт auth после `connected`; auth-only retry на том же сокете; новый socket только с fresh HTTP token
- `OcpTransportRecoveryService` владеет capped recovery после drop
- Обновлены тесты, Feature Registry / Legacy / STATUS / TASK-QUEUE / handoff

## Зачем
- Убрать dual-socket и stale-token reconnect; подготовить Account recovery UI (WU-03/WU-04)

## Результат
- `npm run test` — 2150 passed / 1 skipped
- `npm run typecheck` — green
- `npm run lint` — green
- Следующий шаг: `/logic` WU-03 или `/preflight` → `/review` для закрытия WU-02 gate
