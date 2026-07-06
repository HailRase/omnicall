# TabsList full width in profile selector

**Дата:** 2026-07-06 23:49
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/SavedAccountProfileSelector.module.css`

## Что
- `.tablist`: `width: 100%`, `display: flex` — контейнер табов (border/background) на всю ширину
- Триггеры UI Kit по-прежнему `flex: 0 0 auto` — items по ширине контента

## Зачем
Pill-контейнер на всю строку; отдельные табы не растягиваются.

## Результат
- SavedAccountProfileSelector tests — ok
- lint:css — ok
