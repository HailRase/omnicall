# Google Forms style password eye

**Дата:** 2026-07-08 15:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPasswordField.tsx`
- `src/renderer/components/account/AccountPanel.module.css`

## Что
- Один инпут с тем же `.input`, что и остальные поля; иконка абсолютно внутри справа
- Убран flex-контейнер с отдельной «колонкой» кнопки
- Toggle без фона/рамки (`appearance: none`), приглушённый цвет `--color-text-muted`

## Зачем
Визуально как в Google Forms: глаз внутри поля, не отдельная кнопка.

## Результат
`AccountPanel.test.tsx` — 6/6.
