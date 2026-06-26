# Вертикальное выравнивание и hover кнопки закрытия настроек

**Дата:** 2026-06-26 14:47
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/styles/tokens.css`
- `src/renderer/components/settings/SettingsPanel.tsx`
- `src/renderer/components/settings/SettingsPanel.module.css`

## Что
- `--radius-control` изменён с 6px на 12px глобально
- Иконка закрытия центрирована по вертикали (`closeSlot`, `svg { display: block }`)
- Hover: квадрат 32×32 с фоном и `border-radius: var(--radius-control)` (12px)

## Зачем
Уточнить визуал кнопки закрытия настроек по запросу пользователя.

## Результат
Settings tests 8/8 passed; lint OK.
