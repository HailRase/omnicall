# R3-1 Outbound async answered fix

**Дата:** 2026-06-24 15:58
**Статус:** выполнено
**Коммит:** `7899746` (незакоммичено)

## Где
- `src/ports/telephony/TelephonyGateway.ts`
- `src/adapters/telephony/jssip/wireJsSipRtcSessionLifecycle.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/services/CallEngine.ts`
- `src/application/services/OutgoingCallOrchestrator.ts`
- `src/application/projections/callProjection.ts`
- `src/adapters/mock/MockTelephonyGateway.ts`
- тесты: `JsSipTelephonyAdapter.test.ts`, `CallEngine.test.ts`

## Что
- Добавлен `setCallAnsweredHandler` / `TelephonyCallAnsweredNotification` в порт TelephonyGateway
- Исходящие сессии JsSIP слушают `confirmed` после progress и уведомляют приложение
- Bootstrap связывает handler с `CallEngine.handleOutboundCallAnswered` (идемпотентно при уже Active)
- Ringback включается на SIP 180 (локальный тон) и 183
- Проекция `CallProgressReceived` переводит state в `Ringing`
- Тесты: deferred answer после 180, adapter confirmed после progress

## Зачем
Исходящий вызов застревал в Connecting/progress, т.к. `executeJsSipOutboundCall` завершался на 180/183 и терял асинхронный `confirmed` от SBC.

## Результат
- `npm run test` — 546 passed
- `npm run lint` — ok
- `npm run typecheck` — ok
- Retest R3-1 через Smoke Conductor; обновить PROGRESS.md при PASS
