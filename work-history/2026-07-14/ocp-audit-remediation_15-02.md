# F-028 OCP Audit Remediation

**Дата:** 2026-07-14 15:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/integration/OcpSessionLifecycleService.ts`
- `src/application/services/integration/OcpSipCascadeBridgeService.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/ports/integration/OcpGateway.ts`, `OcpNotificationPresenter.ts`
- `src/renderer/hooks/useOcp*.ts`, `useOperatorStatusSelector.ts`, `useAccountBootstrapStore.ts`
- `src/shared/host-api/OcpHostApiContract.ts`
- `docs/softphone/Feature-Registry.md`, `Legacy-Feature-Coverage.md`, `STATUS.md`
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`

## Что
- LF-049: server `terminate` → `sessionClosed` + Domain Events + SIP cascade без UI
- Facade — единственная command surface для renderer/host (logout/status/campaign/projections)
- Публикация Operator* Domain Events на реальных переходах
- Notification sink через port `setHandler` (без `instanceof` adapter)
- `maybeAutoConnectOcp` при bootstrap (enabled + autoConnect + token)
- Docs/registry/legacy evidence обновлены; ExternalClientGateway не заявлен

## Зачем
Закрыть post-implementation audit blockers/highs F-028 без регрессий SIP-only и без реализации EXT gateway.

## Результат
- `npm run test` — 2019 passed, 1 skipped
- `npm run lint` / `typecheck` / `i18n:check` — green
- SemVer не поднимался (correctness/architecture remediation)
