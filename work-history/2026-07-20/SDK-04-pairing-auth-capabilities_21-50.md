# SDK-04 — Pairing, Authentication, and Capabilities

**Дата:** 2026-07-20 21:50
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/sdk/src/public/auth-client.ts`
- `axatalk-sdk/packages/sdk/src/internal/auth-orchestrator.ts`, `pop-crypto.ts`, `pop-key-store.ts`
- `axatalk-sdk/evidence/SDK-04-pairing-auth-capabilities.md`
- `axatalk-sdk/docs/WORK-UNITS.md`

## Что
- Реализован fail-closed browser auth client: handshake, pairing, PoP ECDSA P-256, capability projection
- IndexedDB / memory key store; privileged caps не запрашиваются клиентом
- Hostile/replay/revoke/stale-instance тесты; interop Web Crypto ↔ Node ieee-p1363 (DI-04 oracle)
- Публичный API auth-lifecycle (без AxatalkClient); `api:check` + `preflight` PASS
- SDK-04 → `review`

## Зачем
- Закрыть клиентскую сторону pairing/PoP/capabilities для F-011 peer track после DI-04

## Результат
- `npm run preflight` (cwd `axatalk-sdk/`) PASS; workspace tests 41; desktop PoP/auth oracle 11 PASS
- Запрошен `/sdk-review` SDK-04 only; DI-10 не разблокирован
