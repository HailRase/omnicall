# SDK revoke hard-delete

**Дата:** 2026-07-22 10:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayPairingStore.ts`
- `src/adapters/integration/localWsSessionRevoke.ts`
- `src/adapters/integration/LocalWsServerAdapter.ts`
- `src/main/sdk/sdkGatewaySettingsOps.ts`
- `src/renderer/components/settings/panels/SdkModuleSettingsPairedSection.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`

## Что
- Revoke paired SDK-клиента теперь hard-delete (секрет + индекс), без soft-tombstone
- `listPublic` чистит legacy soft-revoked записи при чтении
- Snapshot Settings не отдаёт revoked; UI больше не показывает серые «отозван»
- Тесты store + auth revoke; тексты confirm обновлены (ru/en/fr/de/bg)

## Зачем
- Отозванные клиенты копились в списке и шумели без пользы

## Результат
- `npx vitest run` pairing store / auth revoke / SdkModuleSettingsCard — 16/16 PASS
- После «Отозвать» клиент исчезает из UI и storage; повторный connect снова требует pairing
