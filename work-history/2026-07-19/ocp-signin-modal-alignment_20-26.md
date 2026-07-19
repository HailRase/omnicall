# Доводка выравнивания модалки OCP sign-in

**Дата:** 2026-07-19 20:26
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/OcpSignInProgress.tsx`
- `src/renderer/components/account/OcpSignInProgressStatusIcon.tsx`
- `src/renderer/components/account/OcpSignInProgress.module.css`

## Что
- Спиннер active крутит SVG с `transform-origin: 50% 50%` (static LoaderCircle)
- Иконка и статусный текст выровнены по одной линии; статус-блок к bottom у Progress
- Фиксированная колонка статуса → равная длина всех Progress
- Убраны overall summary и failure Alert; ошибка всегда «Ошибка» + CircleAlert, детали в tooltip
- Ширина модалки ~420px

## Зачем
- Визуальная полировка по замечаниям UX без изменения Domain/orchestration.

## Результат
- `vitest` OcpSignInProgress — 3 passed
- `tsc` / `lint:css` — green
