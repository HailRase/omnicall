# Красная trash-иконка на вкладках профиля

**Дата:** 2026-07-07 10:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/SavedAccountProfileSelector.tsx`
- `src/renderer/components/account/SavedAccountProfileSelector.module.css`

## Что
- Рядом с каждой вкладкой профиля — всегда видимая красная иконка `dial.delete` (16px)
- Убраны hover-reveal и dismiss через `overlay.close`
- При наведении — чуть ярче через `--color-status-failed-hover`

## Зачем
Простой и понятный UX по запросу пользователя: trash рядом с вкладкой.

## Результат
Тесты и lint — OK.
