# UI Kit AlertDialog

**Дата:** 2026-07-06 22:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/alert-dialog/`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`
- `package.json` (`@radix-ui/react-alert-dialog`)

## Что
- Добавлен composable AlertDialog на Radix (`Root`, `Trigger`, `Content`, `Header`, `Title`, `Description`, `Footer`, `Action`, `Cancel`)
- CSS Module с overlay/content анимациями по VISUAL-SPEC (360px, semantic tokens, reduced motion)
- Storybook: Default, Destructive, Controlled, Loading Action, Light/Dark
- 8 unit-тестов: open/close, action/cancel callbacks, focus trap, role, controlled state, loading
- Barrel export и обновление чеклиста UI-KIT.md

## Зачем
Блокирующий confirmation-примитив для деструктивных и критичных решений в продуктовых экранах.

## Результат
`npx vitest run src/renderer/components/ui/alert-dialog/AlertDialog.test.tsx` — 8/8 passed; `npm run lint` — ok; typecheck падает на pre-existing `FormField.stories.tsx` (не связано с AlertDialog).
