# RAT step 07 snapshot — commit and push

**Дата:** 2026-06-24 23:55
**Статус:** выполнено
**Коммит:** `bc0bd29`

## Где
- `src/adapters/telephony/jssip/` — REFER transfer, buildBlindReferTarget, executeJsSipRefer
- `src/application/projections/` — transfer failure recovery
- `docs/softphone/adr/ADR-0003-sbc-refer-semantics.md`
- `docs/softphone/real-integration/PROGRESS.md`, `SMOKE-CHECKLIST.md`
- `docs/softphone/OCP-PLUGIN-BACKLOG.md`, ADR-0002
- `src/adapters/operator/` — dormant OCP WS (step 06)

## Что
- Зафиксирован RAT step 07: blind/attended transfer через JsSIP REFER
- Recovery после CallTransferFailed в multi-line projection; NOTIFY 487 mapping
- buildBlindReferTarget + refer lifecycle (referInFlightCallIds)
- ADR-0003, step-07b prompt; PROGRESS/SMOKE с матрицей A–D
- OCP deferred (ADR-0002); step 06 код без product gate
- 599 tests passed, 1 skipped

## Зачем
Пользователь запросил зафиксировать текущий этап после неуспешного external blind transfer (B,C) и запушить ветку.

## Результат
- On-net blind transfer: PASS (A,D)
- Off-net blind transfer: FAIL (B,C) — blocker для R6 gate
- `npm run test` 599 passed; lint/typecheck green
- Коммит + push на `feature/real-adapters`
