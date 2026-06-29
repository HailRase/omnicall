# Post-WU5 doc sync + orphan cleanup

**Дата:** 2026-06-29 14:12
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/STATUS.md`
- `docs/softphone/handoffs/P11-Post-WU5-Shell-Polish-Handoff.md`
- `docs/softphone/Feature-Registry.md`, `Legacy-Feature-Coverage.md`, `TASK-QUEUE.md`
- `docs/softphone/UI-Component-Catalog.md` (regenerated)
- Удалены: `ActiveCallQuickBar*`, `CallSessionTab*`, `CallSessionTabs*`

## Что
- STATUS: 792 tests, T-007 в таблице P11, LF-009 recovery UI в backlog, убраны устаревшие blocker/high из review
- Post-WU5 handoff: gate checkboxes пересмотрены под Call UI parity; avatar ring deferred; test count 792
- Удалены orphan-компоненты, заменённые `CallControlsBar` и `CallSessionCard`/`Stack`
- Feature Registry + Legacy LF-009: interim `control-reregister-sip`, avatar UI deferred

## Зачем
Синхронизировать документацию с фактической реализацией после Call UI parity; recovery ring будет другим UX.

## Результат
`npm run test` — 792 passed, 1 skipped; `npm run ui:catalog` — OK (57 components)
