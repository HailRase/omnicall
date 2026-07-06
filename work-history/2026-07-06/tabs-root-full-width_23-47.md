# Tabs root full width in profile selector

**Дата:** 2026-07-06 23:47
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/SavedAccountProfileSelector.module.css`

## Что
- `.tabs-root`: `flex: 1; width: 100%` — внешний контейнер на всю доступную ширину строки
- `.tablist` остаётся `width: fit-content` — сами табы по ширине контента

## Зачем
Кнопка удаления справа, зона табов занимает всю строку; pill-группа не растягивается.

## Результат
- SavedAccountProfileSelector tests — ok
- lint:css — ok
