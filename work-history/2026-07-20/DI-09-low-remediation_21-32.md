# DI-09 Low remediation — IPC deep parse + card interaction tests

**Дата:** 2026-07-20 21:32
**Статус:** выполнено
**Коммит:** `09f2853`

## Где
- `src/shared/ipc/parseSdkGatewaySettingsSnapshot.ts`
- `src/shared/ipc/SdkGatewaySettingsContract.ts` (+ test)
- `src/renderer/components/settings/panels/SdkModuleSettingsCard.test.tsx`
- `axatalk-sdk-integration/evidence/DI-09-settings-operational-ux.md`

## Что
- Fail-closed deep parse origins/paired/pending/diagnostics; allowlisted reconstruction; reject secret-like keys
- UI tests: approve pending, issue grant, confirm revoke
- Evidence/WORK-UNITS обновлены под Low remediation

## Зачем
Закрыть Low-находки `/sdk-review` DI-09 перед DI-10.

## Результат
Focused suite **51 passed**; lint/typecheck/i18n PASS. Version `0.11.2` без bump.
