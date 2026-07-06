# UI Kit DropdownMenu

**Дата:** 2026-07-06 22:04
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/dropdown-menu/`
- `src/renderer/components/ui/index.ts`
- `package.json` (`@radix-ui/react-dropdown-menu`)
- `docs/ui-kit/UI-KIT.md`

## Что
- Добавлен composable `DropdownMenu` на Radix: Root, Trigger, Content, Item, CheckboxItem, Label, Separator, Group
- CSS Module по overlay/menu visual canon: elevated surface, shadow, data-state анимация, destructive/disabled/highlighted states
- `DropdownMenuItem` поддерживает `destructive`, `iconId` (AppIcon), `disabledReason` (IconTooltip)
- Storybook `UI Kit/DropdownMenu` — default, icons, destructive, disabled, checkbox, controlled, light/dark
- 8 unit-тестов: open/close, select, disabled skip, keyboard nav, escape, controlled state, checkbox, className
- Barrel export и обновление чеклиста UI-KIT

## Зачем
P0 UI Kit primitive для action menu с единым стилем, a11y (Radix) и disabled reason вместо локальных dropdown-дубликатов.

## Результат
- `npx vitest run src/renderer/components/ui/dropdown-menu/DropdownMenu.test.tsx` — 8/8 passed
- `npm run lint` — passed
- `npm run typecheck` — passed
- Следующий компонент: `Dialog`
