# ADR-0018 / AF-004 docs hygiene (H1/H2 + Lows)

**Дата:** 2026-07-21 14:09
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-AF-004-settings-authorization-gate.md`
- `docs/softphone/adr/ADR-0018-sdk-origin-tofu-blacklist-activate-consent.md`
- `docs/softphone/adr/ADR-0015-sdk-discovery-and-browser-lna-policy.md`
- `axatalk-sdk/docs/SECURITY.md`
- `axatalk-sdk/docs/PROTOCOL.md`
- `axatalk-sdk/docs/guide/capabilities.md`
- `axatalk-sdk-integration/IMPLEMENTATION-PLAN.md`
- `axatalk-sdk-integration/evidence/DI-11-origin-tofu-blacklist-activate-planning.md`

## Что
- H1: ADR-AF-004 Decision §1 — pre-auth Account + Axatalk SDK (не «только Account»)
- H2: ADR-0018 — при `denied` matrix read-only; Unblock без скобки «edits while blocked»
- Primary pending activate = `conflict` (+ optional `activate_consent_pending`)
- Lows: SECURITY always-on/kill-switch; ADR-0015 trust-store wording; capabilities TTL vs consent; IMPLEMENTATION-PLAN Gate DI-10+DI-11; planning evidence sync

## Зачем
Закрыть High dual-SoT из независимого `/sdk-review` пакета ADR-0018 / DI-11 planning после freeze.

## Результат
Docs-only; `src/` не тронут; F-011 / DI-11 остаются незакрытыми. Готово к `/sdk-review` re-gate по docs.
