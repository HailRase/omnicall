# DI-04 — Pairing, Origin, Capabilities, Revocation

**Дата:** 2026-07-20 14:49
**Статус:** выполнено (`/sdk-review` PASS; High/Low closed 15:09)
**Коммит:** —

## Где
- `src/adapters/integration/` — Origin policy, pairing store, PoP crypto, auth/session dispatch
- `src/main/sdk/registerSdkGateway.ts`, `src/main/secrets/MainProcessSecretStorageAdapter.ts`
- `src/ports/secrets/SecretStoragePort.ts`
- `axatalk-sdk-integration/evidence/DI-04-pairing-origin-capabilities.md`
- STATUS / Feature Registry / P12 / WORK-UNITS

## Что
- Exact Origin allowlist на WS upgrade (fail closed)
- Pairing ceremony + deferred/local approve + SecretStorage persistence
- PoP ECDSA P-256 (IEEE-P1363) + single-use challenge/nonce cache
- Capability checks; `sdk:ping` после auth; product snapshot → `not_ready` (DI-05)
- Revoke → `sdk:revoked` без teardown SIP/OCP; audit allowlist
- Post-review: `prime256v1` pin, no InMemory secret default, expiry/TTL tests

## Зачем
- Превратить handshake-only gateway DI-03 в fail-closed авторизованную local control surface по ADR-0011/0016.

## Результат
- DI-04 → `done`; F-011 `in progress`; version `0.11.2`
- Следующий шаг: DI-05 via `/sdk-integration`
