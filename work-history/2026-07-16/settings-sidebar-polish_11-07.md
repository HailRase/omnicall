# Полировка стилей settings sidebar

**Дата:** 2026-07-16 11:07
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsSidebar.tsx`
- `src/renderer/components/settings/SettingsSidebar.module.css`

## Что
- Иконки уменьшены до 16px (children 14px), убран `size="lg"` у menu buttons.
- Компактная типографика (13px / 12px), accent-bar у активного пункта, ghost toggle 32px.
- Вложенные пункты: иконка + pill-row, мягкий indent, акцент на active child.
- Rail 48px, flyout 248px — плотнее и ближе к shadcn/SPA-паттерну.

## Зачем
Убрать «громоздкий» вид после миграции на UI Kit: огромные иконки и неаккуратные children.

## Результат
- `SettingsSidebar.test.tsx` — 9/9 passed
- `npm run lint` + `npm run typecheck` — passed
