# RAT Step 06 — Real OCP WebSocket (R5)

**Дата:** 2026-06-24 21:20
**Статус:** выполнено (код + тесты); smoke R5 — pending manual
**Коммит:** —

## Где
- `src/adapters/operator/websocket/` — transport, protocol, gateways, tests
- `src/ports/operator/OperatorPlatformGateway.ts` — `setInboundRawHandler`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`, `wireOcpInboundToFacade.ts`
- `src/renderer/bootstrap/readBootstrapConfig.ts` — `VITE_OCP_*`
- `docs/softphone/real-integration/PROGRESS.md`, `env.local.example`

## Что
- `OcpWebSocketTransport` — один shared WS (legacy `useWs` parity)
- `WebSocketOperatorPlatformGateway` — auth, status, break reasons, post-call, logout, reconnect, disconnect
- `WebSocketOcpSyncGateway` — parse inbound, campaign_respond, dlg_stop
- Inbound wiring вынесен из `AccountBootstrapFacade` в bootstrap factories
- SIP-only real mode без OCP WS (MockOperatorPlatformGateway)
- Unit-тесты: protocol, URL resolver, оба gateway (+16)

## Зачем
Закрыть RAT step 06 (LF-001–004, LF-037–040) — real OCP WebSocket за портами без дублирования Use Cases.

## Результат
- `npm run test` — 574 passed, 1 skipped
- `npm run lint` / `npm run typecheck` — green
- Smoke R5 — **pending manual** на dev OCP stand
- Step 07 не начинался
