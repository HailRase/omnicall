# Live matrix multi-Origin enforcement

**Дата:** 2026-07-22 11:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayCapabilities.ts` (+ test)
- `src/adapters/integration/sdkGatewaySessionDispatch.ts`
- `src/adapters/integration/sdkGatewayProductDispatch.ts`
- `src/adapters/integration/sdkGatewaySnapshotDispatch.ts`
- `src/adapters/integration/sdkGatewayEventFanout.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts`
- `src/adapters/integration/LocalWsServerAdapter.multiOrigin.test.ts`
- `docs/softphone/adr/ADR-0018-…`, `Feature-Registry.md`
- `axatalk-sdk/docs/SECURITY.md`, `guide/capabilities.md`, `guide/errors.md`
- `axatalk-sdk-integration/TEST-MATRIX.md`

## Что
- Live effective caps: `pairingGrants ∩ currentOriginMatrix` на командах, snapshot и event fan-out
- Matrix shrink → `forbidden` + `permission_denied` без re-pair
- Dual-Origin isolation + live-shrink adapter tests
- Документация ADR-0018 §D / SECURITY / capabilities / errors / TEST-MATRIX / Registry согласованы

## Зачем
- Несколько Origin с разными permissions должны реально изолироваться; Settings matrix не должна «залипать» до re-pair

## Результат
- `npx vitest run` (9 gateway suites) — **55/55 PASS**
- Downgrade не обнаружен на auth/call/operator/product/activate/route
