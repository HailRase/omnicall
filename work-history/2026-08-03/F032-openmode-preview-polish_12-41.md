# F-032 openMode preview polish

**Дата:** 2026-08-03 12:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-applications/OpenModeSchematics.tsx`
- `src/renderer/components/settings/external-applications/OpenModeChoiceCards.module.css`

## Что
- Анимация: плавный fade-out без scale/рывка в сторону; один keyframe для обоих режимов
- Стрелка с отступами от softphone и целевого окна
- Убран title-текст из title bar (подпись только снизу — без overlap с traffic lights)
- Единый `schematicTargetFrame` stroke 1.5 + `non-scaling-stroke` для окна и браузера

## Зачем
- Убрать рывки исчезновения и визуальные несостыковки preview

## Результат
- Правки CSS/SVG; ручная проверка в Settings → External Applications → General
