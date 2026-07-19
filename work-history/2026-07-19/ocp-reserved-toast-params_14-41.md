# OCP reserved toast params + post-call Confirm

**Дата:** 2026-07-19 14:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/components/notifications/resolveNotificationDescriptorTitle.ts`
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/i18n/messages.ts`, `bgMessages.ts`

## Что
- Title snapshot для toast теперь резолвится с `messageParams` (раньше `t(key)` без params → crash на `params.reason`)
- Post-call Confirm закрывает модалку в `finally` (нет вечного loader)
- Toast notify при reserve не валит command path
- Тесты на interpolation reserved toast + закрытие modal при throw notify

## Зачем
Исправить Uncaught TypeError при резервации статуса и зависший «Подтвердить» в post-call modal.

## Результат
- Фокусные тесты + typecheck green
