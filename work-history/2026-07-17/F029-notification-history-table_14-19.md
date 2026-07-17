# F-029: журнал уведомлений → UI Kit Table

**Дата:** 2026-07-17 14:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsNotificationHistoryPanel.tsx`
- `src/renderer/components/settings/panels/NotificationHistoryTable.tsx`
- `src/renderer/components/settings/panels/SettingsNotificationHistoryPanel.module.css`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`, `I18N-Coverage.md`

## Что
- Список карточек заменён на UI Kit `Table` (колонки: время, пользователь, сообщение, модуль, уровень, popup)
- Вынесен presentational `NotificationHistoryTable`; фильтры и пагинация сохранены
- Добавлены i18n-ключи колонок/уровней для ru/en/fr/de/bg
- Тест панели проверяет semantic table + suppressed marker
- T-038 закрыт в TASK-QUEUE

## Зачем
- Привести раздел «Журнал уведомлений» к канону UI Kit Table и улучшить читаемость истории.

## Результат
- `npm run i18n:check` — ok
- `npm run lint` / `npm run typecheck` — ok
- `npm run test` — 2213 passed / 1 skipped
- `npm run ui:catalog` — ok
