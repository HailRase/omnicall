# Password toggle !visible and icon reset

**Дата:** 2026-07-08 15:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPasswordField.tsx`
- `src/renderer/components/account/AccountPanel.module.css`

## Что
- Условия на глазе и type инпута через `!visible` (скрыт → show, виден → hide)
- Полный reset border/background/box-shadow/outline у toggle и иконки во всех состояниях

## Зачем
Исправить путаницу состояния и убрать визуальное оформление кнопки у иконки.

## Результат
`AccountPanel.test.tsx` — 6/6.
