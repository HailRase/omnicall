# SIP unregistered originate preflight + failed toast

**Дата:** 2026-07-23 16:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/telephony/OutgoingCallOrchestrator.ts`
- `src/ports/telephony/TelephonyGateway.ts`, `JsSipTelephonyAdapter.ts`, `MockTelephonyGateway.ts`
- `src/shared/telephony/sipOutboundErrors.ts`
- `src/application/integration/ExternalSdkCallHandler.ts`, `externalSdkCallHelpers.ts`
- `src/application/projections/telephony/callProjection.ts`
- `src/renderer/shells/call/CallContextShell.tsx`, `OutgoingCallCard.tsx`, `useActionNotifications.ts`
- Docs: Feature-Registry F-003/F-011, P11/P02 UX, PROTOCOL/errors, DI-06 evidence

## Что
- Ранний отказ `makeCall`, если SIP не registered — до `OutgoingCallRequested` / hold-all
- SDK reply: `operation_failed` + `failure_kind: sip_not_registered` (без call events)
- Terminal `CallFailed` → Idle + `lastOutgoingFailure` → notification toast
- `OutgoingCallCard` только для Connecting (pre-line); sticky Failed-баннер убран

## Зачем
- SDK originate без регистрации не должен открывать UI-карточку; host получает стабильный код
- Оператору Axatalk — toast вместо незакрываемого баннера

## Результат
- Focused vitest (integration + CallEngine + UI hooks/card): PASS
- `tsc --noEmit`: PASS
- `npm run i18n:check`: PASS
