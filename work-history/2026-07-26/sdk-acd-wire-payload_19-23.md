# SDK call:acd-context raw OCP payload

**Дата:** 2026-07-26 19:23
**Статус:** выполнено
**Коммит:** —

## Где
- axatalk-sdk/packages/protocol (events, constants, fixtures, api report)
- src/domain/integration/ocp/events/CallOcpContextResolved.ts
- src/application/integration/ExternalSdkEventMapper.ts
- src/application/services/integration/OcpTelephonyBridgeService.ts
- src/adapters/integration/sdkGatewayEventFanout.ts
- src/domain/settings/SdkOriginTrust.ts + matrix i18n
- docs/softphone/adr/ADR-0020-sdk-ocp-acd-context-wire.md

## Что
- `call:acd-context` передаёт полный MainCallIDInfo wire: main_acallid, acallid, event, caller_id, called_id, queue, user_login + callId
- Capability `ocp.acd_context.read` (profiles operator/call_controller + Origin matrix)
- Bridge публикует Domain event даже при пустой queue
- ADR-0020: исключение к ADR-0017 только для этого события

## Зачем
- Заказчик CRM требует сырой OCP payload с main_acallid на публичном SDK

## Результат
- protocol api:check PASS; vitest mapper/bridge/settings 23/23 PASS; i18n:check PASS
