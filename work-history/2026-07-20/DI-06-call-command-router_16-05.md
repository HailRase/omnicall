# DI-06 — Call Command Router

**Дата:** 2026-07-20 16:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/ExternalSdkCallHandler.ts` (+ ownership/mutex/clock/product handler)
- `src/adapters/integration/sdkGatewayRouteInbound.ts`, `sdkGatewayProductDispatch.ts`, `sdkGatewayRequestDedup.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`, `src/shared/ipc/SdkBrokerContract.ts`
- `axatalk-sdk-integration/evidence/DI-06-call-command-router.md`, `WORK-UNITS.md`
- `docs/softphone/STATUS.md`, `Feature-Registry.md`, P12 handoff

## Что
- Роутинг `call:*` через typed broker → Application → существующие Use Cases / Call Engine
- Ownership / `expectedRevision` / idempotency (cached `requestId`) / per-call mutex (ADR-0017)
- Operator/account остаются `not_ready`; `window:hide` product-denied
- Тесты: ownership, stale, not_owner, duplicate requestId, capability deny, revoke
- DI-06 статус `review`; F-011 `in progress`; версия `0.11.2`

## Зачем
Открыть безопасную mutation-поверхность telephony для SDK-сессий без второго Call Engine и без регрессии DI-04/DI-05.

## Результат
- Focused DI set: 79 passed
- `npm test`: 2426 passed / 1 skipped
- `npm run lint` / `typecheck` / `registry:check` (71/0): PASS
- Следующий шаг: `/sdk-review` DI-06 only
