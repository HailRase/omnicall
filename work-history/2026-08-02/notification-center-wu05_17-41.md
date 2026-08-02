# F-034 WU-05 Appearance relocation

**Дата:** 2026-08-02 17:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsNotificationAppearancePanel.tsx`
- `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx`
- `src/renderer/components/settings/panels/SettingsNotificationCenterPanel.tsx`
- `src/renderer/components/settings/SettingsPanel.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `notification-center/PROGRESS.md`, `docs/softphone/Feature-Registry.md`, handoff P15

## Что
- Appearance editors (placement/stacking/duration/maxVisible) перенесены в Notification Center
- Сохранены прежние `data-testid` контролов toaster chrome
- General: убраны дубликаты; hint + CTA → Notifications → Appearance
- `SettingsPanel` держит controlled tab для deep-link на Appearance
- i18n ru/en/fr/de/bg; Storybook Appearance light/dark; catalog обновлён

## Зачем
- Единый источник правды для toast chrome settings в Notification Center (F-034 WU-05)

## Результат
- Focused tests PASS (Appearance/General/Center/Panel + NotificationViewport offsets)
- `typecheck` PASS · `lint` PASS · `i18n:check` PASS · `registry:check` 75/0
- Next: `Implement WU-06 from notification-center/10-WORK-UNITS.md`
