# P05 WU1 Multi-Call Policy Foundation

**Дата:** 2026-06-23 21:35
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P05-Multi-Call-Policy-UX-Design.md`
- `docs/softphone/handoffs/P05-WU1-Multi-Call-Policy-Handoff.md`
- `src/domain/telephony/MultiCallPolicy.ts`
- `src/application/services/MultiCallPolicyService.ts`
- `src/application/projections/multiCallProjection.ts`
- `src/ports/settings/SettingsRepository.ts`, `InMemorySettingsRepository`

## Что
- UX-документ multi-call policy до UI-кода (LF-021/023/032, disabled reasons, hold-all batch)
- Domain policy + unit tests; события `AllOtherCallsHeld`, `SecondSessionBlocked`
- `getMultiCallSettings()` в Settings port; orchestration hold-all / block second session / exclusive resume
- `CallTracker` multi-call queries; отдельная `multiCallProjection`; wiring dialpad + incoming answer
- Feature Registry F-006/F-007 → `in_progress`; evidence в handoff и Legacy-Feature-Coverage

## Зачем
- Phase P05 WU1: фундамент multi-call policy без transfer UI/REFER (WU2–WU4).

## Результат
- `npm run test` — 155 passed; `npm run lint`, `npm run typecheck` — green
- P04 `CallEngine.test.ts` regression — green
