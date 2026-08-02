# F-034 WU-04 Notification Center Preferences UI

**Дата:** 2026-08-02 17:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsNotificationCenterPanel.tsx`
- `src/renderer/components/settings/panels/SettingsNotificationPreferencesPanel.tsx`
- `src/renderer/components/settings/panels/SettingsNotificationModuleRow.tsx`
- `src/renderer/hooks/useSettingsActions.ts`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `notification-center/PROGRESS.md`, `docs/softphone/Feature-Registry.md`, `STATUS.md`, `I18N-Coverage.md`

## Что
- Settings → Notifications стал hub с вкладками Preferences / Appearance (placeholder) / History
- Preferences: master popup, per-module enabled + minLevel, пресеты Default / Quiet successes
- Raise-контролы скрыты до WU-08; сохранение через `useSettingsActions`
- i18n ru/en/fr/de/bg; Storybook light/dark; component + hook tests
- Appearance editors пока остаются в General (перенос — WU-05)

## Зачем
- Пользователь может управлять master и per-module popup-предпочтениями Notification Center

## Результат
- `npm run typecheck` PASS
- `npm run lint` PASS
- `npm run i18n:check` PASS
- `npm run registry:check` 75/0 PASS
- focused vitest: Notification Center + settings actions + SettingsPanel PASS
- next: `Implement WU-05 from notification-center/10-WORK-UNITS.md`
