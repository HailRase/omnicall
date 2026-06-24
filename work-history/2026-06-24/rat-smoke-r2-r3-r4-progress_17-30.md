# RAT smoke R2+R3+R4 — PROGRESS update

**Дата:** 2026-06-24 17:30
**Статус:** выполнено
**Коммит:** `7899746`

## Где
- `docs/softphone/real-integration/PROGRESS.md`

## Что
- Обновлена таблица steps 03–05: smoke-колонки R2 pass, R3 partial, R4 pass
- Добавлена секция «Manual smoke session R2+R3+R4 — 2026-06-24» с таблицей PASS/pending
- Зафиксированы фиксы smoke: outbound `confirmed`, ringback 180/183, peer-connection defer, incoming `ensureJsSipRtcSessionPort`
- Tests: 551 passed, 1 skipped

## Зачем
Зафиксировать результаты manual smoke conductor и оставшиеся пункты R3-3, R3-5.

## Результат
PASS: R2-1/2/3, R3-1/2/4, R4-1/2. Pending: R3-3 reject, R3-5 DND. Следующий шаг smoke — R3-3.
