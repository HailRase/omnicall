# Fix SDK OCP function_call_type wire map

**Дата:** 2026-07-23 15:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/ocp/mapOcpCallTypeToWire.ts` (+ test)
- `src/adapters/integration/ocp/buildOcpCommandPayload.ts` (+ test)
- `src/domain/integration/ocp/protocol/OcpCommand.ts`
- `src/application/integration/createSdkOperatorPortFromFacade.ts` (+ test comment)
- Docs: ADR-0017, Feature-Registry, Legacy-Feature-Coverage, ocp-integration.md, OCP-IMPLEMENTATION-PLAN, DI-07 evidence, TEST-MATRIX, IMPLEMENTATION-PLAN

## Что
- Добавлен adapter-only маппинг Application `callType: "sdk"` → OCP wire `function_call_type: "external"`
- Facade/DI-07 binding остаётся `callType: "sdk"` (без silent downgrade Application audit)
- UI `internal` и host `external` на wire без изменений
- Документация синхронизирована, чтобы не слать `"sdk"` на OCP socket

## Зачем
- SDK `operator:change-status` отвечал `applied`, но OCP игнорировал неизвестный `function_call_type: "sdk"`, статус softphone не менялся

## Результат
- Focused tests: 42 passed (`mapOcpCallTypeToWire`, `buildOcpCommandPayload`, Facade binding, Use Case, OperatorHandler, OcpWebSocketAdapter, exhaustive protocol)
- Ручная проверка: перезапустить Axatalk → CRM demo break → chip/status softphone должен смениться после OCP `users`
