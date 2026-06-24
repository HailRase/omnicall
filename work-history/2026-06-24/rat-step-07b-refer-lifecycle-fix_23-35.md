# RAT step 07b REFER lifecycle fix

**Дата:** 2026-06-24 23:35
**Статус:** выполнено (код; manual smoke pending)
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/executeJsSipRefer.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/application/services/transferCallControlOperations.ts`
- `src/domain/telephony/CallStateMachine.ts`
- `src/application/projections/transferProjection.ts`

## Что
- `executeJsSipRefer`: слушает `requestSucceeded` (202); success при `ended` после 202 без NOTIFY failed
- Off-net Refer-To: `sip:n@domain` вместо `tel:` (smoke: tel ломал сценарий)
- `referInFlightCallIds`: блок premature `callEnded` во время REFER
- FSM: `ended` из `Transferring`; terminal cleanup при session ended до 202
- `transferProjection`: сброс `transferring` на `CallEnded`

## Зачем
Smoke B: `tel:80336647132` → «SIP session ended before REFER completed», UI зависал в Transfer in progress.

## Результат
599 passed, 1 skipped; lint/typecheck green. Повторить smoke B на dev SBC.
