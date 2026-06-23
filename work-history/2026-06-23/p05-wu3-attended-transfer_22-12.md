# P05 WU3 Attended Transfer Core

**Дата:** 2026-06-23 22:12
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P05-Attended-Transfer-UX-Design.md`
- `src/domain/telephony/CallRelationship.ts`, `AttendedTransferEligibility.ts`
- `src/application/services/attendedTransferOperations.ts`
- `src/application/projections/multiLineCallProjection.ts`
- `docs/softphone/handoffs/P05-WU3-Attended-Transfer-Handoff.md`

## Что
- UX-дизайн attended transfer до orchestration (states, roles, disabled reasons, test IDs reserved)
- Domain: `TransferSession`, eligibility rules, attended transfer events
- Port + mock: `TelephonyGateway.attendedTransfer`
- `StartConsultationUseCase`, `AttendedTransferUseCase`, CallEngine integration
- Multi-line projection + store subscribe (без React panel)
- Feature Registry F-007 WU3, handoff LF-029 evidence

## Зачем
Phase P05 WU3 — attended transfer core на mock gateway с multi-line read model для последующего WU4 UI.

## Результат
- `npm run test`: 213 passed
- `npm run lint`: green
- `npm run typecheck`: green
