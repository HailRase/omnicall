# Удаление UI Kit Sonner

**Дата:** 2026-07-07 12:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/sonner/` — оставлена только заглушка `index.ts`
- `src/renderer/components/notifications/NotificationToast.module.css`
- `src/renderer/components/notifications/useNotificationSonnerSync.ts`

## Что
- Удалены UI Kit компоненты Sonner: `Sonner.tsx`, стили, stories, тесты.
- Заглушка `ui/sonner/index.ts` реэкспортирует `Toaster`, `toast`, типы напрямую из библиотеки `sonner`.
- Стили иконок success/error перенесены в `NotificationToast.module.css`.
- Удалён неиспользуемый `notificationLevelToSonnerToast.ts`.
- Зависимость `sonner` в `package.json` сохранена.

## Зачем
Убрать кастомный UI Kit wrapper над Sonner, оставив библиотеку и рабочий runtime уведомлений через заглушки.

## Результат
- `npm run test -- src/renderer/components/notifications/NotificationViewport.test.tsx` — PASS (10/10).
