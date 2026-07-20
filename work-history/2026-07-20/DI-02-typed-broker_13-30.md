# DI-02 — Typed Main-to-Renderer Broker

**Дата:** 2026-07-20 13:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/shared/ipc/SdkBrokerContract.ts`, `IpcChannels.ts`, `PreloadApi.ts`
- `src/adapters/integration/MainToRendererBroker.ts`, `RendererSdkBrokerSession.ts`
- `src/application/integration/SdkBrokerProbeHandler.ts`
- `src/main/sdk/registerSdkBrokerIpc.ts`, `src/main/index.ts`, `src/preload/index.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`, `src/renderer/hooks/useAccountBootstrap.ts`
- `axatalk-sdk-integration/evidence/DI-02-typed-main-renderer-broker.md`

## Что
- Реализован typed IPC broker main→renderer с fail-closed парсерами и минимальным preload API
- Lifecycle ADR-0009: readiness, timeout, cancel, reload (без replay), begin/confirm shutdown
- Application probe `sdk:ping` доказывает доставку ровно в одну composition-инстанцию
- Тесты + evidence; F-011 остаётся `in progress`; DI-02 → `review`

## Зачем
- Закрыть DI-02 перед сетевым gateway (DI-03): единственный product path main→renderer Application

## Результат
- Focused vitest PASS (21 новых + mock/boundary); `npm test` 2342/1 skipped; lint/typecheck/registry:check PASS
- Следующий шаг: `/sdk-review` для DI-02 only
