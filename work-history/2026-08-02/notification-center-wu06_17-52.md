# F-034 WU-06 History panel module expansion

**Дата:** 2026-08-02 17:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsNotificationHistoryPanel.tsx`
- `src/renderer/components/settings/panels/NotificationHistoryTable.tsx`
- `src/renderer/components/settings/panels/SettingsNotificationHistoryPanel.test.tsx`
- `src/domain/settings/userNotificationJournalPolicy.test.ts`
- `docs/softphone/` (Feature-Registry, STATUS, TASK-QUEUE, I18N-Coverage, UI-Component-Catalog, P15 handoff)
- `notification-center/PROGRESS.md`, `10-WORK-UNITS.md`

## Что
- History filter/table labels используют общий `MODULE_LABEL_KEY` (каталог prefs/history синхронен)
- Добавлен `data-testid="settings-notification-history-module"`
- Регрессионные тесты: фильтр `sdk`/`updates`/`externalServices`, legacy-строки, search/pagination/suppressed
- Journal persistence round-trip для полного `USER_NOTIFICATION_MODULES`
- Обновлены PROGRESS, handoff, registry, STATUS, TASK-QUEUE, I18N, UI catalog

## Зачем
- Prefs-модули и History-фильтры должны оставаться выровненными после расширения каталога F-034

## Результат
- Focused vitest PASS (panel 5 + journal policy 6)
- `npm run i18n:check` PASS
- `npm run ui:catalog` regenerated (includes history-module testid)
- `npm run typecheck` PASS; eslint на touched files PASS
- Next: WU-07 F-030 preferences portability
