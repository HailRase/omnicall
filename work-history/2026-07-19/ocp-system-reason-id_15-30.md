# OCP system status: reason_id null → status.value

**Дата:** 2026-07-19 15:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/ocp/OperatorStatus.ts`
- `src/adapters/integration/ocp/parseOcpMessage.ts`
- `src/application/projections/integration/operatorStatusProjection.ts`
- тесты рядом; `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- Domain: `resolveOperatorReasonId(status, wireReasonId)` — null/undefined/NaN → `status`
- Adapter: при парсе `entity:users` вызывает domain-правило вместо sentinel `0`
- Projection: повторно применяет то же правило при reduce (защита от NaN)
- Явный `reason_id` (перерывы) не трогается

## Зачем
Сервер для системных статусов шлёт `reason_id: null`; без нормализации chip/dropdown не матчили reason catalog (`Доступен` = id 1).

## Результат
- `npm run test && npm run lint && npm run typecheck` — green
- TASK-QUEUE T-047 done; F-028 evidence обновлён
