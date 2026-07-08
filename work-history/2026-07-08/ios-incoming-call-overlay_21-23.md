# iOS compact Incoming Call Overlay

**Дата:** 2026-07-08 21:23
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallOverlay.tsx`
- `src/renderer/components/call/IncomingCallOverlay.module.css`
- `src/renderer/styles/tokens.css`
- `docs/softphone/Feature-Registry.md` (F-002)

## Что
- Frosted-glass баннер: `backdrop-filter` + полупрозрачный фон через семантические токены `--incoming-call-*`
- Framer Motion: spring enter/exit баннера, pulse иконки, hover/tap кнопок, linear progress автоответа
- iOS systemGreen `#34C759` / systemRed `#FF3B30` для accept/decline pill-кнопок (42px, radius 21px)
- Порядок кнопок: «Ответить» слева, «Отклонить» справа (как iOS compact banner)
- `useReducedMotion` — без анимаций при prefers-reduced-motion
- Удалены CSS `@keyframes` и solid green background

## Зачем
Визуальное приближение к iOS compact incoming call banner по research-спеку, в рамках проектных правил (CSS Modules + tokens, без Tailwind).

## Результат
- `npm run test` — pass (697+)
- `IncomingCallOverlay.test.tsx` — 8/8 pass
- `npm run lint` — pass (1 pre-existing warning)
- `npm run typecheck` — fail в `useIncomingCallOverlayActions.test.ts` (не связано с этой задачей)
