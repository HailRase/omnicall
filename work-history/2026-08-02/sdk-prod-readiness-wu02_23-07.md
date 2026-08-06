# OmniCall SDK Production-Readiness — WU-02 (Window correction)

**Дата:** 2026-08-02 23:07
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/ExternalSdkWindowHandler.ts` (+ test)
- `src/application/integration/SdkSessionRevisionCoordinator.ts` (`runSerializedMutation`)
- `src/ports/integration/SdkNativeWindowPort.ts`
- `src/shared/ipc/SdkNativeWindowContract.ts`
- `src/adapters/integration/sdkGatewayWindowHandler.ts` (native-only, no public clock)
- `src/adapters/integration/sdkGatewayRouteInbound.ts` / `sdkGatewayProductDispatch.ts`
- `src/main/sdk/createSdkGatewayProductSurface.ts` (`sdk:native-window` IPC)
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `omnicall-kit-integration/sdk-production-readiness/` (PROGRESS, ACCEPTANCE §B, AGENT-CONTINUATION)
- ADR-0013 / ADR-0027; Feature Registry F-011; STATUS

## Что
- Window show/hide/get-state переведены на Application `SdkSessionRevisionCoordinator` через broker
- Удалён main-only public revision clock из `SdkWindowCommandHandler`
- Handshake: validate → short native IPC → advance; stale → `stale_state`, busy hide → `conflict`
- Post-success `reply.revision`; get-state peek-only; interleave window+call на одном clock
- Документы/acceptance §B / continuation prompt для WU-03

## Зачем
Устранить dual public clocks за одним `revision` (ADR-0017/0027) без переноса BrowserWindow в renderer.

## Результат
- Acceptance §B green; второго public clock нет
- `npx vitest run` (9 files / 99 tests) — pass
- Следующий шаг: WU-03 SDK latest-known revision tracker; запросить `/sdk-review` для WU-02
