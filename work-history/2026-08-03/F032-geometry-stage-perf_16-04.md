# F-032 geometry stage layout and drag performance

**Дата:** 2026-08-03 16:04
**Статус:** выполнено
**Коммит:** —

## Где
- `WindowGeometryPreview*`, `WindowGeometryEditor*`, `WindowGeometryOverlays*`
- `useWindowGeometryCardDrag.ts`, `useWindowGeometryCardResize.ts`, `applyPreviewCardRect.ts`
- `ExternalApplicationsGeneralTab.tsx`; docs F-032 / P14 / I18N-Coverage

## Что
- Убраны description и label «Превью рабочего стола»
- Масштаб 1:4; desktop по центру stage
- Overlays sidebar справа от desktop внутри stage
- Заголовок карточки = имя приложения
- Live drag/resize через DOM, commit в draft только на pointer-up

## Зачем
- Убрать лаги/дёрганье и упростить визуальную структуру preview

## Результат
- vitest geometry/panel: 26/26 ✓
- eslint touched files ✓
