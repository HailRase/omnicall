# Fix: profile tabs hover/active chrome leak

**Дата:** 2026-07-17 15:16
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/SavedAccountProfileSelector.tsx`
- `src/renderer/components/account/SavedAccountProfileSelector.module.css`

## Что
- Причина: UI Kit selected chrome на `TabsTrigger` (spec выше локального override) проявлялся без `:hover`; на hover локальные стили его маскировали
- Selected chrome только на shell; trigger всегда transparent с более высокой specificity
- Вкладка «Новый» тоже в shell — единый паттерн

## Зачем
- Убрать «мигание» странных стилей при уходе hover с active profile tab.

## Результат
- SavedAccountProfileSelector tests — ok
