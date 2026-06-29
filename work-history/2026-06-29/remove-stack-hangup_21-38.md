# Убрать hangup из стека сессий

**Дата:** 2026-06-29 21:38
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallSessionStack.tsx`
- `src/renderer/components/call/CallSessionStack.module.css`
- `src/renderer/shells/call/CallContextShell.tsx`
- `docs/softphone/UI-Component-Catalog.md`

## Что
- Удалена per-line кнопка «Завершить» из `CallSessionStack`
- Убран проп `onHangupLine` и связанные стили `.hangupButton`
- Завершение звонка — только через выбор сессии и «Завершить» в `CallControlsBar`
- Обновлён UI catalog

## Зачем
После выбора сессии без auto-resume дублирующий hangup в стеке избыточен и усложняет layout.

## Результат
814 passed, 1 skipped; lint, typecheck, ui:catalog — green.
