# SDK-05 Read-Only Beta API — implementation → review

**Дата:** 2026-07-20 22:17
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.ts`
- `axatalk-sdk/packages/sdk/src/internal/product-*`, `event-subscription.ts`, `snapshot-cache.ts`, `public-event-map.ts`, `client-errors.ts`
- `axatalk-sdk/evidence/SDK-05-read-only-beta-api.md`
- `axatalk-sdk/docs/WORK-UNITS.md` (SDK-05 → `review`)

## Что
- Реализован `createAxatalkClient`: lifecycle, getSnapshot, typed subscribe, sequence-gap resync, reconnect cache replace, window.show/getState
- Fail-closed pre-ready / missing capabilities; нет call/operator/account mutations и window.hide
- Тесты unit + DI-05 fixture parity + Chromium browser; api-check allowlist 37 symbols
- Закрыты Blocker'ы прошлого `/sdk-review` (не было реализации/evidence/status review)

## Зачем
- Устранить hard-stop FAIL SDK-05 и подать юнит на независимый gate

## Результат
- SDK-05 `review`. Counts: sdk src **45**, workspace **53**, types **5**, browser **4**, api **37**. `npm run preflight` PASS. F-011 in progress; DI-10 still blocked on SDK-06…09. Next: `/sdk-review` SDK-05 only.
