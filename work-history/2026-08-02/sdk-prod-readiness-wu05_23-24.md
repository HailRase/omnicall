# SDK Production-Readiness WU-05 — Pairing Origin+clientId

**Дата:** 2026-08-02 23:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayPairingStore.ts`
- `src/adapters/integration/sdkGatewayPairingSecretIds.ts`
- `src/adapters/integration/sdkGatewayPairingRecordParse.ts`
- `src/ports/secrets/SecretStoragePort.ts`
- Settings revoke path (IPC / UI / LocalWs revoke)
- `omnicall-kit-integration/sdk-production-readiness/*`

## Что
- Pairing secrets keyed by Origin+clientId (`paired-client-v2:<sha256(origin)>.<encodedClientId>`)
- Legacy `paired-client:<clientId>` migrates on touch only if stored Origin matches
- Same clientId on two Origins uses separate blobs; no cross-Origin overwrite
- Revoke/list/Settings metadata updated for Origin+clientId
- Acceptance §E marked green; PROGRESS / Registry / continuation for WU-06

## Зачем
- Устранить коллизию хранения pairing по одному `clientId` между разными Origin (ADR-0011 / ADR-0027)

## Результат
- `vitest` focused suites: 45 passed (pairing store, settings contract, Settings card, auth/product/call adapter)
- Independent `/sdk-review` for WU-05 requested; next WU-06 only
