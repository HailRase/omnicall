# Logout OCP idle reset (no reconnect banner)

**Дата:** 2026-07-17 15:29
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/platform/AccountLogoutOrchestrationService.ts`
- `src/application/services/integration/OcpTransportRecoveryService.ts`
- `src/application/services/integration/OcpIntegrationComposition.ts`
- `src/application/read-models/OcpProjectionHub.ts`
- `src/application/facades/AccountBootstrapFacade.ts`

## Что
- Перед intentional logout disarm `OcpTransportRecoveryService` (`wasLive=false`), чтобы disconnect не запускал reconnect
- После успешного OCP end — `OcpProjectionHub.resetToIdle()` (session/operator/campaign → cold start)
- При ошибке logout до disconnect — restore tracking, если сессия ещё authorized
- Тесты + Feature Registry / LF-048 / TASK-QUEUE T-040

## Зачем
- После «Выйти» + причина не должен появляться баннер переподключения OCP; статусы как при свежем запуске

## Результат
- `npm run test && npm run lint && npm run typecheck` — green (2228 passed / 1 skipped)
