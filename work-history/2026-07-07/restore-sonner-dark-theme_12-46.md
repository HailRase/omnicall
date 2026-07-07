# Восстановление UI Kit Sonner с тёмной темой

**Дата:** 2026-07-07 12:46
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/sonner/` — полный UI Kit wrapper
- `src/renderer/components/notifications/useNotificationSonnerSync.ts`

## Что
- Восстановлен `Toaster` с semantic tokens, `unstyled` classNames и `useDocumentTheme`.
- Восстановлены `Sonner.module.css`, stories, тесты.
- Добавлен тест синхронизации `data-sonner-theme="dark"` при `data-theme="dark"`.
- Иконки success/error возвращены в Sonner CSS; удалён временный `NotificationToast.module.css`.

## Зачем
Вернуть полноценный shadcn-like Sonner с поддержкой светлой и тёмной темы через project tokens.

## Результат
- `npm run test -- Sonner.test.tsx NotificationViewport.test.tsx` — PASS (20/20).
- `npm run lint` — PASS.
