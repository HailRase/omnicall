# UI Kit Badge

**Дата:** 2026-07-06 22:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/badge/`
- `src/renderer/components/ui/types.ts`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Реализован `Badge` с тонами `default | muted | success | warning | destructive | info` и размерами `sm | md`
- Добавлена поддержка опциональной иконки через `AppIcon` и `iconId`
- CSS Module по канону VISUAL-SPEC: высота 22–24px, pill-radius, semibold xs
- Storybook: Default, Tones, Sizes, With Icon, Light/Dark, DenseComposition
- Vitest: 7 тестов (контент, иконка, tone/size, ref, className, a11y)
- Barrel export и типы `BadgeTone` / `BadgeSize`
- Чеклист Badge в `UI-KIT.md` отмечен done

## Зачем
Добавить переиспользуемый UI Kit маркер статуса/категории для продуктовых экранов без локальных badge-стилей.

## Результат
- `npx vitest run src/renderer/components/ui/badge/Badge.test.tsx` — 7/7 passed
- `npm run lint` — passed
- `npm run typecheck` — ошибки только в существующем `Notification.stories.tsx` (не связаны с Badge)
