# Удаление компонента AuthStateView

**Дата:** 2026-06-29 10:22
**Статус:** выполнено
**Коммит:** —

## Где
- удалены `src/renderer/components/auth/AuthStateView.tsx`, `AuthStateView.module.css`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/Feature-Registry.md`, `UI-Component-Catalog.md`

## Что
- Убран рендер `AuthStateView` из context-зоны `SoftphoneReadyShell`
- Удалены файлы компонента и его CSS module
- Обновлён F-016: нет auth status panel в context zone
- Перегенерирован UI catalog (61 компонент)

## Зачем
Компонент больше не нужен — auth/recovery статусы показываются через header, avatar ring и settings.

## Результат
- `npm run ui:catalog` — ok
- `npm run test` — 781 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
