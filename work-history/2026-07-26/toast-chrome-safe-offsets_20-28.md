# Toast chrome-safe offsets (window controls)

**Дата:** 2026-07-26 20:28
**Статус:** выполнено
**Коммит:** `8f05421`

## Где
- `src/renderer/components/notifications/resolveNotificationToasterOffset.ts`
- `src/renderer/components/notifications/NotificationViewport.tsx`
- `src/renderer/components/notifications/NotificationViewport.module.css`
- `src/renderer/components/ui/toast/Toast.module.css`
- `docs/softphone/Feature-Registry.md`, `UI-Design-System.md`, `CHANGELOG.md`

## Что
- Один chrome-safe offset для Sonner `offset` и `mobileOffset` (compact shell &lt; 600px)
- CSS override: corner placement вместо Sonner mobile full-bleed
- UI Kit top toast viewport учитывает safe-inline insets
- Документация: Floating UI vs window controls; evidence LF-060

## Зачем
- Тосты в main/compact display не должны перекрывать frameless window controls на Win/Linux/macOS.

## Результат
- `npm run test -- --run resolveNotificationToasterOffset.test.ts NotificationViewport.test.tsx Toast.test.tsx` — 27 passed
