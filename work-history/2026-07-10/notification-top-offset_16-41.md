# Notification top offset below window controls

**Дата:** 2026-07-10 16:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/notifications/NotificationViewport.tsx`
- `src/renderer/components/ui/toast/Toast.module.css`
- `src/renderer/components/notifications/NotificationViewport.test.tsx`
- `src/renderer/components/ui/toast/Toast.test.tsx`

## Что
- Для top-placement уведомлений Sonner передаётся `offset.top: var(--incoming-call-banner-top)`
- UI Kit `ToastViewport` для top-left/top-right использует тот же CSS-токен вместо `top: 0`
- Добавлены тесты на top-offset для NotificationViewport и Toast

## Зачем
- Верхние toast-уведомления не должны перекрывать frameless window controls, как incoming call overlay и UpdateAvailableBanner.

## Результат
- `npm run test -- --run NotificationViewport.test.tsx Toast.test.tsx` — 22 passed
- Линт/typecheck в репозитории падают на несвязанных pre-existing ошибках
