# RAT smoke R3-3/R3-5 close + commit

**Дата:** 2026-06-24 17:35
**Статус:** выполнено
**Коммит:** `98287f7`

## Где
- `docs/softphone/real-integration/PROGRESS.md`
- RAT adapter/orchestrator fixes (steps 03–05 smoke)

## Что
- PROGRESS: R3-3 reject PASS, R3-5 DND/486 PASS, R2+R3+R4 gate closed
- Commit+push: outbound answered bridge, incoming session wrap, media defer attach, smoke fixes
- Tests 551 pass, lint/typecheck green

## Зачем
Закрыть manual smoke R2–R4 перед step 06 OCP.

## Результат
R2+R3+R4 smoke complete on dev SBC. Next: RAT step 06 / R5 OCP.
