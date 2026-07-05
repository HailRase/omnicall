# Audit doc sync F-022

**Дата:** 2026-07-05 23:56
**Статус:** выполнено
**Коммит:** `2400865`

## Где
- `CHANGELOG.md`
- `docs/softphone/STATUS.md`
- `docs/softphone/Legacy-Feature-Coverage.md`
- `docs/softphone/P11-Codec-Preferences-Design.md`
- `docs/softphone/TASK-QUEUE.md`

## Что
- CHANGELOG `[Unreleased]`: F-022 Added/Changed/Fixed; footer links `v0.1.3`
- STATUS: 1112 tests, LF-084 закрыт, release train 0.1.3, next cut 0.2.0
- Legacy LF-084: implemented с evidence paths
- P11 design: incoming fire-and-forget vs answer await — согласовано с кодом
- TASK-QUEUE: updated 2026-07-05, T-009/T-010 closed dates

## Зачем
Закрыть High/Low findings holistic `/audit` F-022 без release cut.

## Результат
- `npm run registry:check`, `test` (1112 passed), `lint`, `typecheck` — OK
