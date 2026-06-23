# P07 WU3 OCP Sync UI

**Дата:** 2026-06-24 00:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/operator/events/campaignEvents.ts`
- `src/ports/operator/OcpSyncGateway.ts`
- `src/application/use-cases/RespondToCampaignUseCase.ts`
- `src/renderer/components/call/QueueInfoLabel.tsx`, `CampaignEventModal.tsx`
- `src/renderer/hooks/useIncomingCallShell.ts`, `useCampaignActions.ts`
- `docs/softphone/handoffs/P07-WU3-OCP-Sync-UI-Handoff.md`

## Что
- Domain event `CampaignEventAnswered` + factory + tests
- Port `OcpSyncGateway.respondToCampaign` + mock stub
- `RespondToCampaignUseCase` — gateway confirm до публикации события
- `QueueInfoLabel`, campaign context line, `CampaignEventModal`
- Hooks `useIncomingCallShell`, `useCampaignActions`; wiring в `App.tsx`
- Component, Use Case, integration tests; UX/registry/handoff updates

## Зачем
Вертикальный срез F-015 WU3: projection-driven queue label, campaign context на incoming modal, accept/reject campaign flow (LF-037–LF-040).

## Результат
`npm run test` — 403 passed (+15 от baseline 388); `npm run lint` — ok; `npm run typecheck` — ok. WU3 gate закрыт; dlg_stop не реализован (WU4+).
