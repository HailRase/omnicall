# Update banner сверху (F-020)

**Дата:** 2026-07-07 14:57
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/hooks/useActionNotifications.ts`
- `src/renderer/hooks/useActionNotifications.test.ts`

## Что
- `UpdateAvailableBanner` снова рендерится в overlay-слое `SoftphoneReadyShell` сверху по центру
- Промпт обновления убран из Sonner-уведомлений (`useActionNotifications`) — без дублирования
- Обновлены тесты `useActionNotifications`

## Зачем
Восстановить ненавязчивый top overlay для F-020 вместо toast-уведомления.

## Результат
- `npm run test -- --run UpdateAvailableBanner.test.tsx useActionNotifications.test.ts` — 8/8 OK
- `npm run lint`, `npm run typecheck` — OK
