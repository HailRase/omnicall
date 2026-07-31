# DI-03 — Loopback WebSocket Transport

**Дата:** 2026-07-20 14:08
**Статус:** выполнено (`/sdk-review` PASS; High/Low follow-ups closed)
**Коммит:** `befbee0`

## Где
- `src/adapters/integration/LocalWsServerAdapter.ts` (+ helpers/session registry)
- `src/main/sdk/registerSdkGateway.ts`, `src/main/index.ts`
- `axatalk-sdk-integration/evidence/DI-03-loopback-websocket-transport.md`
- `package.json` (`ws@8.18.3`)

## Что
- Выбран и обоснован `ws@8.18.3` (`WebSocketServer`, без deprecated API)
- Реализован handshake-only loopback gateway + discovery HTTP (ADR-0015)
- Single-instance lock, occupied-port fail-closed, limits, heartbeat/idle/teardown
- Product commands без auth → `unauthenticated`; F-011 остаётся `in progress`
- Версия desktop `0.11.2` не менялась

## Зачем
- Закрыть DI-03: безопасный локальный транспорт до pairing/product routers (DI-04+)

## Результат
- `/sdk-review` PASS; follow-ups closed (bind-host allowlist, queue/idle/heartbeat tests, awaited gateway stop)
- Focused vitest: 35 passed; `npm test`: 2370 passed / 1 skipped
- `npm run lint` / `typecheck` / `registry:check`: PASS
- Следующий шаг: DI-04 via `/sdk-integration`
