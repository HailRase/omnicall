# P07 WU1 OCP Sync Domain Foundation

**Дата:** 2026-06-23 23:48
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P07-OCP-Sync-UX-Design.md`
- `src/domain/operator/ocp/`, `src/domain/operator/rules/`, `src/domain/operator/events/queueInfoEvents.ts`
- `src/application/projections/queueInfoProjection.ts`
- `src/ports/operator/OcpSyncGateway.ts`, `src/adapters/mock/MockOcpSyncGateway.ts`
- `docs/softphone/handoffs/P07-WU1-OCP-Sync-Domain-Handoff.md`

## Что
- UX-документ P07 до domain-кода: состояния queue/campaign, test IDs
- `MainAcallId`, `OcpCallCorrelation`, `parseOcpInboundMessage`, `matchQueueInfoToCall` с unit-тестами
- Событие `QueueInfoReceived` + фабрика и тесты
- `queueInfoProjection` + подписка в `useAccountBootstrapStore`
- Порт `OcpSyncGateway` и `MockOcpSyncGateway`
- F-015 → `in_progress`; LF-037 evidence; LF-038/039 design refs
- Pre-step: logout modal закрывается только при `result.ok`
- `P06-Agent-Continuation-Handoff.md`

## Зачем
Фундамент Phase 07 для точного маппинга `main_acallid` → `CallId` и проекции имени очереди без зависимости core telephony от OCP.

## Результат
`npm run test` — 372 passed (+21); `npm run lint` — green; `npm run typecheck` — green. WU1 gate выполнен; campaign React UI не реализован.
