# UI Kit Sidebar

**Дата:** 2026-07-16 10:14
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/sidebar/`
- `src/renderer/styles/tokens.css`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/ui-kit/UI-KIT.md`
- `docs/softphone/Icon-Registry.md`

## Что
- Добавлена shadcn-like семья `Sidebar` с `SidebarProvider`, `useSidebar`, desktop collapse (`offcanvas` / `icon` / `none`), вариантами `sidebar` / `floating` / `inset`, mobile sheet на Radix Dialog.
- Реализованы composable слоты: header/content/footer, group/menu/submenu, trigger, rail, inset, separator, input, badge, skeleton.
- Добавлены semantic tokens sidebar, иконка `ui.sidebar.toggle` (`PanelLeft`), i18n ключи для 5 локалей.
- Storybook `UI Kit/Sidebar` (default, variants, collapsible, mobile, controlled, light/dark).
- Vitest: 8 тестов (toggle, controlled, keyboard, mobile sheet, active state, className).
- Зависимость `@radix-ui/react-slot` добавлена в `package.json`.

## Зачем
Дать переиспользуемый UI Kit примитив навигационной боковой панели в стиле shadcn/ui для product shells без дублирования локальной разметки.

## Результат
- `npx vitest run src/renderer/components/ui/sidebar/Sidebar.test.tsx` — 8/8 passed
- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run i18n:check` — только pre-existing violation в `InputGroup.tsx`
