# Визуальное выделение выбранной single CallSessionCard

**Дата:** 2026-06-30 10:50
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallSessionCard.module.css`
- `src/renderer/components/call/CallSessionCard.tsx`
- `src/renderer/components/call/CallSessionCard.test.tsx`

## Что
- Добавлены `cardSelected` / `cardHeld.cardSelected` — те же accent border и inset bar, что у `compactSelected`
- Полная карточка применяет `cardSelected`, когда `isActive` и передан `onClick`
- Статус held-карточки показывает «· выбран» как в compact-режиме
- Тест на наличие класса выделения

## Зачем
При входящем + одной established-линии в singleCard не было видно, какая сессия выбрана для ControlsBar.

## Результат
CallSessionCard tests — green; lint — green.
