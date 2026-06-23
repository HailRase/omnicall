# P05 WU2 Transfer Domain

**Дата:** 2026-06-23 21:49
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P05-Transfer-Domain-UX-Design.md`
- `docs/softphone/handoffs/P05-WU2-Transfer-Domain-Handoff.md`
- `src/domain/telephony/TransferEligibility.ts`, `events/callEvents.ts`
- `src/ports/telephony/TelephonyGateway.ts`
- `src/adapters/mock/MockTelephonyGateway.ts`
- `src/application/services/TransferCallControlService.ts`, `transferCallControlOperations.ts`
- `src/application/use-cases/BlindTransferUseCase.ts`
- `src/application/projections/transferProjection.ts`

## Что
- UX design artifact для blind transfer (projection-level states, reserved test IDs, WU4 out of scope)
- Domain events `CallTransferRequested` / `CallTransferred` / `CallTransferFailed` + eligibility rules
- `TelephonyGateway.blindTransfer` + mock adapter с success/failure сценариями
- `BlindTransferUseCase` → `TransferCallControlService` → `CallEngine.blindTransfer`
- `transferProjection` + подписка store; синхронизация `callProjection` для call state
- F-006 registry обновлён (`BlindTransferUseCase`); F-007 note attended → WU3
- vitest include `src/adapters/**/*.test.ts` для adapter tests

## Зачем
Phase P05 WU2: domain contracts, port, mock-only blind transfer skeleton без UI и JsSIP — foundation для WU3 attended и WU4 transfer panel.

## Результат
- `npm run test` — 49 files, 190 tests, green
- `npm run lint` — green
- `npm run typecheck` — green
- WU1 regression (`CallEngine.multiCallPolicy.test.ts`, `CallEngine.test.ts`) — green
