# OCP transport recovery UX harden

**Дата:** 2026-07-30 22:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/integration/OcpTransportRecoveryService.ts`
- `src/application/services/integration/OcpBackedSignInOrchestrationService.ts`
- `src/application/projections/settings/authorizationProgressProjection.ts`
- `src/application/projections/settings/shouldOpenOcpSignInProgressModal.ts`
- `src/application/projections/settings/deriveOcpSignInProgressView.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/read-models/OcpProjectionHub.ts`
- docs: ADR-AF-002, Feature-Registry F-014/F-028, Legacy LF-058, UX blueprint, STATUS

## Что
- Auto-recovery больше не сбрасывает лимит попыток при in-flight `cancelAll(fresh_token_connect|sign_in_supersede)`
- `authorizationProgress.uiSurface`: `modal` | `silent` — silent не открывает Dialog этапов
- Новый attempt (`preparing`) чистит completed stages; active stage побеждает stale completed
- Exhaustion → Server `failed` + clear silent progress; banner Retry остаётся
- Тесты recovery / progress / modal gate / useAccountActions

## Зачем
- Убрать кривую модалку этапов и бесконечный HTTP-токен при моргании интернета; сохранить Login / modal Reconnect / SDK activate без даунгрейда

## Результат
- Targeted vitest suites PASS (recovery + progress + hook + OcpSignInProgress)
- Документация синхронизирована (ADR-AF-002 amendment, Registry, Legacy, UX blueprint, STATUS)
