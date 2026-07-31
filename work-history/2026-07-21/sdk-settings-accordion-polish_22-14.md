# SDK settings accordion UX polish

**Дата:** 2026-07-21 22:14
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SdkModuleSettingsTrustedSitesSection.tsx`
- `src/renderer/components/settings/panels/SdkModuleSettingsTrustedSiteItem.tsx`
- `src/renderer/components/settings/panels/SdkModuleSettingsOriginAddressEditor.tsx`
- `src/renderer/components/settings/panels/SdkModuleSettingsOriginMatrix.tsx`
- `src/renderer/components/settings/panels/SdkModuleSettingsCard.module.css`
- `src/renderer/components/ui/accordion/Accordion.module.css`
- `src/renderer/hooks/useSdkSettingsPanel.ts`
- `docs/softphone/Icon-Registry.md`

## Что
- Аккордеон trusted sites: border, фон `surface-alt`, боковые паддинги trigger/content
- «Добавить сайт»: input + кнопка в одну линию, separator перед списком
- Локальный draft для add-input (без ререндера всего panel на каждый символ) + `onAddOrigin(draft?)`
- Адрес сайта: input и edit/save/cancel иконками (`IconControlButton` + tooltip) в одну линию
- Permissions Select сужены до `10rem`; адрес и permissions разделены separator + заголовком

## Зачем
- Убрать сливание аккордеона с фоном, лаг ввода и склейку блоков в развёрнутом item

## Результат
- `vitest` SdkModuleSettingsCard + Accordion: 16/16 pass
- eslint по затронутым файлам: ok
