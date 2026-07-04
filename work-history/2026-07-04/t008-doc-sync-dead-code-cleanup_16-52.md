# T-008 doc sync + dead code cleanup

**Дата:** 2026-07-04 16:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/telephony/sipAuthErrorPolicy.ts` (удалён)
- `src/application/projections/ocpConnectionRecoveryProjection.ts`, `deriveSipManualRetryGate.ts`
- `src/application/read-models/InMemorySipSessionHealthReadModel.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`
- `docs/softphone/adr/ADR-0004-sip-session-health.md`, `TRANSPORT-REGISTER-STATE-REFACTORING.md`
- `docs/softphone/Feature-Registry.md`, `Legacy-Feature-Coverage.md`, `STATUS.md`
- `docs/softphone/UI-Architecture.md`, `I18N-Coverage.md`, `UX-UI-Design-Blueprint.md`

## Что
- Удалена политика non-retryable 401/403 (`sipAuthErrorPolicy`); единая auto-reregister для всех ошибок REGISTER
- Удалён `connectionRecoveryProjection` из store; SIP read model — только `sipSessionHealthProjection`
- OCP-deferred path: `ocpConnectionRecoveryProjection` + read models для `RetryConnectionUseCase`
- Удалён мёртвый код: overlay/shell/hooks recovery, `useReconnectCountdown`, `mapConnectionRecoveryDisabledReason`
- Доки синхронизированы с кодом: F-001/F-014 → implemented, LF-008/LF-010 evidence, ADR §1.7

## Зачем
Закрыть замечания review T-008: docs ↔ code parity, без special-case auth retry, без dual projection в UI store.

## Результат
- `npm run test`: 1024 passed, 1 skipped
- `npm run lint`, `npm run typecheck`, `npm run i18n:check`: green
