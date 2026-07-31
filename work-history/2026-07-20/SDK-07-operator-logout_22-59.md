# SDK-07 — Operator and Logout Workflows

**Дата:** 2026-07-20 23:15
**Статус:** выполнено
**Коммит:** `b5f6227`

## Где
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.ts`, `axatalk-client-api.ts`
- `axatalk-sdk/packages/sdk/src/internal/operator-*.ts`, `account-logout-*.ts`, `window-commands.ts`, `product-orchestrator.ts`, `client-errors.ts`
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.operator.test.ts`
- `axatalk-sdk/tests/browser/axatalk-client-operator.browser.test.ts`
- `axatalk-sdk/evidence/SDK-07-operator-logout-workflows.md`
- `axatalk-sdk/docs/WORK-UNITS.md`, `docs/softphone/Feature-Registry.md`, DI-10 blocker notes

## Что
- Публичные namespaces `client.operator.*` и `client.account.*` (prepare/confirm logout) поверх DI-07
- Capability fail-closed, typed `interaction_required` (+ `details`), SIP-only матрица
- Reconnect non-replay и disconnect без confirm-logout / hangup
- `/sdk-review` PASS; Low (operator `conflict`) закрыт dedicated-тестом
- api-check / package-check / browser / preflight; desktop product `src/` не трогали

## Зачем
- Закрыть SDK-07 как честный protocol consumer operator/logout без OCP wire и без activate/hide

## Результат
- SDK-07 → `done`; post-fix counts: sdk src **88**, workspace **96**, types **6**, browser **6**, api **46**, desktop oracle **33**
- F-011 остаётся `in progress`; DI-10 blocked на SDK-08…09
- Следующий шаг: `/sdk-project` SDK-08 only
