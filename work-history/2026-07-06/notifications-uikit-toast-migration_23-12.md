# Миграция нотификаций на UI Kit Toast

**Дата:** 2026-07-06 23:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/notifications/`
- `src/renderer/hooks/useNotifications.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/Feature-Registry.md`
- `docs/ui-kit/UI-KIT.md`

## Что
- `NotificationToast` переведён на UI Kit (`ToastRoot`, `ToastTitle`, `ToastAction`, `ToastClose`)
- `NotificationViewport` оборачивает очередь в `ToastProvider` + `ToastViewport` с placement из настроек
- Добавлен `notificationLevelToToastTone` для маппинга `error` → `destructive`
- Упрощён `useNotifications`: убраны ручной таймер и pause/resume (жизненный цикл — Radix)
- Удалены локальные CSS Modules нотификаций
- Добавлены тесты `NotificationViewport.test.tsx`, обновлён `useNotifications.test.ts`

## Зачем
Унифицировать визуал и поведение action-feedback с UI Kit Toast вместо дублирующих локальных стилей.

## Результат
`npm run test` — 1452 passed, 1 skipped
`npm run lint` — passed
`npm run typecheck` — passed
