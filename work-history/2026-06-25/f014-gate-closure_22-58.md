# F-014 SIP Registration Retry — gate closure

**Дата:** 2026-06-25 22:58
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/SipRecoveryOrchestration.integration.test.ts`
- `src/application/use-cases/ReregisterSipUseCase.test.ts`
- `src/application/facades/AccountBootstrapFacade.ts` (`simulateSipRegistrationFailed`)
- `src/application/projections/deriveConnectionRecoveryShell.test.ts`
- `src/renderer/components/recovery/ConnectionOverlay.test.tsx`
- `docs/softphone/handoffs/P08-SIP-Registration-Retry-Handoff.md`
- `docs/softphone/UI-Component-Catalog.md`
- `docs/softphone/Legacy-Feature-Coverage.md`, `STATUS.md`

## Что
- Два integration-сценария registration retry (success chain + terminal → manual_retry_available)
- Unit-тесты `ReregisterSipUseCase` (success, gateway failure, throw)
- `deriveConnectionRecoveryShell.test.ts` на `SipRegistrationRetry*` после `RegistrationFailed`
- `ConnectionOverlay.test.tsx`: `sip_registration_failed`, RU reason, `reregister-in-progress`
- UI catalog: SettingsOverlay SIP test ids; ConnectionOverlay без static `reconnect-in-progress`
- Handoff P08 с gate checklist; LF-008/LF-010 evidence; STATUS F-014 closed note

## Зачем
Закрыть gate F-014 после review: тесты, catalog drift, handoff и legacy evidence.

## Результат
`npm run test` 704 passed, 1 skipped; `npm run lint` + `npm run typecheck` green. `ui:catalog` regenerated; `ui:catalog:check` требует коммита catalog.
