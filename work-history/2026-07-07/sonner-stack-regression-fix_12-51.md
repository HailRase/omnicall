# Фикс Sonner stack после регрессии restore

**Дата:** 2026-07-07 12:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/sonner/Sonner.module.css`

## Что
- Удалены ошибочно возвращённые `richColors` global overrides из CSS (их не было в рабочей neutral-версии после фикса hover/stack jump).
- Логика `NotificationViewport` (`expand={false}`, `gap={14}`, `offset={24}`, без `richColors`) и `useNotificationSonnerSync` не менялись.

## Зачем
После restore из git HEAD вернулись стили, которые конфликтовали с neutral product toast и ломали стабильное stacked-поведение.

## Результат
- `npm run test -- Sonner.test.tsx NotificationViewport.test.tsx useActionNotifications.test.ts` — PASS (25/25).
