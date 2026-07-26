# Campaign FSM + ACD snapshot

**Дата:** 2026-07-26 19:46
**Статус:** выполнено
**Коммит:** —

## Где
- src/application/projections/integration/campaignEventProjection.ts
- src/application/projections/integration/callOcpContextProjection.ts
- src/application/services/integration/OcpSessionLifecycleService.ts
- src/adapters/integration/sdkGatewaySnapshotMessage.ts
- axatalk-sdk/packages/protocol/src/snapshot.ts
- docs/softphone/OCP-Call-Context.md, ADR-0019/0020

## Что
- Campaign FSM idle/preview_offered/progressive_offered + pendingPreview hold
- Accept/reject promote pending → Cleared then Offered
- Snapshot calls[].acdContext under ocp.acd_context.read
- Docs sync; version 0.14.0

## Зачем
- Одна модалка campaign до accept/reject; новые вкладки SDK получают campaign + ACD wire из snapshot

## Результат
- vitest 53/53 PASS; protocol api:check PASS; push feature/axatalk-sdk
