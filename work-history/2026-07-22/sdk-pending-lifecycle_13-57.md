# SDK pending lifecycle P0/P1

**Дата:** 2026-07-22 13:57
**Статус:** выполнено
**Коммит:** `9d9c474`

## Где
- `src/adapters/integration/sdkGatewayOriginTrustApprover.ts`
- `src/adapters/integration/sdkGatewayPairingApprover.ts`
- `src/adapters/integration/LocalWsServerAdapter.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts`
- `src/adapters/integration/sdkGatewayOriginTrustSession.ts`
- `src/renderer/components/integration/SdkConnectCeremonyModal.tsx` (+ hook)
- `docs/softphone/adr/ADR-0018-…`, Feature Registry, CHANGELOG, TEST-MATRIX, SMOKE, SECURITY, UX blueprint, STATUS

## Что
- Disconnect: cancel pending TOFU (без blacklist) / deny pairing по `connectionId`
- Origin leave `allowed`: deny pending pairing + close WS; paired clients не revoke
- TTL sweeper (15s) для orphaned TOFU/pairing
- Waiting Cancel/Escape; Approve требует Origin всё ещё `allowed`
- Docs sync: ADR-0018 §G, SECURITY (без Settings auto-open), SMOKE edge cases

## Зачем
Убрать зависания ceremony/approver Map при обрыве сокета и смене Origin policy без даунгрейда security gates.

## Результат
- `npm run lint` PASS
- `npm run typecheck` PASS
- `npm run test` — **2578 passed / 1 skipped**
- `npm run i18n:check` PASS
- P2 (multi-pending queue/badge) не в scope
