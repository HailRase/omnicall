# SDK Settings: три секции как вкладки

**Дата:** 2026-07-21 21:50
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SdkModuleSettingsCard.tsx`
- `SdkModuleSettingsCard.module.css`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/UX-UI-Design-Blueprint.md`, `Feature-Registry.md`

## Что
- «Основное» / «Доверенные сайты» / «Заблокированные сайты» переведены на UI Kit `Tabs` с `indicator="slide"` (как Account)
- Callouts TOFU/pairing остаются над полосой вкладок
- Обновлены тесты и i18n `section.tabsAria`

## Зачем
- Единый паттерн навигации Settings с разделом Аккаунт

## Результат
- `SdkModuleSettingsCard.test.tsx` 7/7 PASS; `i18n:check` PASS
