# Баннер обновления — кнопки справа

**Дата:** 2026-07-06 16:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/updates/UpdateAvailableBanner.tsx`
- `src/renderer/components/updates/UpdateAvailableBanner.module.css`

## Что
- Горизонтальный layout: иконка | текст | кнопки справа
- Стили кнопок как в SettingsForm (border, background, font-family: inherit)
- Ширина баннера увеличена до 36rem

## Зачем
Кнопки в Storybook выглядели без стилей и располагались под текстом вместо правой части баннера.

## Результат
- test/lint/typecheck — OK
