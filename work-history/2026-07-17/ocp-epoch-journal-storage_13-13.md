# OCP epoch and journal storage

**Дата:** 2026-07-17 13:13
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/integration/OcpGateway.ts`
- `src/adapters/integration/ocp/`
- `src/application/read-models/OcpProjectionHub.ts`
- `src/ports/settings/UserNotificationJournalRepository.ts`
- `src/adapters/settings/*UserNotificationJournalRepository*`

## Что
- Gateway envelope получил monotonic socket epoch.
- Projection hub отбрасывает сообщения superseded socket.
- Добавлен app-scoped repository журнала уведомлений.
- Реализованы in-memory и atomic file adapters.
- File adapter применяет rolling 24h prune и fail-closed corrupt policy.

## Зачем
Не допускать изменения OCP projection устаревшими событиями и создать безопасную persistence-границу журнала.

## Результат
Focused tests: 24 passed. `npm run typecheck`: passed.
