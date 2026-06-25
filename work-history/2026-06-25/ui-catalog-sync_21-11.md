# UI Component Catalog sync

**Дата:** 2026-06-25 21:11
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/UI-Component-Catalog.md`

## Что
- Запущен `npm run ui:catalog` после рефакторинга icon tooltips
- Добавлены `IconControlButton`, `IconTooltip` в индекс каталога
- Обновлены списки `data-testid` у call/status/shell-компонентов (перенос на `IconControlButton`)
- Файл добавлен в staging (`git add`)
- `npm run ui:catalog:check` — exit 0

## Зачем
- Закрыть blocker preflight: каталог должен соответствовать текущему renderer-коду.

## Результат
- `ui:catalog:check` проходит локально; для CI нужен commit staged-файла.
