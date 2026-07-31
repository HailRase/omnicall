# /sdk-review SDK-06 Call Control API

**Дата:** 2026-07-20 22:51
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/docs/WORK-UNITS.md`
- `axatalk-sdk/evidence/SDK-06-call-control-api.md`
- `axatalk-sdk-integration/WORK-UNITS.md`, `00-SNAPSHOT.md`, `evidence/DI-10-blocker-sdk-prereqs.md`
- `docs/softphone/Feature-Registry.md` (F-011 still in progress)

## Что
- Независимый gate-review SDK-06: публичный `client.calls.*`, матрица команд, reconnect non-replay, disconnect-no-hangup
- Перепрогон: sdk src 66, workspace 74, types 5, browser 5, api 39, desktop oracle 17 — совпали с evidence
- SDK-06 → `done`; DI-10 остаётся `blocked` на SDK-07…09; F-011 не `implemented`
- Production-код SDK/desktop не менялся (только статусы/evidence)

## Зачем
- Закрыть review-gate Call Control API перед SDK-07

## Результат
- Verdict: PASS; zero Blockers; Low: нет unit на malformed callId → invalid_payload
- Next: `/sdk-project` SDK-07 only (отдельная сессия)
