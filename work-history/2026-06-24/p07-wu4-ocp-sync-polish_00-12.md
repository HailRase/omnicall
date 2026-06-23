# P07 WU4 OCP Sync Polish

**Дата:** 2026-06-24 00:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/operator/events/dlgStopEvents.ts`, `ocpNotificationEvents.ts`, `policies/DlgStopPolicy.ts`
- `src/application/use-cases/SendDlgStopUseCase.ts`, `services/CallEndDlgStopOrchestrationService.ts`
- `src/application/projections/ocpNotificationProjection.ts`, `queueInfoProjection.ts`
- `src/renderer/components/ocp/OcpToastStack.tsx`, hooks `useOcpNotifications.ts`, `useQueueLabelNaTimer.ts`
- `docs/softphone/handoffs/P07-WU4-OCP-Sync-Polish-Handoff.md`, `P07-Agent-Continuation-Handoff.md`

## Что
- Реализован exactly-once `dlg_stop` (policy, use case, orchestration на CallEnded/Failed)
- Добавлены OCP toast notifications (projection + `OcpToastStack`)
- Queue label `loading` → `na` через 5s без polling (`useQueueLabelNaTimer`)
- Mock gateway: `sendDlgStop`, inbound notification parser
- F-015 → `implemented`; phase gate P07 закрыт

## Зачем
Завершить Phase P07: синхронизация OCP при завершении звонка, уведомления и UX очереди без бесконечного loading.

## Результат
- `npm run test` — 424 passed (+21 от baseline 403)
- `npm run lint` — green
- `npm run typecheck` — green
- LF-050, LF-065, E2E — отложены в handoff
