# P04 phase gate closure

**Дата:** 2026-06-23 21:10
**Статус:** выполнено
**Коммит:** `16612f3`

## Где
- `docs/softphone/handoffs/P04-Active-Call-Controls-Handoff.md`
- `docs/softphone/P04-Active-Call-Controls-UX-Design.md`
- `docs/softphone/Feature-Registry.md`
- `src/application/projections/activeCallControlsProjection.ts`
- `src/application/use-cases/ActiveCallControlsUseCases.test.ts`
- `src/application/services/CallEngine.test.ts`
- `src/renderer/components/call/ActiveCallControlsPanel.test.tsx`

## Что
- Создан P04 handoff с migration evidence для LF-022, LF-024, LF-027
- UX doc синхронизирован: `ActiveCallControlFailed`, hangup semantics, test IDs error/retry
- Feature Registry F-004/F-005: test coverage уточнён
- `parseActiveCallControlOperation`: strict narrowing, invalid payload не мутирует `lastOperationError`
- Тесты: use case hold failure + `ActiveCallControlFailed`, hold failure event assert в CallEngine, keyboard Enter/Space, invalid operation projection

## Зачем
Формально закрыть phase gate P04 Active Call Controls перед планированием P05.

## Результат
- P04 phase gate closed
- `npm run test` — 141 passed
- `npm run lint` — ok
- `npm run typecheck` — ok
- Deferred: JsSIP adapters, E2E harness, P05 transfer/multi-call
