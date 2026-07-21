# DI-11 High/Low remediation + SemVer 0.12.0

**Дата:** 2026-07-21 16:29
**Статус:** выполнено
**Коммит:** (см. git log после commit)

## Где
- `src/adapters/integration/sdkOriginTrustMachineStore.ts`
- `src/main/sdk/registerSdkGateway.ts`
- `src/adapters/integration/sdkGatewayOriginTrustSession.ts`
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `package.json` / `CHANGELOG.md` / `distribution/*` → `0.12.0`

## Что
- Fail-closed: corrupt `sdk-origin-trust.json` → gateway не слушает (без env-only reopen)
- Mirror machine trust → все profile UserSettings buckets + Settings mount sync
- Удалён unused `enabled?` у `startSdkGateway`
- Origin Deny reply использует реальный `originTrustRequestId`
- SemVer MINOR `0.12.0` + CHANGELOG + manifest sync
- Исправлен `SettingsIntegrationsPanel` test (раздельные OCP/SDK секции)

## Зачем
Закрыть High/Low findings после `/sdk-review` PASS DI-11.

## Результат
`npm test` 2519 passed / 1 skipped; lint / typecheck / registry / i18n PASS.
