# UI Kit Tabs

**Дата:** 2026-07-06 23:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/tabs/`
- `src/renderer/components/ui/index.ts`
- `docs/ui-kit/UI-KIT.md`
- `package.json` (`@radix-ui/react-tabs`)

## Что
- Добавлен composable Tabs на Radix: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- CSS Module с токенами, `data-state`, `data-orientation`, `data-disabled`
- Storybook: Default, Controlled, Vertical, Disabled Tab, Light/Dark
- 9 тестов: click, keyboard, controlled, disabled, ref, className
- Barrel export и обновление чеклиста UI-KIT

## Зачем
Реализовать P1-примитив переключения секций для последующей миграции product UI.

## Результат
`npx vitest run src/renderer/components/ui/tabs/Tabs.test.tsx` — 9/9 passed; `npm run lint` и `npm run typecheck` — ok.
