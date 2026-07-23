# Single-shot SDK account logout

**Дата:** 2026-07-23 16:20
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/protocol` — `account:logout` вместо prepare/confirm
- `axatalk-sdk/packages/sdk` — `client.account.logout({ reasonId?, expectedRevision })`
- `src/application/integration/externalSdkLogoutCommands.ts`, `ExternalSdkOperatorHandler.ts`
- `src/adapters/integration/sdkGatewayCapabilities.ts`, `sdkGatewayRouteInbound.ts`
- docs/ADR/evidence (DI-07, SDK-07, PROTOCOL, guides)
- `../crm-sdk-demo` — UI «причина → Выйти»

## Что
- Убран `logoutToken` / prepare-confirm handshake
- Один wire-командный путь: CRM выбирает logout-причину через `getReasons`, шлёт `account:logout`
- Сохранены: `session.logout` capability, `expectedRevision`, OCP reason workflow, SIP-only без reason, cascade через `AccountLogoutOrchestrationService`
- `interaction_required` без токена: `{ requiresReason, reasons }`
- Обновлены тесты, api-check, Feature Registry, ADR-0013/0017, crm-sdk-demo

## Зачем
- UX CRM как у перерыва: выбрать причину и выйти одним запросом; softphone выполняет logout

## Результат
- Focused desktop tests PASS (operator handler / route / LocalWs operator)
- Focused SDK tests PASS; `api:check` PASS; protocol+sdk build PASS
- crm-sdk-demo `tsc -b` PASS после `file:` SDK rebuild
