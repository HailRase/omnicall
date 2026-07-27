# Документация window.hide как product-available

**Дата:** 2026-07-27 11:10
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0016-*.md`, `UX-UI-Design-Blueprint.md`, `handoffs/P12-*.md`
- `axatalk-sdk-integration/{SMOKE-CHECKLIST,TEST-MATRIX,IMPLEMENTATION-PLAN,WORK-UNITS,AGENTS}.md`
- `axatalk-sdk-integration/evidence/*` (superseded notes + DEMO prompt)
- `axatalk-sdk/docs/guide/{README,pairing-quick-start,errors}.md`, `CONSUMER-SMOKE-CHECKLIST.md`
- `axatalk-sdk/{evidence,packages/*/CHANGELOG,docs/WORK-UNITS}.md`

## Что
- Убраны актуальные формулировки «window.hide unavailable / do not enable»
- Исторические evidence помечены superseded 2026-07-27 → DI-05-window-hide-product
- Guides/smoke: hide recipe (matrix grant, conflict busy, tray recovery)
- CHANGELOG protocol/sdk: hide product-available

## Зачем
- После ADR-0013 amendment документация не должна вводить агентов и интеграторов в заблуждение.

## Результат
- Docs-only; runtime не менялся
- Grep по «Do not enable window.hide» / «must stay unavailable» в каноне — очищен
