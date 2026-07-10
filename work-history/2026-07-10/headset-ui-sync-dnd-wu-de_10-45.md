# Headset UI sync guards and DND (WU-D/E)

**Дата:** 2026-07-10 10:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/headset/HeadsetIntegrationService.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`
- `docs/softphone/handoffs/P10-Headset-Integration-Handoff.md`

## Что
- UI hold/resume/mute/unmute через facade ставят `HeadsetSyncQueue` guards (только при connected device)
- `setHeadsetSyncBusyListener` сразу обновляет busy projection
- DND: `phoneStatus === "dnd"` → `isDnd` в headset answer guard

## Зачем
- LF-074 parity для UI↔headset anti-echo; блокировка answer при DND с гарнитуры

## Результат
- `npx vitest run src/application/headset` — 27 passed
- `npx tsc --noEmit` — green
