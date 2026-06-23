# P05 WU2 Fix Review Gaps

**Дата:** 2026-06-23 21:58
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/activeCallControlsProjection.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `docs/softphone/P05-Transfer-Domain-UX-Design.md`
- `docs/softphone/Legacy-Feature-Coverage.md`
- `src/application/services/CallEngine.blindTransfer.test.ts`

## Что
- `activeCallControlsProjection`: sync transfer events, `transfer_in_progress` disabled reason, hangup enabled during `Transferring`
- 3 transfer scenario tests в `activeCallControlsProjection.test.ts`
- Facade: `blindTransferUseCase`, `blindTransfer()`, `blindTransferById()`
- UX doc: active controls policy + `transfer_in_progress` reason
- LF-028 → ссылка на WU2 handoff
- Тест blind transfer from `Held` state
- Label `transfer_in_progress` в `ActiveCallControlsPanel`

## Зачем
Закрыть reviewer gaps после P05 WU2: projection active controls согласован с transfer flow, facade wiring для blind transfer.

## Результат
- `npm run test` — 49 files, 194 tests, green
- `npm run lint` — green
- `npm run typecheck` — green
