# T-008 Phase 0 — ADR + Registry + UX spec

**Дата:** 2026-07-02 13:42
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/adr/ADR-0004-sip-session-health.md`
- `docs/softphone/Feature-Registry.md` (F-001, F-014, F-016)
- `docs/softphone/Legacy-Feature-Coverage.md` (LF-057, LF-009)
- `docs/softphone/Icon-Registry.md`, `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md` §12

## Что
- Принят ADR-0004: ортогональность transport/registration, SipSessionHealth, pipeline восстановления, UI-контракт
- Обновлены acceptance criteria F-001, F-014, F-016 под T-008 (status → in-progress)
- LF-057 помечен superseded; LF-009 cancelled
- Добавлена иконка `settings.system-state` (Gauge, planned) в registry и catalog
- §12 Progress: Phase 0 закрыта

## Зачем
Design gate перед реализацией рефакторинга transport/register state (T-008); фиксация продуктового контракта и границ SIP-only без OCP.

## Результат
Phase 0 complete. `npm run typecheck` — green. Production logic не менялась.
