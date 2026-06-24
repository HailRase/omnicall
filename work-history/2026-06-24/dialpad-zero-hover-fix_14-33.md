# Исправление hover на клавише 0 dialpad

**Дата:** 2026-06-24 14:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/components/dialpad/Dialpad.test.tsx`

## Что
- Добавлен флаг `isZeroPressing` — символ вводится только после реального нажатия
- `handleZeroPressEnd` игнорирует `mouseLeave`/`mouseUp` без предшествующего `mouseDown`
- В режиме DTMF клавиша «0» использует обычный `onClick`, как остальные клавиши
- Добавлены тесты: hover без нажатия, короткий press, DTMF zero

## Зачем
Убрать ложный ввод «0» при наведении курсора на клавишу dialpad (LF-026).

## Результат
`npm run test -- src/renderer/components/dialpad/Dialpad.test.tsx` — 8/8 passed.
