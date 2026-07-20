# DI-03 High/Low follow-ups

**Дата:** 2026-07-20 14:32
**Статус:** выполнено
**Коммит:** `6bf777a`

## Где
- `src/adapters/integration/sdkGatewayPeer.ts`
- `src/adapters/integration/LocalWsServerAdapter.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts` (+ test)
- `src/adapters/integration/sdkGatewayConnection.ts`
- `src/main/index.ts`
- `axatalk-sdk-integration/evidence/DI-03-loopback-websocket-transport.md`
- docs STATUS / WORK-UNITS

## Что
- Runtime allowlist bind-host (`127.0.0.1` / `::1`); reject `0.0.0.0` → `invalid_bind_host`
- Убран `localhost` из peer remote-address check
- Тесты: outbound queue, heartbeat miss, unauth idle, deep JSON over WS, non-loopback bind
- `finalizeShutdown` ждёт `stopSdkGateway` перед quit/restart
- Узкий `SdkGatewaySocket` для registry (без утечки полного `ws` API)

## Зачем
- Закрыть High/Low findings после `/sdk-review` PASS для DI-03

## Результат
- Focused: 35 passed; full suite: 2370 passed / 1 skipped; lint/typecheck/registry:check green
- F-011 остаётся `in progress`; version `0.11.2` без bump
