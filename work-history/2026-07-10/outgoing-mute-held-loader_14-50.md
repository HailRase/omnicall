# Outgoing mute block + held loader

**Дата:** 2026-07-10 14:50
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/buildHeadsetCallSnapshot.ts`
- `docs/softphone/Feature-Registry.md` (F-012)

## Что
- Reject headset mute на incoming/outgoing до sync-lock (всегда restore LED)
- `mutedBySessionId` + clear mute intent по сессии mute, не по focus (held mute при outgoing focus)
- Timeout mute intent сбрасывает UI busy (loader не зависает)

## Зачем
- На исходящем нельзя toggle mute с гарнитуры (как на входящем)
- Mute held при активном outgoing не должен оставлять loader на controls bar

## Результат
- `npx vitest run src/application/headset` — 67 passed
