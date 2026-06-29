# Dialpad input и кнопка удаления

**Дата:** 2026-06-29 15:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/components/dialpad/Dialpad.module.css`
- `src/renderer/components/icons/IconControlButton.tsx`
- `src/renderer/shells/call/CallControlsShell.tsx`
- `src/renderer/components/dialpad/Dialpad.test.tsx`

## Что
- Единый focus-ring на `.inputRow` через `:focus-within`; убран двойной outline у `input`
- Кнопка удаления: фиксированный hit-area 2rem, hover/active фон, tooltip про удержание
- Долгое нажатие 1 с на delete → `onClear` (полная очистка номера)
- `IconControlButton`: опциональные `onMouseDown` / `onMouseUp` / `onMouseLeave`
- Тест long-press clear; stories обновлены

## Зачем
Исправить визуальные дефекты поля ввода номера и добавить UX очистки по удержанию, как в классических dialpad.

## Результат
`npm run test` — 793 passed; `npm run lint` и `npm run typecheck` — OK.
