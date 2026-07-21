# ADR-0018 / DI-11 Low polish (post re-gate)

**Дата:** 2026-07-21 14:19
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/docs/SECURITY.md`
- `axatalk-sdk-integration/WORK-UNITS.md` (DI-11)
- `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md`
- `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`

## Что
- L-SEC-1: pending activate → primary `conflict` (+ optional `activate_consent_pending`)
- L-WU-1/2: DI-11 checklist add/edit while denied; agent prompt includes `conflict`
- L-ADR13: ADR-0013 §B.3 — capability AND every-activate consent (не and/or)
- L-P12-1: Architecture Gate — F-011 не раньше DI-10 **and** DI-11 (или waiver)

## Зачем
Закрыть Low из `/sdk-review` re-gate ADR-0018 / DI-11 planning после PASS WITH LOWS.

## Результат
Docs-only; `src/` не тронут; F-011 / DI-11 остаются незакрытыми. Готово к повторному docs re-gate при необходимости.
