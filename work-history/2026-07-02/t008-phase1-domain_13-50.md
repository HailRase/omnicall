# T-008 Phase 1 — Domain layer

**Дата:** 2026-07-02 13:50
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/SipTransportState.ts`, `SipSessionHealth.ts`, `sipAuthErrorPolicy.ts`
- `src/domain/telephony/events/sipTransportEvents.ts`
- `src/domain/settings/UserSettings.ts` (v2), `validateUserSettings.ts`, `migrateUserSettings.ts`, `SipRecoverySettings.ts`
- `src/domain/index.ts`

## Что
- FSM `SipTransportState` с unit-тестами
- Value object `SipSessionHealth` + инварианты ADR-0004 + `applySipTransportLoss` / `applySipSessionReset`
- Transport domain events: `SipTransport*`, `SipRegistrationCleared`, manual actions, `SipSessionActivated/Reset`
- `sipAuthErrorPolicy` — non-retryable 401/403
- UserSettings v2: transport recovery fields + `sipAutoRegisterOnStartup`; миграция v0/v1→v2
- `buildSipTransportRecoveryPolicy` + `buildSipRegistrationRecoveryPolicy`

## Зачем
Доменный фундамент для ортогональности transport/registration перед adapter и orchestration фазами T-008.

## Результат
965 tests passed, 1 skipped; lint + typecheck green.
