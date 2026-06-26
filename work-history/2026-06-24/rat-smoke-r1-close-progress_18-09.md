# RAT smoke R1 close + reconnect UX + PROGRESS

**Дата:** 2026-06-24 18:09
**Статус:** выполнено
**Коммит:** `e986a13`

## Где
- `docs/softphone/real-integration/PROGRESS.md`
- Reconnect UX: `ConnectionRecoveryOrchestrationService`, `useReconnectCountdown`, `ConnectionOverlay`, recovery events

## Что
- PROGRESS: R1-3/4/5 PASS, R1+R2+R3+R4 gates closed, next step 06 OCP
- Reconnect overlay UX: attempt-started events, countdown tick, in-progress label
- Tests 558 pass; commit + push

## Зачем
Зафиксировать итог manual smoke и точку входа в step 06.

## Результат
Stopped at RAT step 06 (OCP WebSocket). All R1–R4 manual smoke PASS on dev SBC.
