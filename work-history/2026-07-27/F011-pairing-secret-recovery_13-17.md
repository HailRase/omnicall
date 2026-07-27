# F-011 pairing secret_load_failed recovery

**Дата:** 2026-07-27 13:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayPairingStore.ts`
- `src/main/secrets/ElectronSafeStorageSecretService.ts`
- `src/main/sdk/registerSdkGatewaySettingsIpc.ts`
- `src/ports/secrets/SecretStoragePort.ts`
- `docs/softphone/adr/ADR-0011-sdk-pairing-origin-capabilities.md`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`, `CHANGELOG.md`
- `omnicall-kit-integration/evidence/DI-04-*.md`, `DI-09-*.md`

## Что
- Pairing store: при `secret_load_failed` purge blob → `null` (Settings/auth не падают)
- safeStorage: corrupt file удаляется, для SIP по-прежнему `secret_load_failed`
- Settings IPC: catch → `{ ok:false, reason }` вместо unhandled reject
- Тесты recovery + decrypt purge; синхронизация ADR/Registry/evidence

## Зачем
- Убрать краш Settings на повреждённых pairing-секретах без ослабления SIP secret path

## Результат
- `vitest` pairing/secrets/auth/settings contract: 20 passed
- `npm run lint`: PASS
- Версия не bump (fix в `[Unreleased]`); F-011 остаётся `in progress`
