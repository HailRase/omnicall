# F-028 E-10/E-11 OCP telephony bridge + SIP creds

**Дата:** 2026-07-14 13:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/integration/OcpSipCredentialService.ts`
- `src/application/services/integration/OcpIntegrationComposition.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/integration/OcpTelephonyBridge.integration.test.ts`
- `src/application/use-cases/settings/AuthorizeSipAccountUseCase.ts`
- `src/domain/shared/events/accountBootstrapEvents.ts`
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- E-10: подтверждён полный `OcpTelephonyBridgeService` + `selectIsCallButtonBlocked`; integration-тесты lifecycle; i18n keys для dialpad/reject
- E-11: `OcpSipCredentialService` вызывает `AuthorizeSipAccountUseCase` (`source: "ocp"`) + `RegisterAccountUseCase` с guards `autoSipAuth` / `sipRegistered`
- OCP source redacts password в `SipCredentialsReceived`; пароль не логируется
- Facade wiring: `ocpAutoSipAuthEnabled` + composition deps
- UI dialpad block + reject-with-break вынесены в TASK-QUEUE **T-025** `/ui`

## Зачем
Закрыть application-слой F-028 E-10/E-11: SIP↔OCP call sync и авто-SIP из OCP creds без React.

## Результат
- `npm run test` — 1982 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
- Следующий шаг: `/ui` T-025 или `/logic` E-12
