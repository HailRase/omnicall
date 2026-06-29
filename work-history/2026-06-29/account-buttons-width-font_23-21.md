# Кнопки аккаунта — ширина и шрифт

**Дата:** 2026-06-29 23:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/icons/IconTooltip.tsx`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/account/AccountPanel.module.css`

## Что
- IconTooltip при пустом label всё равно рендерит host-span (без скачка layout)
- actionTooltipHost + buttonWrap на 100% ширины ячейки сетки
- font-weight кнопок: 400 вместо semibold

## Зачем
«Выйти» сжималась после logout из-за inline-flex обёртки tooltip; более лёгкий шрифт кнопок.

## Результат
- AccountPanel + IconTooltip tests, lint, typecheck — ok
