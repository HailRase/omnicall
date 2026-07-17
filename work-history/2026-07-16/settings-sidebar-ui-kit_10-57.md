# Settings sidebar на UI Kit

**Дата:** 2026-07-16 10:57
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsSidebar.tsx`
- `src/renderer/components/settings/SettingsSidebar.module.css`
- `src/renderer/components/settings/SettingsSidebar.test.tsx`

## Что
- Заменён кастомный sidebar настроек на композицию UI Kit (`SidebarProvider`, `Sidebar`, `SidebarMenu`, `SidebarMenuSub`).
- Сохранены flyout-режим (56px rail + overlay 220px), вложенная группа Integrations → OCP Module, tooltips в collapsed.
- Добавлены settings-оверрайды CSS: absolute container, перенос длинных подписей, light/dark через semantic tokens.
- Обновлены тесты под Radix Tooltip вместо `IconTooltip`.

## Зачем
Унифицировать навигацию настроек с UI Kit Sidebar, сохранив прежнее UX-поведение и поддержку вложенных разделов.

## Результат
- `npx vitest run src/renderer/components/settings/SettingsSidebar.test.tsx` — 9/9 passed
- `npm run test` — 2085 passed, 1 skipped
- `npm run lint` — passed
- `npm run typecheck` — passed
