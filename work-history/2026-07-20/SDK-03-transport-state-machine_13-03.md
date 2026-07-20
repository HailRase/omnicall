# SDK-03 — Transport and connection state machine

**Дата:** 2026-07-20 13:03
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/sdk/src/internal/`
- `axatalk-sdk/docs/WORK-UNITS.md`
- `axatalk-sdk/evidence/SDK-03-transport-state-machine.md`

## Что
- Внутренний `TransportPort` + детерминированный `FakeTransport` (без реального WebSocket)
- Явная connection state machine по ARCHITECTURE.md
- Корреляция request/reply, timeout/abort/disconnect cleanup
- Heartbeat + bounded jittered reconnect; мутации не переигрываются
- Redaction-safe diagnostics; публичная поверхность `@axatalk/sdk` пустая

## Зачем
Реализовать SDK-03: механика транспорта и жизненного цикла соединения до pairing/auth (SDK-04) и публичного клиента (SDK-05).

## Результат
- `npx vitest run packages/sdk/src` — PASS
- `npm run lint` — PASS
- `npm run preflight` — PASS (`api:check` — пустой sdk surface)
- Статус WU: `review`; нужен `/sdk-review` только для SDK-03
