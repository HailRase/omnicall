# Fix: active «Доступен» + без background в dropdown

**Дата:** 2026-07-19 15:11
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/components/integration/ocp/OcpStatusDropdown.module.css`

## Что
- Ready current: при `reasonId` 0/несовпадении помечается единственный Ready option (`isReadyOptionCurrent`)
- Убраны background на hover/active — только `color` + `border-color`
- Explicit `background: transparent` чтобы перебить UI Kit highlight

## Зачем
Chip показывал «Доступен» через fallback, а пункт меню не получал active-стиль.

## Результат
- `useOperatorStatusSelector` + `OcpStatusDropdown` tests — green
