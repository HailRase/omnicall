# UI Kit Table

**Дата:** 2026-07-17 14:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/table/`
- `src/renderer/components/ui/index.ts`
- `src/renderer/components/ui/types.ts`
- `docs/ui-kit/UI-KIT.md`
- `docs/ui-kit/VISUAL-SPEC.md`

## Что
- Добавлено семейство `Table` (shadcn-like): `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`
- CSS Modules на семантических токенах: hover/selected row, footer, caption, typed `align`
- Storybook `UI Kit/Table` (default, selected, alignment, dense, light/dark)
- Vitest: семантика table, ref, className, align, selected `data-state`, slots
- Обновлены barrel export, checklist в `UI-KIT.md`, канон в `VISUAL-SPEC.md`

## Зачем
- Нужен переиспользуемый table-примитив для плотных списков/сводок без Tailwind и без product-state в UI Kit

## Результат
- `npx vitest run src/renderer/components/ui/table/Table.test.tsx` — 8/8 ✓
- `npm run typecheck` — ✓
- `npm run lint` — ✓
- Radix Table отсутствует в экосистеме: реализован нативный HTML table с shadcn composition API
