# SDK: observability резервирования статуса оператора

**Дата:** 2026-07-23 17:25
**Статус:** выполнено
**Коммит:** `55a97de`

## Где
- `axatalk-sdk/packages/protocol` — snapshot/event schemas + fixture
- `axatalk-sdk/packages/sdk` — `OperatorStatusChangeKind`, guide
- `src/application/integration/*` — assembler, event mapper, revision gate, product state
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `axatalk-sdk/docs/guide/operator-status-reservation.md`
- `axatalk-sdk-integration/evidence/DI-05-operator-reserved-observability.md`

## Что
- Добавлены аддитивные поля `reservedTarget` / `reservedReasonId` в snapshot и `operator:status-changed`
- Desktop проецирует локальный post-call reserve; маппит `OperatorStatusReservationSet`
- Revision gate advances при смене booking (даже если coarse остаётся `unknown`)
- `OperatorStatusChangeResult.kind` сужен до `"applied" | "reserved"`
- Документация и evidence синхронизированы; отдельная команда reserve **не** вводилась

## Зачем
- CRM/SDK должны видеть и восстанавливать резерв после reconnect без утечки OCP FSM и без нового wire-команды

## Результат
- Desktop vitest (48): PASS
- SDK operator/type tests: PASS
- `axatalk-sdk` `api:check` + `docs:check`: PASS (sdk surface 55 symbols)
- SemVer desktop не bump’или (additive Integration/protocol, без UX installer)
