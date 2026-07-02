# T-008 Phase 4 — Projections

**Дата:** 2026-07-02 14:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/sipSessionHealthProjection.ts` (+ test)
- `src/application/projections/deriveSipStatusShell.ts` (+ test)
- `src/application/projections/deriveSipSystemStateShell.ts` (+ test)
- `src/renderer/stores/useAccountBootstrapStore.ts`
- `src/application/index.ts`
- `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md` §12

## Что
- Редьюсер `sipSessionHealthProjection` — единая read-model transport/registration/recovery из ADR-0004 событий
- `deriveSipStatusShell` — header VM: dot + русская метка + суффикс таймера (все строки §1.2)
- `deriveSipSystemStateShell` — settings VM: оси состояния, сводка, disabled-reasons для ручных действий (SIP-only, без OCP)
- Подписка `sipSessionHealthProjection` в `useAccountBootstrapStore`
- Экспорты в `@application/index.ts`
- §12 Progress: Phase 4 → done

## Зачем
Закрыть Phase 4 плана T-008: read models для header и панели «Состояние системы» до UI-фаз 5–6.

## Результат
- `npm run test` — 1013 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- Следующая фаза: Phase 5 — UI removal (`/ui`)
