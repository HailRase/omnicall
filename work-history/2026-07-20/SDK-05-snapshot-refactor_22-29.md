# SDK-05 getSnapshot refactor

**Дата:** 2026-07-20 22:29
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/sdk/src/internal/product-orchestrator.ts`
- `axatalk-sdk/packages/sdk/src/internal/snapshot-acquisition.ts`
- `axatalk-sdk/packages/sdk/src/internal/product-commands.ts`
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.test.ts`
- `axatalk-sdk/evidence/SDK-05-read-only-beta-api.md`
- `axatalk-sdk/docs/WORK-UNITS.md`

## Что
- Revision-bound `getSnapshot`: успех только при `cache.revision === reply.revision`
- `invalidate`/disconnect отклоняет pending acquisitions typed-ошибкой (нет hang)
- `readWindowState` fail-closed на non-boolean `visible`
- Adversarial unit-тесты (reply-only + disconnect, mismatch/timeout, late match)
- Evidence/WORK-UNITS → `review` для `/sdk-review` SDK-05

## Зачем
Закрыть FAIL `/sdk-review` по hang waiters и stale-cache fail-open без расширения в SDK-06.

## Результат
Verification PASS: sdk src 51, types 5, browser 4, api 37, preflight PASS; auth regression green. Статус SDK-05 = `review` (не `done`).
