# P11 transfer context parity

**Дата:** 2026-06-29 09:30
**Статус:** выполнено
**Коммит:** `ce9df60`

## Где
- `src/renderer/shells/call/CallContextShell.tsx`
- `src/renderer/shells/call/CallControlsShell.tsx`
- `src/renderer/components/call/TransferPanel.tsx`
- `src/renderer/components/call/TransferPanel.module.css`
- `src/renderer/components/call/TransferPanel.test.tsx`
- `src/renderer/components/call/TransferPanel.stories.tsx`

## Что
- Перенесён `TransferPanel` из `ControlsZone` в `ContextZone` через `CallContextShell`.
- В `CallControlsShell` скрыт `CallControlsBar` и `Dialpad` при активном transfer-режиме, сохранив поведение DTMF.
- `TransferPanel` переработан в пошаговый UI (шаги 1-4) с явным header step-chrome и карточками исходной/консультационной линий.
- Сохранены projection-driven disabled reasons и существующие callbacks (`onBlindTransfer`, `onStartConsultation`, `onAttendedTransfer`, `onCancelTransfer`).
- Добавлены Storybook-сценарии для `TransferPanel`, `Dialpad`, `CallSessionCard` (light/dark).
- Обновлены `Feature-Registry.md`, `STATUS.md`, `P11-Call-UI-Design-Parity-Handoff.md` и `UI-Component-Catalog.md`.

## Зачем
- Довести call UI до parity с reference flow: transfer должен быть отдельным режимом в context area, а не встроенным блоком в controls zone.
- Сделать перенос UI безопасным для архитектуры проекта (presentational components + shell wiring + projection-based reasons).

## Результат
- `npm run lint` — успешно.
- `npm run typecheck` — успешно.
- `npm run test` — успешно (781 passed, 1 skipped).
- `npm run ui:catalog` — успешно.
- `npm run ui:catalog:check` — ожидаемо возвращает diff для `docs/softphone/UI-Component-Catalog.md` до фиксации изменений в Git.
