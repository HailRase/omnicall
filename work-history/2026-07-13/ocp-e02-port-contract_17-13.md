# OCP E-02 — Port Contract + Protocol Types

**Дата:** 2026-07-13 17:13
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/integration/OcpGateway.ts`
- `src/domain/integration/ocp/OcpConnectionConfig.ts`
- `src/domain/integration/ocp/OcpConnectionState.ts`
- `src/domain/integration/ocp/protocol/OcpCommand.ts`
- `src/domain/integration/ocp/protocol/OcpIncomingMessage.ts`
- `src/domain/integration/ocp/protocol/OcpMessageEnvelope.ts`
- `docs/softphone/Feature-Registry.md` (F-028)
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`

## Что
- Определён порт `OcpGateway` с callback-подписками `onMessage` / `onConnectionStateChange` и `Unsubscribe`
- Добавлены union-типы `OcpConnectionState`, `OcpCommand` (kind), `OcpIncomingMessage` (entity)
- Реализован value object `OcpConnectionConfig` с валидацией domain/token
- Добавлен wire-envelope `OcpMessageEnvelope` для границы адаптера E-03
- Payload-типы нормализованы в camelCase (creds, users, reasons, notification, campaign, calls)
- Экспорт `OcpGateway` через `src/ports/index.ts`
- Тесты: валидация config + exhaustive switch по command/entity unions

## Зачем
Зафиксировать контракт между Application/Domain и будущим WebSocket-адаптером OCP (F-028, этап E-02), чтобы Use Cases и проекции компилировались без реального транспорта.

## Результат
- `npm run test`: 1872 passed, 1 skipped
- `npm run lint`: ok
- `npm run typecheck`: ok
- Следующий этап: E-03 (`/adapter`) — `OcpWebSocketAdapter` + `MockOcpGateway`
