# ADR-0018 SDK origin_blocked / origin_denied mapping

**Дата:** 2026-07-21 15:19
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/protocol/src/errors.ts`
- `axatalk-sdk/packages/sdk/src/internal/origin-policy-errors.ts`
- `axatalk-sdk/packages/sdk/src/internal/connection-session.ts`
- `axatalk-sdk/packages/sdk/src/internal/auth-inbound.ts`
- `axatalk-sdk/packages/sdk/src/internal/auth-orchestrator.ts`
- `axatalk-sdk/packages/sdk/src/public/auth-client.ts`, `axatalk-client.ts`, `index.ts`
- `axatalk-sdk/etc/api/protocol.api.md`, `sdk.api.md`

## Что
- Добавлен client-side код `origin_blocked` в `PROTOCOL_ERROR_CODES`
- Маппинг upgrade reject (до handshake) → `origin_blocked`, non-retryable, без reconnect
- Wire `forbidden` + `details.origin_denied` → terminal `failed`, без reconnect
- Экспорт `isOriginBlockedError`, `getConnectError()` на Auth/Axatalk client
- Unit/integration тесты + обновление API snapshots

## Зачем
Реализовать ADR-0018 pedagogy для integrators: distinguish blacklist vs first-contact deny и stop auto-retry.

## Результат
- `npm run api:check` — PASS
- `npx vitest run packages/sdk packages/protocol --reporter=dot` — 129 passed
