# DI-05 — Read-only snapshot, events, window show

**Дата:** 2026-07-20 15:29
**Статус:** выполнено (unit → `review`, gate не закрыт)
**Коммит:** —

## Где
- `src/application/integration/` — snapshot assembler, event mapper, redaction, `ExternalSdkReadHandler`
- `src/adapters/integration/` — product dispatch, window handler, event fan-out, gateway routing
- `src/main/sdk/` — product surface wiring, publish-event IPC
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `axatalk-sdk-integration/evidence/DI-05-read-only-snapshot-events-window-show.md`

## Что
- Реализован redacted `sdk:get-snapshot` через broker + merge session/window в main
- Per-client event fan-out (без broadcast); revoke останавливает доставку
- `window:show` / `window:get-state` в main с rate limit
- Adversarial/privacy тесты + полный `npm test` 2402/1 skipped
- F-011 остаётся `in progress`; версия `0.11.2` не менялась; DI-05 → `review`

## Зачем
- Открыть read-only product surface поверх DI-04 auth без мутаций call/operator/account (DI-06+)

## Результат
- Verification: focused suites green; `npm test` 2402 passed / 1 skipped; lint/typecheck/`registry:check` PASS
- Запрошен `/sdk-review` for DI-05 only; DI-06 не начат
