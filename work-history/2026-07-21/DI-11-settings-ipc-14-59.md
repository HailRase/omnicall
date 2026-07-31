# DI-11 Settings IPC

**Дата:** 2026-07-21 14:59
**Статус:** не выполнено
**Коммит:** —

## Где
- `src/application/projections/settings`
- `src/shared/ipc`
- `src/main/sdk`
- `src/renderer/components/settings`
- `src/renderer/hooks`

## Что
- Добавлена отдельная SDK Settings section с pre-auth доступом.
- Обновлена модель IPC policy/snapshot под Origin trust entries.
- Удалён SDK enable toggle из панели и persistence payload.
- Gateway теперь игнорирует settings enable и подчиняется env kill-switch.
- Обновлены совместимые тестовые fixtures.

## Зачем
- Подготовить DI-11 Settings/AF-004/IPC переход на ADR-0018 без toggle enablement.

## Результат
- `npm run i18n:check` — успешно.
- `npx tsc --noEmit -p tsconfig.web.json` — успешно после правки fixtures.
- TOFU/activate consent modals, push IPC и полноценные origin mutation handlers ещё не реализованы.
