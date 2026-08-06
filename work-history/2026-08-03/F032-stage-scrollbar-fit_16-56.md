# F-032 stage phantom horizontal scrollbar

**Дата:** 2026-08-03 16:56
**Статус:** выполнено
**Коммит:** —

## Где
- `windowGeometryConstants.ts`, `windowGeometryMath.ts`, `WindowGeometryPreview.module.css`
- `docs/softphone/P14-External-Applications-Design.md`

## Что
- Резерв sidebar приведён к реальной ширине 15rem; учтён border desktop
- `realToPreview` → `Math.floor` против sub-pixel overflow
- Sidebar CSS: фиксированные 15rem (совпадает с math)

## Зачем
- Убрать горизонтальный скролл stage, когда контент визуально уже влезает

## Результат
- vitest geometry/editor: 16/16 ✓
