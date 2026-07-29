# F-031 WU-04 — Execution engine and manual run

**Дата:** 2026-07-29 22:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/integration/external-services/`
- `src/application/use-cases/integration/ExecuteExternalServiceRequestUseCase.ts`
- `src/application/use-cases/integration/RunExternalServiceRequestNowUseCase.ts`
- `src/shared/ipc/ExternalServicesHttpContract.ts`
- `src/adapters/platform/PreloadOutboundHttpAdapter.ts`
- `src/main/integration/registerExternalServicesHttpIpc.ts`
- `src/main/integration/executeExternalServicesHttpRequest.ts`
- `src/infrastructure/bootstrap/createExternalServicesCompositionForBootstrap.ts`
- `docs/softphone/Feature-Registry.md`, `handoffs/P14-External-Services-Master-Handoff.md`, `external-services-plan/PROGRESS.md`

## Что
- Реализованы queue (FIFO, concurrency 3), runtime registry, automation service и execute/manual Use Cases
- Добавлены typed IPC, preload adapter и main HTTP с timeout 10s, redirects ≤5 и strip protected headers
- Composition mock/real wired; синтетический entry `handleExternalServicesCommittedEvent` (без real event binder)
- Покрыты focused unit/integration/IPC/main тесты; обновлены Registry/STATUS/handoff/PROGRESS

## Зачем
- Сделать production-ready изолированный execution path до profile lifecycle и UI

## Результат
- Focused vitest PASS; `tsc` node+web PASS; eslint на touched paths PASS
- Автоматическая подписка на реальные события отложена на WU-11
