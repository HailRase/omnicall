# SDK-01 — Protocol and security ADRs

**Дата:** 2026-07-20 12:16
**Статус:** выполнено (`/sdk-review` PASS; SDK-01 `done`)
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0014` … `ADR-0017`
- `docs/softphone/adr/ADR-0010` / `0011` / `0012` (closed O-* pointers)
- `axatalk-sdk/docs/PROTOCOL.md`, `COMPATIBILITY-FIXTURES.md`, `SECURITY.md`, `WORK-UNITS.md`
- `axatalk-sdk/evidence/SDK-01-protocol-adrs.md`, `SDK-01-browser-spike.md`
- P12 handoff, Feature Registry F-011, STATUS, integration README pointers

## Что
- Закрыты все PROTOCOL O-* через ADR-0014…0017 (Zod, discovery/LNA, PoP/profiles, PII/ownership/OCP/deprecation)
- Browser feasibility spike (doc-only) для HTTPS→loopback
- Формат shared fixtures зафиксирован; Zod не устанавливался (SDK-02)
- Desktop `src/` и product API не трогались; SDK-02 не начинался

## Зачем
Заморозить protocol/security decisions до реализации `@axata/axatalk-protocol` и DI-01.

## Результат
- `cd axatalk-sdk && npm run preflight` → PASS
- Статус WU: `review`; нужен независимый `/sdk-review`
