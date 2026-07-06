# UI Kit Notification

**Дата:** 2026-07-06 22:35
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/notification/`
- `src/renderer/components/ui/types.ts`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`

## Что
- Реализован `Notification` — persistent notification card с tone, title, message, actions, metadata, closable
- CSS Module по канону Toast/Notification из VISUAL-SPEC (semantic tokens, left stripe, elevated surface)
- Storybook: Default, Tones, With Actions, Closable, Long Content, Light/Dark
- 10 unit-тестов: copy, close, actions, metadata, role by tone, ref, className, protected props
- Barrel export и `NotificationTone` в shared types
- Чеклист Notification в UI-KIT.md отмечен done

## Зачем
Добавить переиспользуемый UI Kit примитив для persistent/app-level уведомлений, который product-контейнеры смогут композировать вместо локальных стилей.

## Результат
`npm run test -- src/renderer/components/ui/notification/Notification.test.tsx` — 10/10 passed
`npm run lint` — passed
`npm run typecheck` — passed
