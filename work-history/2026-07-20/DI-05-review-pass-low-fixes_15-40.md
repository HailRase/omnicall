# DI-05 `/sdk-review` PASS + Low remediations

**Дата:** 2026-07-20 15:40
**Статус:** выполнено
**Коммит:** `3777509`

## Где
- `src/adapters/integration/sdkGatewayRouteInbound.ts`
- `src/adapters/integration/LocalWsServerAdapter.product.test.ts`
- `src/adapters/integration/sdkGatewayRouteInbound.test.ts`
- `axatalk-sdk-integration/WORK-UNITS.md`, `evidence/DI-05-*`, `docs/softphone/STATUS.md`, P12 handoff, Feature Registry

## Что
- Gate `/sdk-review` DI-05 закрыт (`done`); F-011 остаётся `in progress`; version `0.11.2`
- Low: `window:hide` → `forbidden` через `productDenialCodeForCommand` (ADR-0013)
- Low: product-тесты deny `window:show` без cap, skip fan-out без `session.read.redacted`, sequence + `get-snapshot` resync
- Docs/evidence counts: focused 60; full suite 2407/1

## Зачем
Довести DI-05 до ship-ready после PASS и закрыть Low-дыры перед DI-06.

## Результат
- focused vitest 60 passed; `npm test` 2407 passed / 1 skipped
- готово к коммиту и старту DI-06
