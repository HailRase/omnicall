# Sonner test teardown

**Дата:** 2026-08-03 00:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/notifications/NotificationViewport.test.tsx`

## Что
- Дождался очереди таймеров и animation frame Sonner после размонтирования.
- Очистил React-дерево до глобального dismiss уведомлений.
- Устранил отложенный доступ Sonner к jsdom после teardown.

## Зачем
- Сделать тест `NotificationViewport` надёжным в корневом release preflight.

## Результат
- `npx vitest run src/renderer/components/notifications/NotificationViewport.test.tsx`, ESLint, typecheck и `npm run release:preflight` завершились успешно.
