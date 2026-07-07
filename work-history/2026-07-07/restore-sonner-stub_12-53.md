# Возврат Sonner-заглушки

**Дата:** 2026-07-07 12:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/sonner/index.ts` — заглушка
- `src/renderer/components/notifications/NotificationToast.module.css`
- `src/renderer/components/notifications/useNotificationSonnerSync.ts`

## Что
- Удалены UI Kit Sonner: `Sonner.tsx`, CSS, stories, tests.
- Заглушка реэкспортирует `Toaster`, `toast`, типы из библиотеки `sonner`.
- Стили иконок success/error перенесены в `NotificationToast.module.css`.
- Логика `NotificationViewport` и `useNotificationSonnerSync` сохранена.

## Зачем
Вернуть стабильное отображение stacked toast через нативный Sonner без кастомного UI Kit wrapper.

## Результат
- `npm run test -- NotificationViewport useActionNotifications useNotifications` — PASS (20/20).
