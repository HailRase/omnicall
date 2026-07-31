# Fix: activate не блокирует heartbeat ping

**Дата:** 2026-07-23 22:39
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewaySessionDispatch.ts`
- `src/shared/integration/sdkActivateTimeouts.ts`
- `src/adapters/integration/LocalWsServerAdapter.operator.test.ts`
- `docs/softphone/adr/ADR-0018-…`, `ADR-0016-…`, `Feature-Registry.md`
- `axatalk-sdk/docs/PROTOCOL.md`, `SECURITY.md`, `guide/saved-profile-activation.md`

## Что
- `account:activate-profile` отпускает per-connection inbound queue на время broker/consent hop
- Добавлен SSoT-хелпер `releasesSdkInboundQueueWhilePending`
- Тест: `sdk:ping` отвечает, пока activate ещё pending
- Документация синхронизирована (исключение из строгой сериализации только для activate hop)

## Зачем
- Пока оператор думает на модалке, CRM heartbeat `sdk:ping` не должен застревать и рвать сессию с голым `operation_failed`

## Результат
- focused vitest (timeouts + operator gateway) — OK
- auth-proof ordering (ADR-0016) не затронут — без downgrade
