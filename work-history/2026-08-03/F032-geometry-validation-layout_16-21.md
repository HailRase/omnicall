# F-032 geometry overlays layout and field validation

**Дата:** 2026-08-03 16:21
**Статус:** выполнено
**Коммит:** —

## Где
- `WindowGeometryOverlays.*`, `WindowGeometryEditor.module.css`
- `WindowGeometryNumberField.tsx`, `WindowGeometrySizeFields.tsx`, `WindowGeometryPositionFields.tsx`
- `useGeometryFieldValidation.ts`; i18n `validation.*`

## Что
- Кнопка «Добавить» зафиксирована снизу на всю ширину; список overlays со скроллом
- Блоки Размер/Позиция переносятся (`flex-wrap` + `auto-fit`)
- Валидация W/H/X/Y: hint диапазона, clamp при blur, ошибка out-of-range / invalid number

## Зачем
- Стабильный UX sidebar overlays и защита от невалидных размеров/позиций

## Результат
- vitest editor/panel: 21/21 ✓; eslint/stylelint ✓
