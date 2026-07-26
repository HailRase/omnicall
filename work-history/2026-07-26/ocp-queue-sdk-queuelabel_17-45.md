# OCP queue → SDK queueLabel

**Дата:** 2026-07-26 17:45
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/protocol/src/events.ts`, `snapshot.ts`, `etc/api/protocol.api.md`
- `src/domain/integration/ocp/events/CallOcpContextResolved.ts`
- `src/application/services/integration/OcpTelephonyBridgeService.ts`
- `src/application/integration/ExternalSdkEventMapper.ts`, `ExternalSdkSnapshotAssembler.ts`, `readSdkProductStateFromStore.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `docs/softphone/OCP-Call-Context.md`, ADR-0017, Feature-Registry, STATUS, Legacy, CHANGELOG

## Что
- Добавлено additive optional `queueLabel` в протокол (call events + snapshot)
- Bridge публикует `CallOcpContextResolved` при непустой ACD-очереди (без `acallid`)
- Mapper/snapshot прокидывают `queueLabel` в публичный SDK; campaign по-прежнему out of v1
- Документация: legacy CustomEvent → Axatalk map + примеры `subscribe` / snapshot

## Зачем
- Заменить legacy `OCPincomingCallProgress` / DOM bus на архитектурно корректный путь Domain → SDK без даунгрейда и без `window.Softphone`

## Результат
- `vitest` focused: mapper/assembler/bridge/integration — PASS (23)
- `axatalk-sdk` `api:check` — PASS
- Версия desktop не bump’илась (запись в CHANGELOG `[Unreleased]`; cut через `/release`)
