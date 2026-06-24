# RAT Step 00 — Branch & Guardrails

**Дата:** 2026-06-24 09:27
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/Feature-Registry.md` — F-001, F-002, F-003, F-009
- `docs/softphone/real-integration/PROGRESS.md`

## Что
- Добавлены Real Adapter Track notes (`in_progress`, branch feature/real-adapters, ADR-0001) для F-001 (R1), F-002/F-003 (R3), F-009 (R5)
- PROGRESS: step 00 → done, 488 tests, smoke n/a
- Runtime (`src/`) не изменён

## Зачем
Закрыть gate step 00: зафиксировать статус real-track в registry без изменения mock/CI baseline.

## Результат
- `npm run test` — 488 passed
- `npm run lint` — ok
- `npm run typecheck` — ok
- Коммит не создан (ожидает явного запроса пользователя)
