# F-032 switch preview row layout

**Дата:** 2026-08-03 14:18
**Статус:** выполнено
**Коммит:** `02debeb`

## Где
- `src/renderer/components/settings/external-applications/WindowBehaviorSwitchPreview.module.css`
- `src/renderer/components/settings/external-applications/WindowBehaviorSwitchRow.tsx`
- `src/renderer/components/settings/external-applications/ExternalApplicationsWindowBehavior.tsx`

## Что
- Raise / always-on-top: две card-like items в `grid` 2 колонки (как openMode)
- Вертикальный стек: switch+title → description → preview

## Зачем
- Единый layout с «Способ открытия»

## Результат
- `npx vitest run …/ExternalApplicationsPanel.test.tsx` — ожидание 9/9
