# SDK-02 High/Low fix + commit

**Дата:** 2026-07-20 12:44
**Статус:** выполнено
**Коммит:** `a0cc016`

## Где
- `axatalk-sdk/packages/protocol/`
- `axatalk-sdk/docs/WORK-UNITS.md`, `evidence/SDK-02-protocol-package.md`
- `docs/softphone/STATUS.md`

## Что
- High: `CapabilityIdListSchema` в `sdk:permission-changed`; `WireJsonObjectSchema` для reply/error maps
- Low: `@public` на constants; strip unknown-key fixture/test; доп. event/reply fixtures
- preflight PASS; статус SDK-02 `done`

## Зачем
- Закрыть findings `/sdk-review` перед SDK-03 / DI-01

## Результат
- protocol unit 8 + type 3; workspace preflight PASS
