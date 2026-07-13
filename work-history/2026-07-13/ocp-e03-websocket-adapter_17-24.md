# OCP E-03 — WebSocket Adapter

**Дата:** 2026-07-13 17:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/ocp/OcpWebSocketAdapter.ts`
- `src/adapters/integration/ocp/parseOcpMessage.ts`
- `src/adapters/integration/ocp/buildOcpCommandPayload.ts`
- `src/adapters/mock/MockOcpGateway.ts`
- `src/shared/scheduling/ReconnectScheduler.ts`
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`

## Что
- Реализован `OcpWebSocketAdapter` (connect/auth/reconnect/dispose, SESSION_EXIST guard)
- Добавлен парсер `parseOcpMessage` с нормализацией snake_case → camelCase
- Добавлен `buildOcpCommandPayload` для маппинга `OcpCommand.kind` → wire JSON
- Добавлен `MockOcpGateway` для тестов Use Cases без реального WS
- `ReconnectScheduler` перенесён в `shared/scheduling` (re-export из application)
- Тесты адаптера, парсера, mock gateway

## Зачем
Закрыть этап E-03 F-028: реальный WebSocket-транспорт OCP за портом `OcpGateway`, без бизнес-логики в адаптере.

## Результат
- `npm run test`: 1889 passed, 1 skipped
- `npm run lint`: ok
- `npm run typecheck`: ok
- Следующий этап: E-04 (`/logic`) — Use Cases OCP
