# Tabs: content-width triggers

**Дата:** 2026-07-06 23:46
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/tabs/Tabs.module.css`
- `src/renderer/components/account/SavedAccountProfileSelector.module.css`

## Что
- UI Kit `.trigger`: `flex: 1 1 auto` → `flex: 0 0 auto` (ширина по контенту)
- Селектор профилей: `.tablist` `width: 100%` → `width: fit-content`, убран `flex: 1`
- `.tabs-root`: `flex: 0 1 auto` + `max-width: 100%` вместо растягивания на всю строку

## Зачем
Один таб (или группа табов) не должен растягиваться на всю ширину контейнера.

## Результат
- `npm run test` (Tabs + SavedAccountProfileSelector) — 15 passed
- `npm run lint` — ok
