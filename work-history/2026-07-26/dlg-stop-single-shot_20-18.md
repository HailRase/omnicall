# OCP dlg_stop single-shot

**Дата:** 2026-07-26 20:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/telephony/telephonyCallControlOperations.ts`
- `src/application/services/telephony/IncomingCallOrchestrator.ts`
- `src/application/services/telephony/OutgoingCallOrchestrator.ts`
- `src/application/services/integration/OcpTelephonyBridgeService.ts`
- `src/adapters/integration/ocp/buildOcpCommandPayload.ts`
- `src/domain/integration/ocp/protocol/OcpCommand.ts`
- `docs/softphone/OCP-Call-Context.md`, `Feature-Registry.md`
- `ocp-integration/ocp-integration.md`, `OCP-IMPLEMENTATION-PLAN.md`, `OCP-Smoke-Checklist.md`

## Что
- Hangup не публикует второй `CallEnded`, если session-ended уже финализировал звонок
- `handleCallEnded` не публикует `CallEnded` повторно после await, если call уже untracked
- Local cancel: `failCall` пропускает `CallFailed`, если call уже terminal
- Bridge: идемпотентный `dlg_stop` + триггеры `CallRejected` / `CallRejectedByDnd`
- Wire `dlg_stop`: только `{ acallid: sipCallId }` (как `get_main_acallid`)
- Документация и тесты синхронизированы

## Зачем
- Убрать двойной `dlg_stop` при локальном сбросе исходящего и гарантировать один stop на любой terminal-сценарий без даунгрейда OCP/telephony

## Результат
- `npx vitest run` по CallEngine / OcpTelephonyBridge / OcpFullFlow / buildOcpCommandPayload / OcpProtocol — 56 passed
