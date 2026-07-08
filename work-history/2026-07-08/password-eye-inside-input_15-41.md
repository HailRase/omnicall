# Password eye icon inside input

**Дата:** 2026-07-08 15:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPasswordField.tsx`
- `src/renderer/components/account/AccountPanel.module.css`

## Что
- Глаз перенесён внутрь поля пароля справа как иконка, без `IconControlButton`
- Общая обводка у контейнера `passwordField`; input без собственного border
- Кнопка toggle прозрачная, только `AppIcon` 16px

## Зачем
Визуально иконка должна быть частью инпута, а не отдельной кнопкой снаружи.

## Результат
`AccountPanel.test.tsx` — 6/6; `typecheck` — green.
