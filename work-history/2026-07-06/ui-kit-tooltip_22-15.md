# UI Kit Tooltip

**Дата:** 2026-07-06 22:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/tooltip/`
- `docs/ui-kit/UI-KIT.md`
- `package.json` (`@radix-ui/react-tooltip`)

## Что
- Добавлен Radix-based `Tooltip` с composable API (`TooltipProvider`, `TooltipRoot`, `TooltipTrigger`, `TooltipContent`)
- Convenience-обёртка: `label`, `side`, `delayDuration`, `disabled`, `children`
- CSS Module с overlay-токенами, анимацией open/close и reduced-motion/transparency
- Storybook: Default, Sides, Delay, Disabled, Long Text, Light/Dark, composable пример
- Vitest: hover, focus, escape, disabled, empty label, className, controlled state
- Barrel export в `src/renderer/components/ui/index.ts`

## Зачем
Универсальный UI Kit tooltip для коротких подсказок на hover/focus с Radix a11y и семантическими токенами.

## Результат
- `npx vitest run src/renderer/components/ui/tooltip/Tooltip.test.tsx` — 7/7 passed
- `npm run typecheck` — ok
