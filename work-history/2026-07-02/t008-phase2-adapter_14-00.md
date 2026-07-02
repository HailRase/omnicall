# T-008 Phase 2 — JsSIP Adapter

**Дата:** 2026-07-02 14:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/telephony/TelephonyGateway.ts`, `src/ports/index.ts`
- `src/adapters/telephony/jssip/JsSipUaPort.ts`, `JsSipTelephonyAdapter.ts`
- `src/adapters/mock/MockTelephonyGateway.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.test.ts`
- `src/application/use-cases/ReregisterSipUseCase.test.ts`

## Что
- Порт: `setTransportConnectingHandler`, `setTransportConnectedHandler`, `forceRefreshRegistration`
- JsSIP: слушатели `connecting`/`connected`/`disconnected`; `registrationInvalidated` на disconnect
- `effectiveIsRegistered()` = `isConnected && isRegistered && !invalidated`; guards в makeCall/reconnect/reregister
- `forceRefreshRegistration`: unregister all + register
- Mock: transport state, simulate connecting/connected, forceRefresh
- 5 новых unit-тестов адаптера; фикс ReregisterSipUseCase tests под transport guard

## Зачем
Adapter-слой публикует transport lifecycle и не доверяет stale `isRegistered()` после disconnect (ADR-0004).

## Результат
970 tests passed, 1 skipped; lint + typecheck green.
