# SDK gateway inbound serialization

**Дата:** 2026-07-23 14:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayConnection.ts`
- `src/adapters/integration/localWsSessionInbound.ts`
- `src/adapters/integration/sdkGatewayConnection.test.ts`
- `src/adapters/integration/LocalWsServerAdapter.auth.test.ts`
- `axatalk-sdk/docs/PROTOCOL.md`, `SECURITY.md`
- `docs/softphone/adr/ADR-0010…`, `ADR-0016…`
- `axatalk-sdk-integration/TEST-MATRIX.md`, `evidence/DI-04-…`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`

## Что
- Добавлена per-connection очередь inbound (`inboundTail` + `enqueueSdkGatewayInbound`)
- `parseAndDispatchLocalWsSession` обрабатывает кадры строго по порядку receive
- Регрессия: `sdk:auth-proof` → сразу `sdk:ping` без sleep → `ok: true`
- Документация синхронизирована (протокол, security, ADR, TEST-MATRIX, F-011, STATUS)

## Зачем
- Убрать гонку, из‑за которой официальный SDK получал `unauthenticated` на auth-confirm ping
- Без изменения SDK и без костыльных задержек на клиенте

## Результат
- `npx vitest run` focused gateway suite: **49 passed** (connection/auth/registry/call/product/operator/multiOrigin)
- SDK не менялся; version не bump’ился (bug fix mid-stream, не release cut)
