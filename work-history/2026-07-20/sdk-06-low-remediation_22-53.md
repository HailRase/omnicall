# SDK-06 Low remediation + commit prep

**Дата:** 2026-07-20 22:53
**Статус:** выполнено
**Коммит:** `2da212b`

## Где
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.calls.test.ts`
- `axatalk-sdk/packages/sdk/src/internal/auth-test-peer.ts`
- `axatalk-sdk/evidence/SDK-06-call-control-api.md`
- `axatalk-sdk/docs/WORK-UNITS.md`

## Что
- Добавлен `replyCallSuccessMalformed` и тест `fails closed when success reply omits callId`
- Evidence/WORK-UNITS: Low закрыт; counts sdk src **67**, workspace **75**

## Зачем
- Закрыть единственный reviewer Low после `/sdk-review` PASS SDK-06

## Результат
- vitest sdk src: 67 passed; workspace: 75 passed
