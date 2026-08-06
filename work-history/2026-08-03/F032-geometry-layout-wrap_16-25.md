# F-032 geometry layout wrap on narrow settings

**Дата:** 2026-08-03 16:25
**Статус:** выполнено
**Коммит:** —

## Где
- `WindowGeometryEditor.module.css`
- `WindowGeometryPreview.module.css`

## Что
- Layout preview/controls переведён на `flex-wrap` + `@container` по ширине секции (не viewport)
- При узкой панели настроек controls уходит под stage
- Stage/sidebar чуть мягче по min-width, меньше ложного горизонтального overflow

## Зачем
- Убрать горизонтальный скролл stage из‑за бокового controls в несвернутом окне

## Результат
- Controls переносятся под preview когда секции не хватает ширины
