# Settings: UI Kit Tabs for profile selector

**Дата:** 2026-07-06 23:38
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/SavedAccountProfileSelector.tsx`
- `src/renderer/components/account/SavedAccountProfileSelector.module.css`
- `src/renderer/components/account/SavedAccountProfileSelector.test.tsx`

## Что
- Заменён кастомный `role="tablist"` на UI Kit `Tabs` / `TabsList` / `TabsTrigger`
- Удалены ручные обработчики клавиатуры и ref-фокус; навигация через Radix
- CSS упрощён: layout-оверрайды для списка профилей, стили табов — из UI Kit
- Тесты переведены на `userEvent` (совместимость с Radix Tabs)

## Зачем
Миграция табов настроек аккаунта на единый UI Kit примитив для консистентности a11y и визуала.

## Результат
- `npm run test` — 1461 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- Других кастомных tablist в settings не найдено (sidebar — nav rail)
