# Alert action layout shadcn fix

**Дата:** 2026-07-07 13:16
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/alert/Alert.module.css`
- `src/renderer/components/ui/alert/Alert.stories.tsx`
- `src/renderer/components/ui/alert/Alert.test.tsx`
- `docs/ui-kit/UI-KIT.md`

## Что
- Grid приведён к shadcn v4/radix: `0 1fr` по умолчанию, `auto 1fr` при иконке
- Title/description всегда `grid-column-start: 2` (col-start-2)
- `AlertAction` — только `absolute top-2 right-2`, вне grid-потока
- Root с action: `padding-right: 4.5rem` (pr-18)
- Story `WithAction` — «Dark mode» без иконки; добавлен `WithIconAndAction`
- Тесты на overlay action и content column

## Зачем
Исправить layout с кнопкой: action не должен занимать строку grid, текст не перекрывается кнопкой.

## Результат
`npx vitest run src/renderer/components/ui/alert/Alert.test.tsx` — 12/12 passed.
