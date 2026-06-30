# Без обводки выбора у единственного звонка

**Дата:** 2026-06-30 11:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallSessionCard.tsx`
- `src/renderer/shells/call/CallContextShell.tsx`
- `src/renderer/components/call/CallSessionCard.test.tsx`

## Что
- Проп `showSelectionChrome`: обводка и «· выбран» только при конкурирующих сессиях
- Один звонок без входящего — снова `<article>`, без onClick и без `cardSelected`
- При входящем singleCard получает `showSelectionChrome` и selectable-режим

## Зачем
Обводка выбора нужна только когда есть что переключать; для одного звонка она лишняя.

## Результат
CallSessionCard tests — green.
