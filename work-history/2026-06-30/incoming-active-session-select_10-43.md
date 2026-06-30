# Переключение сессии при входящем во время активного звонка

**Дата:** 2026-06-30 10:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/activeCallControlsProjection.ts`
- `src/application/projections/deriveCallControlTarget.ts`
- `src/application/projections/deriveIncomingCallControlLine.ts`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/renderer/components/call/CallSessionCard.tsx`
- `src/renderer/shells/call/CallControlsShell.tsx`

## Что
- `activeCallControlsProjection` не переключается на входящий, если уже есть установленная сессия (Active/Held/Connecting/Transferring)
- Добавлены `deriveCallControlTarget` и `deriveIncomingCallControlLine` с unit-тестами
- `useCallFeatureShell` использует application-деривацию целевой сессии для ControlsBar
- Полноразмерная `CallSessionCard` стала кликабельной при передаче `onClick` (сценарий 1 активный + 1 входящий)
- `CallControlsShell` показывает `lastOperationError` только для выбранной сессии

## Зачем
При входящем звонке во время активной сессии оператор должен иметь возможность переключиться на любую линию и управлять ею через ControlsBar без поломки multi-call.

## Результат
843 passed, 1 skipped; lint и typecheck — green.
