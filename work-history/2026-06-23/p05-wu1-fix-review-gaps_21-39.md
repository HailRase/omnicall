# P05 WU1 Review Gaps Fix

**Дата:** 2026-06-23 21:39
**Статус:** выполнено
**Коммит:** —

## Где
- `MultiCallPolicyService.ts`, `callEvents.ts` (`HoldAllPhase: failed`)
- `multiCallProjection.ts`, `IncomingCallActions.tsx`, `MultiCallHoldAllIndicator.tsx`, `App.tsx`
- `useIncomingCallActions.ts`, `P05-Multi-Call-Policy-UX-Design.md`
- Tests: `CallEngine.multiCallPolicy.test.ts`, `multiCallProjection.test.ts`, renderer test IDs

## Что
- Hold-all failure: `AllOtherCallsHeld` `phase: failed` rollback, projection сбрасывает `holdAllInProgress`
- UX: `incoming-answer-disabled-reason`, `multi-call-hold-all-indicator`, UX doc test IDs = `dialpad-disabled-reason`
- Удалён неиспользуемый `exclusive_hold_active_elsewhere`; UX: silent auto-hold, failure через P04 resume
- `handleAnswerIncoming` guard + import `deriveIncomingAnswerDisabledReason` из `@application/index.js`

## Зачем
- Закрыть gaps reviewer после P05 WU1 multi-call policy foundation.

## Результат
- `npm run test` — 162 passed; `npm run lint`, `npm run typecheck` — green
- P04 `CallEngine.test.ts` regression — green
