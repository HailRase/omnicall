# P07 WU2 OCP Sync Use Cases

**Дата:** 2026-06-23 23:58
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/ProcessOcpInboundMessageUseCase.ts`
- `src/application/use-cases/RegisterOcpCallCorrelationUseCase.ts`
- `src/application/read-models/InMemoryOcpCallCorrelationRegistry.ts`
- `src/application/projections/incomingCallProjection.ts`
- `src/application/projections/campaignProjection.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/integration/OcpQueueInfoSync.integration.test.ts`
- `docs/softphone/handoffs/P07-WU2-OCP-Sync-Use-Cases-Handoff.md`

## Что
- Порт и in-memory реестр корреляции CallId ↔ main_acallid с lifecycle cleanup
- Use Cases: регистрация корреляции и обработка inbound OCP (queue_info / campaign_event)
- События `OcpCallCorrelationRegistered`, `CampaignEventReceived`
- Проводка `QueueInfoReceived` → `incomingCallProjection.queueInfo` и `queueInfoPending`
- Skeleton `campaignProjection` + store wire
- Facade: `processOcpInboundMessageRaw`, auto-register на incoming с `mainAcallId`
- Расширен `MockOcpSyncGateway` (scenarios/fixtures)
- Интеграционный тест полной цепочки LF-037

## Зачем
Закрыть WU2 gate F-015: end-to-end queue name sync от mock OCP message до incoming call read model без React UI.

## Результат
- `npm run test` — 388 passed (+16 от baseline 372)
- `npm run lint` — ok
- `npm run typecheck` — ok
- WU2 gate закрыт; WU3 (React UI) не начинался
