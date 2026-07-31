# DI-01 Protocol Ports and Mocks

**Дата:** 2026-07-20 13:06
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/integration/ExternalClientGateway.ts`
- `src/ports/integration/MainToRendererBrokerPort.ts`
- `src/ports/integration/ExternalCommandHandler.ts`
- `src/adapters/mock/MockExternalClientGateway.ts`
- `src/adapters/mock/MockMainToRendererBroker.ts`
- `src/adapters/mock/MockExternalCommandHandler.ts`
- `axatalk-sdk-integration/evidence/DI-01-protocol-ports-mocks.md`
- `package.json` (`@axata/axatalk-protocol` file dep)

## Что
- Desktop depends on `@axata/axatalk-protocol` вне Domain; fixtures SDK-02 consume byte-identical
- Порты gateway/broker + command/query handler interfaces (без IPC/WS)
- Детерминированные моки с fail-closed validation
- Тесты: fixtures, dependency-boundary, mocks; F-011 → `in progress` (не `implemented`)
- Root eslint ignore для `axatalk-sdk/**` (отдельный workspace)

## Зачем
- Закрыть DI-01 (F-011/P12): контракты и моки до реального broker/transport, без регрессии SIP-only/OCP/call

## Результат
- Focused DI-01: 24 PASS; `npm test` 2321 passed / 1 skipped; lint + typecheck + registry:check PASS
- DI-01 status `review`; следующий шаг — `/sdk-review` (не DI-02)
