# DI-11 Origin TOFU gateway wiring

**Дата:** 2026-07-21 15:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/LocalWsServerAdapter.ts`
- `src/adapters/integration/localWsServerLifecycle.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts`
- `src/adapters/integration/localWsSessionInbound.ts`
- `src/adapters/integration/sdkGatewaySessionDispatch.ts`
- `src/adapters/integration/sdkGatewaySessionAuth.ts`
- `src/adapters/integration/sdkGatewayCapabilities.ts`
- `src/adapters/integration/sdkGatewayOriginTrustSession.ts` (new)
- `src/adapters/integration/sdkGatewayOriginTrustAdapterState.ts` (new)
- тесты: `sdkGatewayOriginPolicy.test.ts`, `LocalWsSessionRegistry.test.ts`, `LocalWsServerAdapter.auth.test.ts`

## Что
- `LocalWsServerAdapter`: mutable `originTrustEntries`, TOFU approver API, seed из allowlist/env, auto-allow при `autoApprovePairing`/`autoAllowOriginTrust`
- `bindLocalWsListening` + registry: проброс `getOriginTrustEntries`, `originTrustApprover`, matrix callback
- После handshake / перед pairing+auth: TOFU через `ensureSdkOriginTrusted`; deny → `forbidden` + `origin_denied`
- `resolveGrantedCapabilities`: пересечение с Origin matrix; pairing без `account.activate`
- Тесты обновлены под DI-11 upgrade semantics (unknown Origin принимается на upgrade)

## Зачем
Завершить adapter-path DI-11: Origin TOFU/blacklist на gateway до pairing/auth и matrix-governed grants.

## Результат
- `npx vitest run sdkGatewayOriginPolicy.test.ts LocalWsServerAdapter.auth.test.ts LocalWsServerAdapter.test.ts` — 30/30 PASS
- `npx tsc --noEmit` — без ошибок
