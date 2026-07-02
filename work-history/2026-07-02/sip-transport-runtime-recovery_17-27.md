# SIP transport timeout + runtime 403 recovery

**Дата:** 2026-07-02 17:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/application/services/SipRecoveryOrchestrationService.ts`
- `src/domain/telephony/mapSipRegistrationFailureKey.ts`
- `src/application/projections/deriveSipStatusShell.ts`
- `src/renderer/components/header/UserHeaderIdentity.tsx`
- `docs/softphone/Feature-Registry.md` (F-014)

## Что
- Таймаут подключения WebSocket: 10 с; при таймауте — `SipTransportDisconnected` и auto-reconnect по настройкам
- Runtime `registrationFailed` (403 при активной регистрации) больше не игнорируется; публикуется `RegistrationFailed`, сбрасывается effective registration, запускается auto-reregister
- Оркестрация: adapter handler публикует `RegistrationFailed`; recovery через `queueMicrotask` после проекций
- Header: таймер `MM:SS` на отдельной строке, без ellipsis
- Русское сообщение для `transport_connection_timed_out`

## Зачем
Состояние «Подключение» зависало при ERR_INTERNET_DISCONNECTED; 403 на REGISTER не снимал «Зарегистрирован»; таймер перерегистрации обрезался в header.

## Результат
`npm run test` — 1029 passed, 1 skipped; `npm run lint` и `npm run typecheck` — OK.
