# SDK-06 — Call Control API

**Дата:** 2026-07-20 22:42
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.ts`
- `axatalk-sdk/packages/sdk/src/internal/call-wire.ts`
- `axatalk-sdk/packages/sdk/src/internal/call-commands.ts`
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.calls.test.ts`
- `axatalk-sdk/evidence/SDK-06-call-control-api.md`
- `axatalk-sdk/docs/WORK-UNITS.md`

## Что
- Добавлен namespaced API `client.calls.*` для полного v1 набора call-команд
- Capability fail-closed (`call.originate` / `call.control`), явный `expectedRevision`, typed errors
- Доказаны reconnect non-replay и disconnect-без-hangup
- Обновлены api-check (39 символов), browser-тест, evidence; статус SDK-06 → `review`

## Зачем
- Закрыть SDK-06 как protocol consumer поверх DI-06 без второго softphone и без разблокировки DI-10

## Результат
- `npx vitest run packages/sdk/src` — 66 passed
- `npm run preflight` — PASS (workspace 74)
- `AXATALK_SDK_BROWSER=1 npm run test:browser` — 5 passed
- `npm run api:check` — PASS (39)
- Handoff: `/sdk-review` SDK-06 only
