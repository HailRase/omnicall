# Notification capture

**Дата:** 2026-07-17 13:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/settings/UserNotificationCaptureService.ts`
- `src/application/use-cases/settings/*UserNotification*`
- `src/domain/settings/UserSettings.ts`
- `src/renderer/hooks/useNotifications.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Все renderer notifications проходят через Application capture sink.
- Запись выполняется до решения о popup и содержит suppressed marker.
- Добавлены record/query use cases, фильтры и pagination contract.
- UserSettings v9 получил `notificationPopupEnabled=true` с миграцией.
- Real bootstrap подключает app-scoped file journal.
- Основные action/OCP уведомления размечены module/function.

## Зачем
Гарантировать историю каждого пользовательского уведомления независимо от popup-настроек.

## Результат
Focused tests: 30 passed. `npm run typecheck`: passed.
