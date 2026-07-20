# DI-10 — Compatibility, E2E, and P12 Close

**Дата:** 2026-07-21 00:13
**Статус:** выполнено (handoff → `/sdk-review`; F-011/P12 намеренно не закрыты)
**Коммит:** —

## Где
- `src/adapters/integration/LocalWsServerAdapter.compat.test.ts`
- `axatalk-sdk-integration/scripts/di10-*.mjs` / `di10-browser-smoke-page.html`
- `axatalk-sdk-integration/evidence/DI-10-compatibility-e2e-p12-close.md`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`, `handoffs/P12-*.md`
- `axatalk-sdk-integration/WORK-UNITS.md`, `SMOKE-CHECKLIST.md`

## Что
- Intake DI-10: prerequisites закрыты; статус `in progress` → `review`
- Добавлен fortress-тест `incompatible_version` / current↔current / start-denial
- Собран packaged `Axatalk-0.11.2` (win-unpacked / NSIS / MSI)
- Прогнан packaged + Edge smoke (discovery, hostile Origin, incompat, handshake)
- F-011 / LF / P12 **не** закрыты — оставшиеся OPEN cells честно зафиксированы
- SemVer остаётся `0.11.2`; SDK API 47/169 без изменений

## Зачем
Закрыть desktop-гейт SDK-10 Mode A (packaged E2E + матрицы) без фальшивого PASS и без ослабления security policy.

## Результат
- `npm run release:preflight` PASS (2499 passed / 1 skipped)
- SDK `api:check` / `preflight` PASS (47/169)
- Packaged+Edge handshake/hostile subset PASS; pair/revoke/call/SIP — OPEN
- Запрошен `/sdk-review` DI-10 only
