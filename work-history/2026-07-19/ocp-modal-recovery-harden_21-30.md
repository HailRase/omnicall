# Harden OCP Sign-In Progress Recovery

**Дата:** 2026-07-19 21:30
**Статус:** выполнено
**Коммит:** `1920314`
**Версия:** 0.11.1

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/services/integration/OcpBackedSignInOrchestrationService.ts`
- `src/application/services/integration/OcpSipCredentialService.ts`
- `src/application/projections/settings/authorizationRetryContext.ts`
- `src/application/read-models/OcpProjectionHub.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/account/OcpSignInProgress.tsx`
- `docs/softphone/Feature-Registry.md` (F-028)
- `CHANGELOG.md`, `package.json`, release manifests

## Что
- Добавлен Facade `recoverOcpSignInFromModal` — единый owner modal Reconnect (не `signInAccount`).
- Orchestration: run ownership + guards на progress/failure; cancel не сбрасывает ownership чужого run.
- `OcpSipCredentialService`: apply-epoch checkpoints (authorize → promote → register).
- `cancelOcpSignInAttempt`: stable OCP idle без logout/unregister SIP; typed disconnect failure.
- Немедленный visible recovery stage; a11y live status; i18n «Disconnect OCP».
- Уточнён cold-idle guard в `OcpProjectionHub.applyServerState`.

## Зачем
Modal Reconnect после ADR-AF-005 ломался на identity gate; cancelled attempts писали stale progress и продолжали SIP side effects.

## Результат
- `npm test` — 2296 passed
- `npm run lint` / `typecheck` / `i18n:check` / `registry:check` — ok
- Staging OCP smoke — не выполнялся (только mock/unit)
