# Поведение уведомлений без дедупликации

**Дата:** 2026-07-07 12:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useActionNotifications.ts`
- `src/renderer/components/notifications/useNotificationSonnerSync.ts`
- `src/renderer/components/notifications/NotificationViewport.tsx`
- `src/renderer/components/ui/sonner/Sonner.module.css`
- `src/renderer/hooks/useActionNotifications.test.ts`
- `docs/softphone/Feature-Registry.md`

## Что
- Убрана дедупликация action-уведомлений в `useActionNotifications`; каждое действие теперь создаёт отдельный toast.
- Для account/call/sip/logout/settings/status/OCP уведомлений убраны фиксированные `id`, чтобы не было перезаписи одинаковых сообщений.
- В `NotificationViewport` отключён `richColors`, оставлен нейтральный toast-стиль.
- В `useNotificationSonnerSync` добавлены иконки через `AppIcon`: зелёная для `success`, красная для `error`; остальные уровни рендерятся в обычном стиле.
- Обновлены стили `Sonner` под нейтральный вид и добавлены классы для цвета иконок success/error.
- Обновлён Feature Registry (F-016 / LF-060) с фиксацией поведения без дедупликации повторных операций.
- Error-иконка заменена с `call.reject` (трубка) на семантическую `notification.error` (`CircleX`) без вводящей в заблуждение телефонии.
- Success-иконка закреплена как `notification.success` (`CircleCheck`) в зелёном цвете.
- Для stacked-режима включён `expand` в Sonner и убраны кастомные `gap/offset` из viewport для более стабильного shadcn-like позиционирования.
- Добавлена минимальная высота toast (`min-height: 48px`) для уменьшения визуальных скачков стека при разной длине текста.
- По фидбеку UX скорректировано обратно к shadcn-stack логике: `expand={false}` (collapsed stack с расширением по hover), возвращены `gap/offset`, удалён `min-height` у toast.

## Зачем
- Пользователь ожидает, что при каждом нажатии/операции появляется отдельное уведомление, особенно в режиме stacked.
- Нейтральный визуальный стиль toast снижает риск вводящего в заблуждение состояния и оставляет акцент только на типе исхода через иконку.

## Результат
- Повторные операции (включая одинаковые success/error подряд) отображаются отдельными уведомлениями без подавления.
- Проверка: `npm run test -- src/renderer/hooks/useActionNotifications.test.ts src/renderer/components/notifications/NotificationViewport.test.tsx src/renderer/components/ui/sonner/Sonner.test.tsx` — PASS (24/24).
- Проверка после правок иконок/stacked: `npm run test -- src/renderer/components/notifications/NotificationViewport.test.tsx src/renderer/components/ui/sonner/Sonner.test.tsx` — PASS (19/19).
- Проверка после фикса hover/stack jump: `npm run test -- src/renderer/components/notifications/NotificationViewport.test.tsx src/renderer/components/ui/sonner/Sonner.test.tsx` — PASS (19/19).
- Проверка: `ReadLints` для изменённых файлов — ошибок нет.
