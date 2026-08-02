# F-034 WU-00 — Registry, ADR, handoff bootstrap

**Дата:** 2026-08-02 16:52
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/Feature-Registry.md` (F-034)
- `docs/softphone/TASK-QUEUE.md` (T-053)
- `docs/softphone/STATUS.md`
- `docs/softphone/handoffs/P15-Notification-Center-Master-Handoff.md`
- `docs/softphone/adr/ADR-0025-notification-center-preferences-policy.md`
- `notification-center/PROGRESS.md`, `09-DOCUMENTATION-SYNC.md`, `10-WORK-UNITS.md`

## Что
- Зарегистрирован F-034 (Settings, in-progress; extends LF-060 / F-029; non-overlap Call DND / ADR-0013)
- Добавлен T-053 claimed; ветка `feature/notification-center`; next WU-01
- Создан master handoff P15 с таблицей WU, compatibility law и non-regression
- ADR-0025 Proposed: CaptureService policy, default-preserving migration, module catalog, journal always-on, raise/OS boundaries
- PROGRESS: WU-00 → done; `npm run registry:check` 75/0

## Зачем
- Зафиксировать канонические docs и архитектурное решение до появления behavior-кода F-034

## Результат
- WU-00 закрыт; production `src/` не менялся; следующий шаг — WU-01
- Проверка: `npm run registry:check` — PASS (75 found, 0 missing)
