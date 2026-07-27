# SDK window.hide product enablement

**Дата:** 2026-07-27 10:39
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md`
- `axatalk-sdk/packages/protocol`, `axatalk-sdk/packages/sdk`
- `src/adapters/integration/sdkGatewayWindowHandler.ts`, `sdkGatewayRouteInbound.ts`, `sdkGatewayProductDispatch.ts`
- `src/main/shellWindow/SdkHideTrayController.ts`, `ShellTelephonyBusyMirror.ts`
- `src/domain/settings/SdkOriginTrust.ts`, Settings matrix UI / i18n
- `CHANGELOG.md`, `package.json` (`0.15.0`), `docs/softphone/STATUS.md`

## Что
- Amendment ADR-0013: `window:hide` доступен в product v1
- Protocol: пустой `V1_PRODUCT_UNAVAILABLE_COMMANDS`; SDK API `client.window.hide`
- Desktop: hide handler, busy mirror IPC, hide-only tray recovery, Origin matrix toggle
- Docs/guides/SECURITY/PROTOCOL/Feature Registry/TEST-MATRIX синхронизированы
- SemVer `0.15.0` + manifest sync

## Зачем
- CRM/host SDK должен уметь скрывать softphone в idle, без stranding оператора и без обхода call policy

## Результат
- Focused vitest (desktop + SDK + product hide) PASS; `api:check` / `docs:check` PASS
- Evidence: `axatalk-sdk-integration/evidence/DI-05-window-hide-product.md`
