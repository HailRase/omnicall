# UI Kit Spinner

**Дата:** 2026-07-06 22:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/spinner/`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Реализован `Spinner` с размерами `sm | md | lg`, `label` и `decorative`
- CSS Module с анимацией, `prefers-reduced-motion` и фиксированными размерами
- Storybook: Default, Sizes, With Label, Decorative, Light/Dark
- Vitest: status role, decorative `aria-hidden`, ref, className, protected props
- Barrel export и обновлён чеклист в `UI-KIT.md`

## Зачем
Добавить переиспользуемый inline-индикатор загрузки для UI Kit с корректной a11y-семантикой.

## Результат
`npm run test -- src/renderer/components/ui/spinner/Spinner.test.tsx` — 7/7 OK; `npm run lint` — OK; typecheck падает на существующих ошибках в `Notification.stories.tsx`, не связанных с Spinner.
