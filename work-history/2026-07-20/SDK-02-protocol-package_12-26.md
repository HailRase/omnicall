# SDK-02 — @axatalk/protocol

**Дата:** 2026-07-20 12:26
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/protocol/`
- `axatalk-sdk/packages/protocol/fixtures/`
- `axatalk-sdk/docs/WORK-UNITS.md`, `DEPENDENCIES.md`, `PROTOCOL.md`
- `axatalk-sdk/evidence/SDK-02-protocol-package.md`
- `axatalk-sdk/etc/api/protocol.api.md`
- `axatalk-sdk/scripts/api-check.mjs`

## Что
- Установлен и зафиксирован `zod@4.4.3` только в `@axatalk/protocol`; размер gzip записан в DEPENDENCIES.md
- Реализованы runtime-схемы discovery/handshake/pairing/auth/commands/replies/events/snapshot + safe validate
- Добавлены golden fixtures valid/invalid/meta и unit/type tests
- Compatibility/policy helpers; `api:check` разрешает protocol surface без AxatalkClient
- SDK-02 переведён в `review`; DI-01 consume contract задокументирован без фейка desktop evidence

## Зачем
Закрыть SDK-02: единый runtime source of truth протокола v1 для SDK и будущего DI-01.

## Результат
`npm run preflight` в `axatalk-sdk` — PASS. Ожидает независимого `/sdk-review`. Desktop `src/` не менялся; DI-01 по-прежнему pending.
