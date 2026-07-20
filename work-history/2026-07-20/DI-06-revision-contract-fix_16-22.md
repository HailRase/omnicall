# DI-06 revision contract fix

**Дата:** 2026-07-20 16:22
**Статус:** выполнено
**Коммит:** `6681118`

## Где
- `src/application/integration/SdkSessionRevisionClock.ts`
- `src/application/integration/ExternalSdkCallHandler.ts` (+ tests)
- `src/application/integration/ExternalSdkReadHandler.ts`
- `src/application/integration/SdkCallOwnershipRegistry.ts`
- `axatalk-sdk-integration/evidence/DI-06-call-command-router.md`
- STATUS / Feature-Registry / P12 handoff / WORK-UNITS

## Что
- Mutations: `advance()` возвращает post-advance `reply.revision` (= следующий `expectedRevision`)
- Reads (`get-snapshot` / `ping`): `peek()` без advance
- Удалён мёртвый per-call `bumpCallRevision`
- Тесты: reply-chain originate→hold; snapshot→originate; concurrent → stale
- DI-06 закрыт `done`; counts 81 focused / 2428 full / registry 73/0

## Зачем
- Закрыть High FAIL `/sdk-review` по контракту revision для reply/snapshot-driven клиента

## Результат
- `npm test` 2428 passed / 1 skipped; lint PASS; typecheck PASS; registry 73/0
