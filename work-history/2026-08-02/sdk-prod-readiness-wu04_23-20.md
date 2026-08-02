# OmniCall SDK Production-Readiness — WU-04 (Dedup isolation)

**Дата:** 2026-08-02 23:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayRequestDedup.ts` (+ test)
- `src/adapters/integration/sdkGatewayDedupGate.ts`
- `src/adapters/integration/sdkGatewayProductDispatch.ts`
- `src/adapters/integration/sdkGatewaySessionDispatch.ts`
- `src/adapters/integration/sdkGatewayActivateApproval.ts` / `sdkGatewaySnapshotDispatch.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts`
- `src/adapters/integration/LocalWsServerAdapter.call.test.ts`
- `omnicall-kit-integration/sdk-production-readiness/` (PROGRESS, ACCEPTANCE §D, AGENT-CONTINUATION)
- PROTOCOL.md / SECURITY.md; Feature Registry F-011; STATUS; P12 handoff; TASK-QUEUE

## Что
- Dedup key → Origin + clientId + requestId (unauth → connection-scoped)
- Pending owner + abandon on disconnect/failure; TTL prune pending+done; bounded size (256)
- Waiters settle with typed `{outcome: reply|abandoned}`; stale owner cannot complete
- Multi-client collision + disconnect-abandon integration tests
- Acceptance §D green; continuation prompt for WU-05

## Зачем
Устранить cross-client replay coupling и forever-pending slots (ADR-0027 / findings 6–7).

## Результат
- Acceptance §D green; Client A не может украсть reply Client B по shared requestId
- `npx vitest run` (7 files / 56 tests) — pass
- Следующий шаг: WU-05 Pairing Origin+clientId; запросить `/sdk-review` для WU-04
