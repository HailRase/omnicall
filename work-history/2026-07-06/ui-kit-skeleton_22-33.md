# UI Kit Skeleton

**Дата:** 2026-07-06 22:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/skeleton/`
- `src/renderer/components/ui/types.ts`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Реализован `Skeleton` с формами `text`, `rectangle`, `circle` и опциональными `width`/`height`
- CSS Module: shimmer-анимация на семантических токенах, `@media (prefers-reduced-motion: reduce)` отключает анимацию
- Декоративный placeholder: `aria-hidden="true"`, без role и без текста для AT
- Storybook: Text, Rectangle, Circle, Composite Card, Light/Dark Theme
- 8 unit-тестов: a11y, shape, ref, className, размеры, защита controlled props
- Barrel export и тип `SkeletonShape` в UI Kit root

## Зачем
Добавить переиспользуемый loading-placeholder в UI Kit для композиции скелетонов карточек и списков без объявления фиктивного контента скринридерам.

## Результат
- `npx vitest run src/renderer/components/ui/skeleton/Skeleton.test.tsx` — 8/8 passed
- `npm run lint` — passed
- `npm run typecheck` — ошибки только в существующем `Notification.stories.tsx` (не связаны с Skeleton)
