# UX: журнал уведомлений и сайдбар настроек

**Дата:** 2026-07-17 14:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SettingsNotificationHistoryPanel.*`
- `src/renderer/components/settings/SettingsSidebar.module.css`
- `src/renderer/components/settings/settingsSections.ts`
- `src/renderer/components/icons/iconCatalog.ts`
- `src/domain/settings/userNotificationJournalPolicy.ts`
- `src/application/use-cases/settings/QueryUserNotificationJournalUseCase.ts`
- `src/application/facades/AccountBootstrapFacade.ts`

## Что
- Переработан UI журнала уведомлений: toolbar фильтров, empty/loading/error, sticky table header, пагинация с итогом
- Иконка раздела уведомлений заменена на `settings.notifications` (`Bell` + `BellIcon` из lucide-animated)
- В свёрнутом сайдбаре активный пункт усилен accent-фоном, обводкой и цветом иконки (light/dark)
- Имя пользователя в фильтре и таблице показывает только local-part до `@`
- Обновлены i18n (ru/en/fr/de/bg), Feature Registry F-029, Icon Registry, тесты

## Зачем
Сделать журнал уведомлений и навигацию настроек читаемыми и визуально однозначными без потери текущего поведения.

## Результат
- `npx vitest run` (policy/query/panel/sidebar) — 22 passed
- `npx tsc --noEmit` — ok
- `npx eslint` (touched) — ok
- `npm run i18n:check` — ok
