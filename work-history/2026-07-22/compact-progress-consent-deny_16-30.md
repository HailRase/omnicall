# Compact progress + activate consent UX

**Дата:** 2026-07-22 16:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/OcpSignInProgress*.tsx` / CSS
- `src/renderer/components/integration/SdkActivateProfileConsentModal.*`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`, `sdkIntegrationSettingsSync.ts`
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `src/application/integration/ExternalSdkAccountHandler.ts`
- Docs: ADR-0018 §E, UX Blueprint, Feature-Registry, CHANGELOG, STATUS

## Что
- Compact OCP progress: статусы этапов только иконками; tooltip ошибки сохранён
- Activate consent: Cancel▾ (Запретить сайту) + Allow; компактный layout
- Deny: await persist `account.activate=false` + notify Settings panel refresh (баг устаревшей matrix)

## Зачем
- Уместить UI на compact-окне; ясный consent footer; после Deny Trusted-sites matrix должна сразу показывать activate=denied.

## Результат
- Tests: OcpSignInProgress, SdkActivateProfileConsentModal, ExternalSdkAccountHandler, i18n parity — green
- `tsc` web / `i18n:check` / `ui:catalog` — green
