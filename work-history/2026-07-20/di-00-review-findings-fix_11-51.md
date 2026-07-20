# DI-00 review findings fix (High/Low)

**Дата:** 2026-07-20 11:51
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/Feature-Registry.md` (F-011 `callType`)
- `axatalk-sdk/docs/SECURITY.md` (`window.hide` vs ADR-0013)
- ADR-0009…0013, `axatalk-sdk-integration/evidence/DI-00-baseline.md`, handoff/STATUS/snapshot

## Что
- Low: F-011 Outputs → `callType: 'sdk'` (E-12 host остаётся `external`)
- Low: SECURITY.md — hide unavailable in v1 until tray ADR; active-call deny when later enabled
- High: коммит DI-00 ADR/evidence + раздельные SHA (code preflight vs docs)

## Зачем
Закрыть findings `/sdk-review` для DI-00.

## Результат
Findings сняты; docs commit SHA проставляется после коммита.
