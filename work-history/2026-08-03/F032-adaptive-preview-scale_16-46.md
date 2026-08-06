# F-032 adaptive geometry preview scale

**Дата:** 2026-08-03 16:46
**Статус:** выполнено
**Коммит:** —

## Где
- `windowGeometryMath.ts`, `windowGeometryConstants.ts`, `useGeometryPreviewStageWidth.ts`
- `WindowGeometryPreview*`, `WindowGeometryOverlayCards`, drag/resize hooks, `applyPreviewCardRect`
- Docs: Feature Registry F-032, P14 (new Geometry preview scale), I18N-Coverage, UI Catalog

## Что
- Адаптивный divisor preview 4–8 от ширины stage (`ResizeObserver`)
- Desktop + overlays sidebar влезают в один row; stage выровнен влево
- Один scale для desktop/card/overlays/drag/resize
- Тесты math + panel/editor без регрессий

## Зачем
- Читаемый preview при узком (не fullscreen) окне настроек без горизонтального скролла row

## Результат
- vitest: 29/29 ✓; eslint ✓
- Downgrade open-path / persisted geometry не затронут (только renderer preview)
