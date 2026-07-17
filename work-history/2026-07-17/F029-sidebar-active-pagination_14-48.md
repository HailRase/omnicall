# F-029: тонкий active sidebar + pagination selects

**Дата:** 2026-07-17 14:48
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsSidebar.module.css`
- `src/renderer/components/settings/panels/SettingsNotificationHistoryPanel.tsx`
- `src/renderer/components/settings/panels/SettingsNotificationHistoryPanel.module.css`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`

## Что
- Active item в settings sidebar: убран bg, border 1.5px → 1px; оставлены border + цвет иконки (collapsed/expanded/child)
- В журнале уведомлений добавлены Select страницы и pageSize (10/20/50)
- i18n: `pageSelect`, `pageSize` для ru/en/fr/de/bg; тест смены page/pageSize

## Зачем
- Упростить визуал активного пункта навигации и дать управление пагинацией журнала.

## Результат
- `vitest` SettingsSidebar + SettingsNotificationHistoryPanel — ok
- `i18n:check`, eslint панели — ok
