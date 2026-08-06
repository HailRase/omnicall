# OmniCall SDK Production-Readiness — WU-03 (SDK latest-known revision tracker)

**Дата:** 2026-08-02 23:14
**Статус:** выполнено
**Коммит:** —

## Где
- `omnicall-kit/packages/sdk/src/internal/latest-known-revision.ts` (+ test)
- `omnicall-kit/packages/sdk/src/internal/product-orchestrator.ts`
- `omnicall-kit/packages/sdk/src/internal/product-commands.ts` (`observeReplyRevision`)
- command APIs: call/window/operator/account activate/logout
- `omnicall-kit/packages/sdk/src/public/omnicall-client.ts` / `omnicall-client-api.ts`
- `omnicall-kit/packages/sdk/src/public/omnicall-client.revision.test.ts`
- docs: SDK README, guide, PROTOCOL, ARCHITECTURE, CHANGELOG Unreleased
- `omnicall-kit-integration/sdk-production-readiness/` (PROGRESS, ACCEPTANCE §C, AGENT-CONTINUATION)
- Feature Registry F-011; STATUS; P12 handoff; TASK-QUEUE; ADR-0027

## Что
- Добавлен отдельный monotonic latest-known revision tracker (не мутирует snapshot cache)
- Обновление из snapshot / ok replies / public events / `stale_state.currentRevision` только для active serverInstanceId+sessionEpoch
- `getRevision()` читает tracker; clear на disconnect/reconnect/revoke/incompatible/failed
- Без auto-replay мутаций; тесты на все переходы Acceptance §C
- Документация публичного DX + continuation prompt для WU-04

## Зачем
Убрать fragile cache-only `getRevision()` bookkeeping для CRM `expectedRevision` (ADR-0027).

## Результат
- Acceptance §C green
- `npx vitest run` (6 files / 92 tests focused) — pass
- Следующий шаг: WU-04 Dedup Origin+clientId+requestId; запросить `/sdk-review` для WU-03
