# Settings sidebar icon centering

**Дата:** 2026-06-26 12:57
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsSidebar.tsx`, `.module.css`

## Что
- Свёрнутый режим: иконки 40×40 по центру rail (56px), `gap: 0`, label не участвует в flex
- Развёрнутый режим: grid 40px + label, иконки в фиксированной колонке по центру
- `toggleSlot` для центрирования кнопки expand/collapse

## Зачем
Визуальное выравнивание sidebar в collapsed/expanded состояниях.

## Результат
Тесты sidebar OK; lint, typecheck — OK.
