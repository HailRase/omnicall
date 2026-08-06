# OCP progress honesty (immediate failure)

**Дата:** 2026-08-06 12:01
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/ocp/OcpSignInProgress.ts`
- `src/application/projections/settings/deriveOcpSignInProgressView.ts`
- `src/application/services/integration/OcpBackedSignInOrchestrationService.ts`
- `src/application/services/integration/OcpSipCredentialService.ts`
- `src/renderer/components/account/OcpSignInProgress*.tsx`
- `docs/softphone/adr/ADR-AF-002-ocp-transport-auth-dual-fsm.md`, Feature-Registry, STATUS, UX blueprint, I18N-Coverage, CHANGELOG

## Что
- Убран latent blue fill: ошибка этапа показывается сразу с реальным `failureKind`
- Добавлен этап `receiving_phone_credentials`; budget credentials стартует после OCP authorized
- Таймауты этапов выровнены с Application waiters (SDK budget 115s сохранён)
- Toast `authFeedback` подавляется, пока открыта progress-модалка
- Статус timeout + i18n `stage.receiveCredentials` (ru/en/fr/de/bg)

## Зачем
- Не вводить оператора в заблуждение ожиданием конца бара после уже известного fail.

## Результат
- Тесты progress/credential/orchestration/sdkActivate/i18n — green; `npm run i18n:check` — green
