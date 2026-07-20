# DI-09 Settings and Operational UX

**Дата:** 2026-07-20 21:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/SdkIntegrationSettings.ts`, `UserSettings` v10
- `src/application/settings/persistSdkIntegrationSettings.ts`
- `src/shared/ipc/SdkGatewaySettingsContract.ts`, preload/main IPC
- `src/renderer/components/settings/panels/SdkModuleSettingsCard*.tsx`
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `axatalk-sdk-integration/evidence/DI-09-settings-operational-ux.md`

## Что
- Добавлена schema v10 `sdkIntegration` + миграция fail closed
- Application persist + typed IPC для policy/paired/revoke/grant/diagnostics
- UI Kit карточка SDK Server (light/dark stories, a11y, hide disabled)
- i18n parity `ru/en/fr/de/bg`; F-011 остаётся `in progress`, версия `0.11.2`
- DI-09 → `review`; evidence и STATUS/Registry/handoff обновлены

## Зачем
- Дать оператору безопасный Settings UX для локального SDK gateway без секретов в UI/CRM.

## Результат
- Focused: 47 passed; `npm test` 2491 passed / 1 skipped; lint/typecheck/i18n/registry PASS
- Следующий шаг: `/sdk-review` DI-09 only (не стартовать DI-10)
