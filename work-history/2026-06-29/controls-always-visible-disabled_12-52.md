# Control bar: все кнопки видны, disabled по условию

**Дата:** 2026-06-29 12:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallControlsBar.tsx`
- `src/renderer/components/call/CallControlsBar.test.tsx`

## Что
- Убрано условное скрытие hold/transfer/dtmf при Connecting
- Все 5 кнопок всегда в разметке; недоступные — `disabled` с причиной из projection или «Доступно после соединения»

## Зачем
Пользователь должен видеть полный набор действий; неактивные кнопки не исчезают, а показывают disabled-состояние.

## Результат
`npm run test -- CallControlsBar.test.tsx` — OK
