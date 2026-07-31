# DI-07 Operator Logout Workflow

**Дата:** 2026-07-20 16:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/ExternalSdkOperatorHandler.ts` (+ port, mappers, logout helpers)
- `src/application/integration/ExternalSdkProductHandler.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `src/adapters/integration/sdkGatewayRouteInbound.ts` / `LocalWsServerAdapter.operator.test.ts`
- `src/ports/integration/ExternalCommandHandler.ts` / `SdkBrokerContract.ts` (`details`)
- `axatalk-sdk-integration/evidence/DI-07-operator-logout-workflow.md`

## Что
- Публичные команды `operator:get-reasons` / `operator:change-status` / `account:prepare-logout` / `account:confirm-logout`
- Маппинг на Facade с `callType: "sdk"` и unified logout orchestration
- `interaction_required` + safe `details` (logoutToken + reasons); cancel = abandon token
- Ревизия: mutations advance; reads/prepare peek-only (DI-06 invariant)
- Evidence + STATUS/Registry/P12/WORK-UNITS → DI-07 `review`

## Зачем
- Закрыть DI-07 (F-011/P12): operator status + logout для SDK-сессий без OCP wire на границе.

## Результат
- Focused DI-04…DI-07: **104 passed**
- Full `npm test`: **2451 passed / 1 skipped**
- lint / typecheck / registry **74/0** PASS; version **0.11.2**; F-011 остаётся `in progress`
- Следующий шаг: `/sdk-review` DI-07 only
