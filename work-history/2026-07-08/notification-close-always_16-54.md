# Кнопка закрытия уведомлений — всегда

**Дата:** 2026-07-08 16:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/notifications/NotificationViewport.tsx`
- `src/renderer/components/notifications/useNotificationSonnerSync.ts`
- `src/renderer/hooks/useNotifications.ts`
- `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Кнопка закрытия Sonner-тоста всегда включена (`closeButton` / `closeButton: true`)
- Все элементы очереди создаются с `closable: true`, без зависимости от настроек
- Удалён переключатель «Показывать кнопку закрытия» из настроек
- Обновлены тесты NotificationViewport, useNotifications, SettingsGeneralPanel

## Зачем
На части уведомлений пропадала кнопка закрытия из‑за настройки `notificationClosable` и снимка `closable` на каждый тост; пользователь ожидает кнопку всегда.

## Результат
`npm run test` (затронутые модули) — 22 passed
`npm run typecheck` — passed
`eslint` на изменённых файлах — passed
