# OCP status selector: server-driven label + call statuses

**Дата:** 2026-07-19 14:29
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/widgets/OperatorStatusSelector/*`
- `src/renderer/components/integration/ocp/OcpStatusDropdown.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- Убран optimistic click override: chip ждёт `users` projection
- Dropdown: Ready → Separator → Break без «Текущий» и group labels
- Idle Ready/Break: reason («Доступен»); system RINGING/TALKING: fallback на statusLabelKey
- Убран sticky previous reason во время звонка
- Канонические RU-лейблы: READY→«Доступен», RINGING→«Звонок», TALKING→«Разговор» (без «Готов»/«Входящий»)

## Зачем
Chip должен отражать серверный статус (в т.ч. Звонок/Разговор) и reason «Доступен», а не устаревший «Готов»/sticky reason.

## Результат
- Фокусные тесты селектора green; `i18n:check` + `typecheck` green
- TASK-QUEUE T-045 done; Feature Registry F-028 evidence обновлён
