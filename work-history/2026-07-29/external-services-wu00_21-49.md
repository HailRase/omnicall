# F-031 WU-00 — Registry, ADR, handoff bootstrap

**Дата:** 2026-07-29 21:49
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/Feature-Registry.md` (F-031)
- `docs/softphone/TASK-QUEUE.md` (T-052)
- `docs/softphone/STATUS.md`
- `docs/softphone/handoffs/P14-External-Services-Master-Handoff.md`
- `docs/softphone/adr/ADR-0022-external-services-http-isolation.md`
- `external-services-plan/PROGRESS.md`, `10-WORK-UNITS.md`, `09-DOCUMENTATION-SYNC.md`

## Что
- Зарегистрирован F-031 (Integration, in-progress, без LF; явное разделение с F-011/F-028)
- Добавлен T-052 claimed; ветка `feature/external-services`; next WU-01
- Создан master handoff P14 с таблицей WU и non-regression
- ADR-0022 Proposed: main HTTP, concurrency 3, focus, lifecycle, redirects/limits
- PROGRESS: WU-00 → done; `npm run registry:check` 75/0

## Зачем
- Зафиксировать канонические docs и архитектурное решение до появления behavior-кода F-031

## Результат
- WU-00 закрыт; production `src/` не менялся; следующий шаг — WU-01
- Проверка: `npm run registry:check` — PASS (75 found, 0 missing)
