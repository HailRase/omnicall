# Incoming overlay hide on main route

**Дата:** 2026-07-08 20:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useIncomingCallOverlayShell.ts`
- `src/renderer/shells/call/IncomingCallOverlayShell.tsx`
- `docs/softphone/Feature-Registry.md`

## Что
- Overlay скрывается на главной call surface (`route.name === dialpad`)
- На history/settings/contacts баннер по-прежнему показывается
- Тест на отсутствие дублирования с `IncomingCallSessionCard`

## Зачем
На главной уже есть карточка входящего вызова в context zone — глобальный баннер дублировал UI.

## Результат
- `useIncomingCallOverlayShell.test.ts`: 5 passed
