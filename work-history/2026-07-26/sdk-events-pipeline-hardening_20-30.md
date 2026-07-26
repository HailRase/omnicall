# SDK events pipeline hardening

**Дата:** 2026-07-26 20:30
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/sdk/src/internal/product-orchestrator.ts`
- `src/adapters/integration/sdkGatewayEventFanout.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts`
- `src/adapters/integration/LocalWsServerAdapter.ts`
- `src/adapters/integration/sdkGatewayMessages.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `src/main/sdk/sdkGatewayRegistrationHelpers.ts`, `registerSdkGateway.ts`
- Docs: `axatalk-sdk/docs/guide/events.md`, `PROTOCOL.md`, `SECURITY.md`, `OCP-Call-Context.md`, ADR-0009/0016, Feature-Registry, STATUS

## Что
- Auth lifecycle (`sdk:permission-changed` / `sdk:revoked`) advances client wire sequence without public listeners — нет ложного `event.sequence_gap`
- Fan-out: validateWire до increment `eventSequence`
- `sdk:server-shutdown` на controlled quit/stop (`app_quit` / `gateway_stop`), idempotent
- Observability: drop publish в main IPC + renderer warn (allowlisted fields)
- Документация: sequence invariant, enrichment idempotency, dual ownership, ADR-0016 profiles sync

## Зачем
- Устранить риски из экспертного аудита SDK events без breaking-изменений публичного контракта

## Результат
- `vitest` PASS: `sdkGatewayEventFanout.test.ts`, `LocalWsServerAdapter.product.test.ts`, `LocalWsServerAdapter.test.ts`, `axatalk-client.test.ts` (в т.ч. новый no-false-gap + shutdown)
- Downgrade публичного API не вводился; version bump не требовался (hardening)
