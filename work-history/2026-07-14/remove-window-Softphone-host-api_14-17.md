# Remove window.Softphone host API

**Дата:** 2026-07-14 14:17
**Статус:** выполнено
**Коммит:** —

## Где
- удалён `src/adapters/integration/host/HostSoftphoneOcpApiAdapter*`
- `src/shared/host-api/OcpHostApiContract.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useAccountBootstrap.ts`
- docs: Feature-Registry, Legacy, Roadmap, Architecture, OCP plan, integration-contract-review skill

## Что
- Убраны `window.Softphone`, Softphone host adapter, `authenticateOCPModule` listener, `installOcpHostApi`
- Оставлены Facade external methods + `OcpHostApiContract` как задел под `ExternalClientGateway` / `ExternalCommandRouter`
- Документация: Softphone не портируется; P12 → WS gateway

## Зачем
Legacy Softphone был для script-embed виджета; в Electron вкладки будут через сокет в main, не через DOM global.

## Результат
- Related tests green (39)
- Lint/typecheck на изменённых исходниках
