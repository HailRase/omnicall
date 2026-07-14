# F-028 E-12 Host-Page API

**Дата:** 2026-07-14 14:08
**Статус:** выполнено (частично superseded — Softphone global снят 14:17)
**Коммит:** —

## Где
- `src/shared/host-api/OcpHostApiContract.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- ~~`HostSoftphoneOcpApiAdapter`~~ — удалён в `remove-window-Softphone-host-api_14-17.md`

## Что
- Typed `OcpHostApiContract` + Facade external methods (`callType: external`)
- ~~`window.Softphone.ocpModule` adapter~~ — снят: не нужен в Electron (будет ExternalClientGateway)

## Зачем
Задел под внешние команды OCP без legacy embed-global.

## Результат
См. follow-up `remove-window-Softphone-host-api_14-17.md`
