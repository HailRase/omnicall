# SDK per-Origin matrix UI

**Дата:** 2026-07-21 20:44
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SdkModuleSettingsPolicySection.tsx`
- `src/renderer/components/settings/panels/SdkModuleSettingsOriginMatrix.tsx`
- `src/renderer/components/settings/panels/sdkOriginMatrixUi.ts`
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/adr/ADR-0018-…`, `Feature-Registry.md` (F-011)

## Что
- UI: список allowed Origins с полной capability matrix (не только activate)
- `window.hide` — disabled + ADR-0013 reason
- Секция «Чёрный список» + Unblock; кнопки Delete / Blacklist на allowed
- Hook: `onBlacklistOrigin` / `onRemoveAllowedOrigin` через domain mutations
- i18n ru/en/fr/de/bg; тесты и Storybook обновлены

## Зачем
- Каждый Origin должен иметь свой allowlist SDK-прав (звонки, show, logout, activate и т.д.) — ADR-0018 §D в Settings

## Результат
- `npx vitest run SdkModuleSettingsCard.test.tsx` — 5 passed
- `npm run typecheck` — green
