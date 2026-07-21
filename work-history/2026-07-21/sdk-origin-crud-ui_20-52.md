# SDK Origin CRUD UI

**Дата:** 2026-07-21 20:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/sdkOriginTrustMutations.ts` (`renameAllowedSdkOrigin`)
- `src/domain/settings/SdkIntegrationSettings.ts` (`parseExactSdkOrigin`)
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `src/renderer/components/settings/panels/SdkModuleSettingsPolicySection.tsx`
- `src/renderer/components/settings/panels/SdkModuleSettingsAllowedOriginRow.tsx`
- i18n ru/en/fr/de/bg

## Что
- Убрана textarea «заменить весь список»
- Добавление Origin по одному (+ кнопка Добавить)
- Редактирование URL Origin с сохранением matrix
- Удаление / blacklist / Unblock без изменений контракта
- Per-Origin capability matrix остаётся у каждой записи

## Зачем
- Несколько Origins с индивидуальными правами и полноценным edit/delete

## Результат
- `npx vitest run sdkOriginTrustMutations.test.ts SdkModuleSettingsCard.test.tsx` — 9 passed
- `npm run typecheck` — green
