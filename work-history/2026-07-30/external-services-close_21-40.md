# F-031 WU-12 documentation close and preflight

**Дата:** 2026-07-30 21:40
**Статус:** выполнено
**Коммит:** —

## Где
- `external-services-plan/` (PROGRESS, 11-ACCEPTANCE, 09/10)
- `docs/softphone/` (Feature-Registry, STATUS, TASK-QUEUE, P14 handoff, I18N, F-030 design)
- `src/**/external-services*` (v13 fixtures, DelayScheduler tests, lint fixes)

## Что
- Закрыты WU-13/WU-12 в PROGRESS; acceptance audited с residual hook-size.
- Исправлены v13 trigger fixtures/тесты/lint (`no-unsafe-return`, Queue refresh).
- Синхронизированы registry→implemented, T-052 done, STATUS/handoff/I18N/F-030.
- SemVer: MINOR `1.1.2`→`1.2.0` отложен до явного ship authorization.

## Зачем
- F-031 не считается завершённым без согласованных docs/gates и решения по релизу.

## Результат
- `npm run test` 2886 passed / 1 skipped; `typecheck`/`lint`/`i18n:check`/`ui:catalog`/`registry:check` PASS.
- Следующий шаг: `/review` для F-031.
