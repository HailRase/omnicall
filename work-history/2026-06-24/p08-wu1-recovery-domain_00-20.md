# P08 WU1 — Recovery Domain Foundation

**Дата:** 2026-06-24 00:20
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P08-Recovery-UX-Design.md`
- `docs/softphone/handoffs/P08-WU1-Recovery-Domain-Handoff.md`
- `src/domain/shared/recovery/ReconnectPolicy.ts`
- `src/domain/operator/events/ocpRecoveryEvents.ts`, `serverTerminateEvents.ts`
- `src/domain/telephony/events/sipRecoveryEvents.ts`
- `src/application/projections/connectionRecoveryProjection.ts`
- `src/ports/telephony/TelephonyGateway.ts`, `src/ports/operator/OperatorPlatformGateway.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`

## Что
- UX-дизайн overlay восстановления (LF-057) до кода; зарезервированы test IDs
- `ReconnectPolicy` с пресетами OCP (6×5s) и SIP (backoff + jitter)
- Domain events: OCP/SIP reconnect + `ServerTerminateReceived`
- Скелет `connectionRecoveryProjection` и wire в store
- Port hooks `setTransportDisconnectedHandler` + mock stubs
- F-014 → `in_progress`; обновлены Feature Registry и Legacy Coverage

## Зачем
Заложить domain/application фундамент Phase 08 (F-014) для явной политики reconnect и наблюдаемых recovery events без UI и scheduler (WU2+).

## Результат
- `npm run test` — 451 passed (424 + 27)
- `npm run lint` — ok
- `npm run typecheck` — ok
- WU1 gate закрыт; overlay UI не реализован (WU3)
